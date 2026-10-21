import { ImageResponse } from "next/og";
import { profile } from "@/config/portfolio";
import { isTodo } from "@/lib/content";

export const alt = "A tiny 3D planet with a winding road and a small red car — an explorable portfolio.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const name = isTodo(profile.name) ? "Portfolio" : profile.name;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "linear-gradient(180deg, #8fb6dc 0%, #c9d6e2 38%, #f6d9bd 70%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* planet */}
        <div
          style={{
            position: "absolute",
            left: -300,
            top: 380,
            width: 1800,
            height: 1800,
            borderRadius: 900,
            background: "#7fb055",
            display: "flex",
          }}
        />
        {/* road */}
        <div
          style={{
            position: "absolute",
            left: -200,
            top: 450,
            width: 1600,
            height: 1600,
            borderRadius: 800,
            border: "46px solid #5c606d",
            display: "flex",
          }}
        />
        {/* car */}
        <div style={{ position: "absolute", left: 760, top: 408, display: "flex", width: 210, height: 110, transform: "rotate(18deg)" }}>
          <div style={{ position: "absolute", left: 50, top: 0, width: 110, height: 50, borderRadius: 16, background: "#22324a", display: "flex" }} />
          <div style={{ position: "absolute", left: 46, top: -6, width: 118, height: 14, borderRadius: 8, background: "#f3e8d2", display: "flex" }} />
          <div style={{ position: "absolute", left: 0, top: 40, width: 210, height: 52, borderRadius: 22, background: "#e4553c", display: "flex" }} />
          <div style={{ position: "absolute", left: 30, top: 74, width: 44, height: 44, borderRadius: 22, background: "#23262d", display: "flex" }} />
          <div style={{ position: "absolute", left: 136, top: 74, width: 44, height: 44, borderRadius: 22, background: "#23262d", display: "flex" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", padding: "70px 80px" }}>
          <div style={{ fontSize: 26, letterSpacing: 6, color: "#b83a24", fontWeight: 700, textTransform: "uppercase" }}>
            Software Engineer · Exploring Cloud & DevOps
          </div>
          <div style={{ fontSize: 88, fontWeight: 800, color: "#1d2230", marginTop: 12, letterSpacing: -2 }}>{name}</div>
          <div style={{ fontSize: 38, color: "#4a5163", marginTop: 8 }}>{profile.headline}</div>
        </div>
      </div>
    ),
    size,
  );
}
