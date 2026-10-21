"use client";

import { useEffect, useRef, useState } from "react";
import { touchInput } from "@/state/runtime";
import { useGame } from "@/state/gameStore";
import { sound } from "@/lib/audio";

const MAX = 52;

/** Best-effort pointer capture (throws for pointers the browser no longer tracks). */
function capture(el: Element, pointerId: number) {
  try {
    el.setPointerCapture(pointerId);
  } catch {
    /* ignore */
  }
}

function ensureDriving() {
  const g = useGame.getState();
  if (g.phase === "intro") {
    g.startDriving();
    sound.start();
  }
}

/** Virtual steering pad + separate pedals for touch devices. */
export function TouchControls() {
  const phase = useGame((s) => s.phase);
  const knob = useRef<HTMLDivElement>(null);
  const origin = useRef<number | null>(null);
  const [gas, setGas] = useState(false);
  const [brake, setBrake] = useState(false);
  const visible = phase === "driving";

  useEffect(() => {
    if (phase !== "driving") {
      touchInput.steer = 0;
      touchInput.gas = false;
      touchInput.brake = false;
    }
  }, [phase]);

  useEffect(
    () => () => {
      touchInput.steer = 0;
      touchInput.gas = false;
      touchInput.brake = false;
    },
    [],
  );

  if (!visible) return null;

  const setKnob = (dx: number) => {
    if (knob.current) knob.current.style.transform = `translateX(${dx}px)`;
  };

  const pedal = (kind: "gas" | "brake", label: string, className: string, active: boolean, set: (v: boolean) => void) => (
    <button
      type="button"
      aria-label={label}
      className={`${className} grid select-none place-items-center rounded-3xl font-display font-bold uppercase tracking-wider shadow-lg transition-transform ${
        active ? "scale-95" : ""
      }`}
      onPointerDown={(e) => {
        e.preventDefault();
        capture(e.currentTarget, e.pointerId);
        ensureDriving();
        touchInput[kind] = true;
        set(true);
      }}
      onPointerUp={() => {
        touchInput[kind] = false;
        set(false);
      }}
      onPointerCancel={() => {
        touchInput[kind] = false;
        set(false);
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex items-end justify-between p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {/* steering pad */}
      <div
        role="slider"
        aria-label="Steering"
        aria-valuemin={-1}
        aria-valuemax={1}
        aria-valuenow={0}
        className="glass pointer-events-auto relative grid h-32 w-40 touch-none select-none place-items-center rounded-full"
        onPointerDown={(e) => {
          capture(e.currentTarget, e.pointerId);
          origin.current = e.clientX;
          ensureDriving();
        }}
        onPointerMove={(e) => {
          if (origin.current === null) return;
          const dx = Math.max(-MAX, Math.min(MAX, e.clientX - origin.current));
          touchInput.steer = -dx / MAX;
          setKnob(dx);
        }}
        onPointerUp={() => {
          origin.current = null;
          touchInput.steer = 0;
          setKnob(0);
        }}
        onPointerCancel={() => {
          origin.current = null;
          touchInput.steer = 0;
          setKnob(0);
        }}
      >
        <span aria-hidden className="absolute inset-x-6 top-1/2 h-1 -translate-y-1/2 rounded-full bg-ink/10" />
        <span aria-hidden className="absolute left-4 text-lg text-ink/40">‹</span>
        <span aria-hidden className="absolute right-4 text-lg text-ink/40">›</span>
        <div ref={knob} aria-hidden className="h-14 w-14 rounded-full bg-ink shadow-lg ring-4 ring-white/70 transition-transform duration-75" />
      </div>

      {/* pedals */}
      <div className="pointer-events-auto flex touch-none items-end gap-3">
        {pedal("brake", "Brake", "h-20 w-20 bg-white/85 text-ink text-xs", brake, setBrake)}
        {pedal("gas", "Go", "h-28 w-24 bg-coral text-white text-base", gas, setGas)}
      </div>
    </div>
  );
}
