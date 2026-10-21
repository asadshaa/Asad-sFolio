import { Vector3, type Material } from "three";
import { WORLD } from "@/config/world";

/**
 * Shared uniforms for the "progressive discovery" effect: instanced scenery
 * scales up from nothing as the car approaches (between reveal.far and
 * reveal.near), and vegetation sways gently in the wind. Everything happens
 * in the vertex shader, so it costs no CPU per instance.
 */
export const revealUniforms = {
  uRevealCenter: { value: new Vector3(0, WORLD.radius, 0) },
  uRevealNear: { value: WORLD.reveal.near as number },
  uRevealFar: { value: WORLD.reveal.far as number },
  uTime: { value: 0 },
};

interface RevealOptions {
  /** Wind sway amount (0 disables). Scales with local height above the base. */
  sway?: number;
  /** Disable the grow-in (keep sway only). */
  noReveal?: boolean;
}

export function applyReveal<T extends Material>(material: T, { sway = 0, noReveal = false }: RevealOptions = {}): T {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRevealCenter = revealUniforms.uRevealCenter;
    shader.uniforms.uRevealNear = revealUniforms.uRevealNear;
    shader.uniforms.uRevealFar = revealUniforms.uRevealFar;
    shader.uniforms.uTime = revealUniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform vec3 uRevealCenter;
uniform float uRevealNear;
uniform float uRevealFar;
uniform float uTime;`,
      )
      .replace(
        "#include <project_vertex>",
        `
#ifdef USE_INSTANCING
  vec3 instOrigin = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
#else
  vec3 instOrigin = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
#endif
${
  sway > 0
    ? `float swayH = max(transformed.y, 0.0);
  float swayT = uTime * 1.4 + instOrigin.x * 0.31 + instOrigin.z * 0.23 + instOrigin.y * 0.17;
  transformed.x += sin(swayT) * ${sway.toFixed(3)} * swayH;
  transformed.z += cos(swayT * 0.83) * ${(sway * 0.6).toFixed(3)} * swayH;`
    : ""
}
${
  noReveal
    ? ""
    : `float revealDist = distance(instOrigin, uRevealCenter);
  float reveal = smoothstep(uRevealFar, uRevealNear, revealDist);
  reveal += sin(reveal * 3.14159) * 0.14;
  transformed *= reveal;`
}
#include <project_vertex>`,
      );
  };
  material.customProgramCacheKey = () => `reveal-${sway}-${noReveal}`;
  return material;
}
