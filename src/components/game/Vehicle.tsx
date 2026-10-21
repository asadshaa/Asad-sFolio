"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Matrix4, Quaternion, Vector3, type Group } from "three";
import { VEHICLE, WORLD } from "@/config/world";
import { getSampler, getWorld, roadFrame } from "@/lib/world/world";
import { dampFactor, moveTowards } from "@/lib/noise";
import { keys, requests, touchInput, vehicle } from "@/state/runtime";
import { useGame } from "@/state/gameStore";
import { sound } from "@/lib/audio";
import { CarModel } from "./CarModel";

const R = WORLD.radius;
const HW = WORLD.road.halfWidth;

// Scratch objects (no allocations inside the frame loop).
const next = new Vector3();
const nDir = new Vector3();
const tmp = new Vector3();
const side = new Vector3();
const front = new Vector3();
const back = new Vector3();
const left = new Vector3();
const right = new Vector3();
const vx = new Vector3();
const vy = new Vector3();
const vz = new Vector3();
const basis = new Matrix4();
const targetQ = new Quaternion();
const yawQ = new Quaternion();

interface Ground {
  height: number;
  water: boolean;
  offroad: boolean;
  index: number;
}
const ground: Ground = { height: R, water: false, offroad: false, index: 0 };

/** Ground radius under a unit direction: road ribbon height on the road, terrain elsewhere. */
function groundAt(dir: Vector3, hint: number): Ground {
  const t = getSampler().sampleTerrain(dir.x, dir.y, dir.z, hint);
  const onRoad = t.roadDist < HW + 0.1;
  ground.height = R + (onRoad ? t.h + 0.075 : Math.max(t.h, WORLD.waterLevel)) + VEHICLE.rideHeight;
  ground.water = t.water && !onRoad && t.pad < 0.5;
  ground.offroad = !onRoad;
  ground.index = t.roadIndex;
  return ground;
}

function heightAt(p: Vector3, hint: number) {
  tmp.copy(p).normalize();
  return groundAt(tmp, hint).height;
}

/** Place the car on the road at a sample index, facing along the road. */
export function placeOnRoad(index: number, reverse = false) {
  const i = roadFrame(index, vehicle.position, vehicle.forward);
  if (reverse) vehicle.forward.negate();
  vehicle.up.copy(vehicle.position).normalize();
  vehicle.position.setLength(groundAt(vehicle.up, i).height);
  vehicle.speed = 0;
  vehicle.steer = 0;
  vehicle.roadIndex = i;
  vehicle.stuckTime = 0;
  side.crossVectors(vehicle.up, vehicle.forward).normalize();
  basis.makeBasis(side, vehicle.up, vehicle.forward);
  vehicle.quaternion.setFromRotationMatrix(basis);
  vehicle.initialized = true;
}

function resetToRoad() {
  const n = getSampler().nearestRoad(vehicle.up.x, vehicle.up.y, vehicle.up.z);
  tmp.fromArray(getWorld().road.tangents, n.index * 3);
  placeOnRoad(n.index, tmp.dot(vehicle.forward) < 0);
}

export function Vehicle() {
  const root = useRef<Group>(null);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const g = useGame.getState();
    if (!vehicle.initialized) placeOnRoad(0);

    if (requests.reset) {
      requests.reset = false;
      resetToRoad();
      requests.cameraSnap = false;
      g.setStuckHint(false);
    }

    if (requests.teleport) {
      const { id, projectId, tab } = requests.teleport;
      requests.teleport = null;
      const l = getWorld().landmarks.find((x) => x.id === id);
      if (l) {
        placeOnRoad(l.roadIndex - 6);
        requests.cameraSnap = true;
        g.openSection(id, { projectId, tab });
      }
    }

    const paused = g.phase === "paused";
    // Overlays (map, terminal, celebration) take over input: the car brakes gently.
    const driving = g.phase === "driving" && !g.mapOpen && !g.terminalOpen && !g.celebrating;

    if (!paused) {
      /* ── input ── */
      const gas = driving && (keys.forward || touchInput.gas);
      const brake = driving && (keys.back || touchInput.brake);
      const hand = driving && keys.handbrake;
      const steerIn = driving
        ? Math.max(-1, Math.min(1, (keys.left ? 1 : 0) - (keys.right ? 1 : 0) + touchInput.steer))
        : 0;

      /* ── longitudinal ── */
      const v0 = vehicle.speed;
      let a = 0;
      if (gas) a += v0 < -0.3 ? VEHICLE.brakeDeceleration : VEHICLE.acceleration * (1 - 0.45 * Math.max(0, v0) / VEHICLE.maxSpeed);
      if (brake) a -= v0 > 0.3 ? VEHICLE.brakeDeceleration : VEHICLE.reverseAcceleration;
      a -= v0 * (VEHICLE.dragLinear + (vehicle.offroad ? VEHICLE.offroadDrag : 0));
      if (!gas && !brake) a -= Math.sign(v0) * VEHICLE.rolling;
      let v = v0 + a * dt;
      if (!gas && !brake && Math.sign(v) !== Math.sign(v0)) v = 0;
      if (hand || (!driving && g.phase !== "intro")) v = moveTowards(v, 0, VEHICLE.handbrakeDeceleration * dt);
      if (!driving) v = moveTowards(v, 0, VEHICLE.brakeDeceleration * 0.5 * dt);
      const cap = VEHICLE.maxSpeed * (vehicle.offroad ? VEHICLE.offroadSpeedFactor : 1);
      if (v > cap) v = moveTowards(v, cap, 14 * dt);
      if (v < -VEHICLE.maxReverse) v = -VEHICLE.maxReverse;
      vehicle.longitudinal = (v - v0) / Math.max(dt, 1e-4);
      vehicle.speed = v;
      vehicle.throttle = gas ? 1 : 0;

      /* ── steering ── */
      const speedRatio = Math.min(1, Math.abs(v) / VEHICLE.maxSpeed);
      const steerTarget = steerIn * VEHICLE.steerMax * (1 - VEHICLE.steerSpeedFalloff * speedRatio);
      const rate = steerIn === 0 ? VEHICLE.steerReturnRate : VEHICLE.steerRate;
      vehicle.steer = moveTowards(vehicle.steer, steerTarget, rate * dt);
      let yawRate = (v / VEHICLE.wheelbase) * Math.tan(vehicle.steer);
      if (hand && Math.abs(v) > 3) yawRate *= 1.5;
      vehicle.lateral = v * yawRate;
      yawQ.setFromAxisAngle(vehicle.up, yawRate * dt);
      vehicle.forward.applyQuaternion(yawQ);

      /* ── integrate along the surface ── */
      const groundNow = vehicle.position.length();
      if (Math.abs(v) > 1e-4) {
        next.copy(vehicle.position).addScaledVector(vehicle.forward, v * dt);
        nDir.copy(next).normalize();
        const gNext = groundAt(nDir, vehicle.roadIndex);
        const step = Math.abs(v * dt);
        const rise = gNext.height - groundNow;
        const tooSteep = gNext.offroad && rise > 0 && rise / Math.max(step, 1e-4) > VEHICLE.maxSlope;
        if (gNext.water || tooSteep) {
          // Shoreline / cliff: soft stop with a little bounce back.
          if (Math.abs(v) > 2) {
            vehicle.bump = 0;
            vehicle.bumpStrength = Math.abs(v);
            sound.thud(Math.abs(v));
          }
          vehicle.speed = -v * 0.2;
        } else {
          vehicle.position.copy(nDir).multiplyScalar(gNext.height);
          vehicle.offroad = gNext.offroad;
          vehicle.roadIndex = gNext.index;
        }
      } else {
        vehicle.up.copy(vehicle.position).normalize();
        vehicle.position.setLength(groundAt(vehicle.up, vehicle.roadIndex).height);
      }

      /* ── obstacle collisions (soft circles on the tangent plane) ── */
      const cr = VEHICLE.collisionRadius;
      const colliders = getWorld().colliders;
      const p = vehicle.position;
      vehicle.up.copy(p).normalize();
      for (let i = 0; i < colliders.length; i++) {
        const c = colliders[i];
        const dx = p.x - c.x,
          dy = p.y - c.y,
          dz = p.z - c.z;
        const lim = c.r + cr;
        if (dx * dx + dy * dy + dz * dz > (lim + 2) * (lim + 2)) continue;
        tmp.set(dx, dy, dz);
        tmp.addScaledVector(vehicle.up, -tmp.dot(vehicle.up));
        const dist = tmp.length();
        if (dist >= lim || dist < 1e-5) continue;
        tmp.divideScalar(dist);
        p.addScaledVector(tmp, lim - dist);
        const into = vehicle.forward.dot(tmp) * Math.sign(vehicle.speed || 1);
        if (into < 0) {
          const s = Math.abs(vehicle.speed);
          if (s > 1.5) {
            vehicle.bump = 0;
            vehicle.bumpStrength = s;
            sound.thud(s);
          }
          // Head-on: bounce back gently. Glancing: scrub speed and slide along.
          vehicle.speed = into < -0.6 ? -vehicle.speed * 0.25 : vehicle.speed * 0.75;
        }
        vehicle.up.copy(p).normalize();
        p.setLength(groundAt(vehicle.up, vehicle.roadIndex).height);
      }

      /* ── re-orthonormalize heading on the new tangent plane ── */
      vehicle.up.copy(vehicle.position).normalize();
      vehicle.forward.addScaledVector(vehicle.up, -vehicle.forward.dot(vehicle.up)).normalize();

      /* ── visual orientation from terrain under the wheels ── */
      side.crossVectors(vehicle.up, vehicle.forward).normalize();
      front.copy(vehicle.position).addScaledVector(vehicle.forward, 0.95);
      back.copy(vehicle.position).addScaledVector(vehicle.forward, -0.95);
      left.copy(vehicle.position).addScaledVector(side, 0.6);
      right.copy(vehicle.position).addScaledVector(side, -0.6);
      front.setLength(heightAt(front, vehicle.roadIndex));
      back.setLength(heightAt(back, vehicle.roadIndex));
      left.setLength(heightAt(left, vehicle.roadIndex));
      right.setLength(heightAt(right, vehicle.roadIndex));
      vz.subVectors(front, back).normalize();
      vx.subVectors(left, right).normalize();
      vy.crossVectors(vz, vx).normalize();
      vx.crossVectors(vy, vz).normalize();
      basis.makeBasis(vx, vy, vz);
      targetQ.setFromRotationMatrix(basis);
      vehicle.quaternion.slerp(targetQ, dampFactor(14, dt));

      /* ── stuck detection ── */
      if ((gas || brake) && Math.abs(vehicle.speed) < 0.3) vehicle.stuckTime += dt;
      else if (Math.abs(vehicle.speed) > 1) vehicle.stuckTime = 0;
      g.setStuckHint(vehicle.stuckTime > 2.5);

      vehicle.bump += dt;
      vehicle.wheelSpin += (vehicle.speed * dt) / VEHICLE.wheelRadius;

      /* ── visuals ── */
      const rollTarget = Math.max(-1, Math.min(1, -vehicle.lateral * 0.012)) * 0.09;
      const pitchTarget = Math.max(-1, Math.min(1, -vehicle.longitudinal * 0.03)) * 0.045;
      vehicle.bodyRoll += (rollTarget - vehicle.bodyRoll) * dampFactor(8, dt);
      vehicle.bodyPitch += (pitchTarget - vehicle.bodyPitch) * dampFactor(8, dt);
      vehicle.braking = (brake && vehicle.speed > 0.3) || hand;

      sound.update(vehicle.speed / VEHICLE.maxSpeed, vehicle.throttle, vehicle.offroad, driving);
    } else {
      sound.update(0, 0, false, false);
    }

    if (root.current) {
      root.current.position.copy(vehicle.position);
      root.current.quaternion.copy(vehicle.quaternion);
    }
  }, -2);

  return (
    <group ref={root}>
      <CarModel />
    </group>
  );
}
