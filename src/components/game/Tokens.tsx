"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, Vector3 } from "three";
import { tokenGeometry } from "@/lib/three/props";
import { TOKENS } from "@/config/world";
import { getWorld } from "@/lib/world/world";
import { sound } from "@/lib/audio";
import { vehicle } from "@/state/runtime";
import { useGame } from "@/state/gameStore";
import { PropAsset, type PropAssetData } from "./ModelSlot";

const Y = new Vector3(0, 1, 0);

/**
 * Collectible "engineering tokens" — hex nuts floating over the road (plus a
 * few hidden off-road). Purely optional: nothing is gated behind them.
 * One instanced mesh; collected tokens are scaled to zero.
 */
const tokenAsset = () => ({
  geometry: tokenGeometry(),
  material: new MeshStandardMaterial({
    color: "#e3b04b",
    emissive: "#f2a93a",
    emissiveIntensity: 0.2,
    metalness: 0.9,
    roughness: 0.25,
  }),
});

export function Tokens({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <PropAsset name="token" reveal={false} build={tokenAsset}>
      {(a) => <TokenLayer asset={a} reducedMotion={reducedMotion} />}
    </PropAsset>
  );
}

function TokenLayer({ asset, reducedMotion }: { asset: PropAssetData; reducedMotion: boolean }) {
  const tokens = getWorld().tokens;
  const { mesh, base, ups } = useMemo(() => {
    const m = new InstancedMesh(asset.geometry, asset.material, tokens.length);
    m.frustumCulled = false;
    m.castShadow = true;
    // Orientation: stand upright on the local surface.
    const upDirs = tokens.map((t) => t.position.clone().normalize());
    const baseQ = upDirs.map((u) => new Quaternion().setFromUnitVectors(Y, u));
    return { mesh: m, base: baseQ, ups: upDirs };
  }, [tokens, asset]);

  useEffect(() => () => mesh.dispose(), [mesh]);

  const scratch = useMemo(() => ({ m: new Matrix4(), q: new Quaternion(), spin: new Quaternion(), p: new Vector3(), s: new Vector3() }), []);

  useFrame(({ clock }) => {
    const g = useGame.getState();
    const t = clock.elapsedTime;
    const { m, q, spin, p, s } = scratch;
    for (let i = 0; i < tokens.length; i++) {
      const collected = g.tokens.includes(i);
      const tok = tokens[i];
      if (!collected && g.phase === "driving" && tok.position.distanceTo(vehicle.position) < TOKENS.pickupRadius + 0.9) {
        g.collectToken(i);
        if (tok.hidden) g.findEgg("hidden-token");
        sound.token();
      }
      spin.setFromAxisAngle(Y, reducedMotion ? 0.6 : t * 1.8 + i);
      // The torus stands upright in its local frame; spin it about the surface normal.
      q.copy(base[i]).multiply(spin);
      const bob = reducedMotion ? 0 : Math.sin(t * 2 + i) * 0.12;
      p.copy(tok.position).addScaledVector(ups[i], bob);
      s.setScalar(collected ? 0 : 1);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <primitive object={mesh} />;
}
