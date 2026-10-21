"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, type PerspectiveCamera } from "three";
import { CAMERA, DISPLAY_LAYOUT, VEHICLE, WORLD, displayArc, displayedProjects } from "@/config/world";
import { getSampler, getWorld } from "@/lib/world/world";
import { dampFactor } from "@/lib/noise";
import { requests, vehicle } from "@/state/runtime";
import { useGame } from "@/state/gameStore";
import type { CameraMode } from "@/types/game";

const desiredPos = new Vector3();
const desiredLook = new Vector3();
const look = new Vector3();
const camUp = new Vector3(0, 1, 0);
const targetUp = new Vector3();
const smoothFwd = new Vector3();
const side = new Vector3();
const tmp = new Vector3();
const right = new Vector3();
const seg = new Vector3();
const rel = new Vector3();

/**
 * Fraction (0..1] of the car→camera segment that is free of obstacles
 * (trees, rocks, lamps). Colliders are treated as ~3.5-unit-tall cylinders.
 */
function clearFraction(from: Vector3, to: Vector3, up: Vector3) {
  seg.subVectors(to, from);
  const len = seg.length();
  if (len < 1e-3) return 1;
  seg.divideScalar(len);
  let best = 1;
  const colliders = getWorld().colliders;
  for (let i = 0; i < colliders.length; i++) {
    const c = colliders[i];
    rel.set(c.x - from.x, c.y - from.y, c.z - from.z);
    const dSq = rel.lengthSq();
    if (dSq > (len + 2) * (len + 2) || c.r < 0.2) continue;
    const t = rel.dot(seg);
    if (t <= 0.5 || t >= len) continue;
    // Height of the ray above the obstacle's base at this point.
    const rayH = seg.dot(up) * t - rel.dot(up);
    if (rayH > 3.6) continue;
    rel.addScaledVector(seg, -t);
    rel.addScaledVector(up, -rel.dot(up));
    if (rel.length() < c.r + 0.75) best = Math.min(best, (t - c.r - 0.6) / len);
  }
  return Math.max(0.3, best);
}

/**
 * Third-person camera with three modes:
 *  intro       — slow cinematic drift around the parked car
 *  follow      — chase cam with lag, look-ahead and speed pull-back
 *  destination — framed shot of the landmark while its panel is open
 * Mode changes blend through a temporarily softened damping factor.
 */
export function FollowCamera({ reducedMotion }: { reducedMotion: boolean }) {
  const state = useRef({ mode: "intro" as CameraMode, blend: 0, time: 0, init: false, shake: 0, clear: 1 });

  useFrame(({ camera, size }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20);
    const cam = camera as PerspectiveCamera;
    const s = state.current;
    const g = useGame.getState();
    const phase = g.phase === "paused" ? g.resumePhase : g.phase;
    const mode: CameraMode = phase === "intro" || phase === "loading" ? "intro" : phase === "panel" ? "destination" : "follow";
    if (mode !== s.mode) {
      s.mode = mode;
      s.blend = 0;
    }
    if (g.phase === "paused") return;
    s.time += dt;
    s.blend = Math.min(1, s.blend + dt * 0.7);

    const up = vehicle.up;
    const pos = vehicle.position;
    if (!s.init) smoothFwd.copy(vehicle.forward);
    smoothFwd.lerp(vehicle.forward, dampFactor(mode === "follow" ? 3.2 : 1.5, dt));
    smoothFwd.addScaledVector(up, -smoothFwd.dot(up)).normalize();
    side.crossVectors(up, smoothFwd).normalize();
    targetUp.copy(up);

    // Portrait screens (phones): pull back and frame the car higher, above the UI.
    const portrait = size.width / Math.max(1, size.height) < 0.9;
    const reach = portrait ? 1.3 : 1;
    let lambdaPos: number = CAMERA.damping.position;
    let lambdaLook: number = CAMERA.damping.look;
    let fov: number = CAMERA.fov.base;

    if (mode === "intro") {
      const sway = reducedMotion ? 0 : Math.sin(s.time * CAMERA.intro.orbitSpeed * 2) * 0.55;
      const a = Math.PI + (portrait ? 0.4 : 0.85) + sway;
      desiredPos
        .copy(pos)
        .addScaledVector(smoothFwd, Math.cos(a) * CAMERA.intro.distance * reach)
        .addScaledVector(side, Math.sin(a) * CAMERA.intro.distance * reach)
        .addScaledVector(up, CAMERA.intro.height * reach + (reducedMotion ? 0 : Math.sin(s.time * 0.21) * 0.4));
      desiredLook.copy(pos).addScaledVector(up, portrait ? -2.4 : 1.1).addScaledVector(smoothFwd, 3.5);
      if (!portrait) {
        // Frame the car between the hero text (left) and the quick-access card (right).
        tmp.subVectors(desiredLook, desiredPos);
        right.crossVectors(tmp, up).normalize();
        desiredLook.addScaledVector(right, -3.1);
      }
      lambdaPos = 1.6;
      lambdaLook = 2.5;
      fov = 50;
    } else if (mode === "destination" && g.activeSection) {
      const l = getWorld().landmarks.find((x) => x.id === g.activeSection)!;
      const shot = l.config.shot;
      const layout = DISPLAY_LAYOUT[g.activeSection];
      const shown = layout ? displayedProjects(g.activeSection) : [];
      const pIdx = shown.findIndex((p) => p.id === g.selectedProjectId);
      if (layout && pIdx >= 0) {
        const [px, pz] = displayArc(shown.length, layout.radius, layout.depth)[pIdx];
        desiredPos.set(px * 1.25, 2.1, pz + 4.4).applyMatrix4(l.matrix);
        desiredLook.set(px, 1.2, pz).applyMatrix4(l.matrix);
      } else {
        desiredPos.set(...shot.pos).applyMatrix4(l.matrix);
        desiredLook.set(...shot.look).applyMatrix4(l.matrix);
      }
      // Frame the landmark in the part of the screen the panel leaves free.
      tmp.subVectors(desiredLook, desiredPos);
      const dist = tmp.length();
      right.crossVectors(tmp, l.up).normalize();
      if (size.width >= 768) desiredLook.addScaledVector(right, dist * 0.32);
      else desiredLook.addScaledVector(l.up, -dist * 0.32);
      targetUp.copy(l.up);
      lambdaPos = 2.6;
      lambdaLook = 3.2;
      fov = 50;
    } else {
      const speedRatio = Math.min(1, Math.abs(vehicle.speed) / VEHICLE.maxSpeed);
      const f = CAMERA.follow;
      desiredPos
        .copy(pos)
        .addScaledVector(smoothFwd, -(f.distance + speedRatio * f.speedPullback) * reach)
        .addScaledVector(up, (f.height + speedRatio * 0.3) * reach);
      desiredLook
        .copy(pos)
        .addScaledVector(smoothFwd, f.lookAhead + speedRatio * 2)
        .addScaledVector(up, portrait ? f.lookHeight - 1.2 : f.lookHeight);
      // Pull in (and up) when a tree or prop would block the view of the car.
      const target = clearFraction(pos, desiredPos, up);
      s.clear += (target - s.clear) * dampFactor(target < s.clear ? 9 : 1.5, dt);
      if (s.clear < 0.999) {
        tmp.subVectors(desiredPos, pos).multiplyScalar(s.clear);
        desiredPos.copy(pos).add(tmp).addScaledVector(up, (1 - s.clear) * 1.6);
      }
      fov = CAMERA.fov.base + (reducedMotion ? 0 : speedRatio * CAMERA.fov.speedBoost);
      // Soften the hand-off from intro/destination shots.
      const t = s.blend * s.blend;
      lambdaPos = CAMERA.damping.transition + (CAMERA.damping.position - CAMERA.damping.transition) * t;
      lambdaLook = CAMERA.damping.transition + (CAMERA.damping.look - CAMERA.damping.transition) * t;
    }

    if (!s.init || requests.cameraSnap) {
      cam.position.copy(desiredPos);
      look.copy(desiredLook);
      camUp.copy(targetUp);
      requests.cameraSnap = false;
      s.init = true;
    } else {
      cam.position.lerp(desiredPos, dampFactor(lambdaPos, dt));
      look.lerp(desiredLook, dampFactor(lambdaLook, dt));
      camUp.lerp(targetUp, dampFactor(4, dt)).normalize();
    }

    // Keep the camera above terrain (never clip into hills or the planet).
    tmp.copy(cam.position).normalize();
    const t = getSampler().sampleTerrain(tmp.x, tmp.y, tmp.z, vehicle.roadIndex);
    const minR = WORLD.radius + Math.max(t.h, WORLD.waterLevel) + CAMERA.minGroundClearance;
    if (cam.position.length() < minR) cam.position.setLength(minR);

    // Tiny shake on collisions.
    if (!reducedMotion && vehicle.bump < 0.25) {
      const k = (0.25 - vehicle.bump) * Math.min(1, vehicle.bumpStrength / 10) * 0.25;
      cam.position.addScaledVector(side, Math.sin(s.time * 70) * k);
    }

    cam.up.copy(camUp);
    cam.lookAt(look);
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov += (fov - cam.fov) * dampFactor(3, dt);
      cam.updateProjectionMatrix();
    }
  });

  return null;
}
