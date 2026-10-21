import { Color, LinearSRGBColorSpace } from "three";
import { TIME_PRESETS, type LightingPreset } from "@/config/world";
import { dampFactor } from "@/lib/noise";

/**
 * Live, smoothly-interpolated lighting state shared by the sky, fog, lights and
 * emissive materials. Sky/fog colours are stored "raw" (no colour-space
 * conversion) so the sky gradient and the fog match exactly on screen.
 */
const raw = (hex: string) => new Color().setStyle(hex, LinearSRGBColorSpace);

const start = TIME_PRESETS.sunset;

export const lighting = {
  skyZenith: raw(start.skyZenith),
  skyMid: raw(start.skyMid),
  skyHorizon: raw(start.skyHorizon),
  fog: raw(start.fog),
  disc: raw(start.disc),
  sunColor: new Color(start.sunColor),
  sunIntensity: start.sunIntensity,
  hemiSky: new Color(start.hemiSky),
  hemiGround: new Color(start.hemiGround),
  hemiIntensity: start.hemiIntensity,
  night: start.night,
};

const tmp = new Color();

/** Ease the live lighting toward a preset. `instant` skips the transition (reduced motion). */
export function stepLighting(target: LightingPreset, dt: number, instant: boolean) {
  const k = instant ? 1 : dampFactor(1.4, dt);
  lighting.skyZenith.lerp(tmp.setStyle(target.skyZenith, LinearSRGBColorSpace), k);
  lighting.skyMid.lerp(tmp.setStyle(target.skyMid, LinearSRGBColorSpace), k);
  lighting.skyHorizon.lerp(tmp.setStyle(target.skyHorizon, LinearSRGBColorSpace), k);
  lighting.fog.lerp(tmp.setStyle(target.fog, LinearSRGBColorSpace), k);
  lighting.disc.lerp(tmp.setStyle(target.disc, LinearSRGBColorSpace), k);
  lighting.sunColor.lerp(tmp.set(target.sunColor), k);
  lighting.hemiSky.lerp(tmp.set(target.hemiSky), k);
  lighting.hemiGround.lerp(tmp.set(target.hemiGround), k);
  lighting.sunIntensity += (target.sunIntensity - lighting.sunIntensity) * k;
  lighting.hemiIntensity += (target.hemiIntensity - lighting.hemiIntensity) * k;
  lighting.night += (target.night - lighting.night) * k;
}
