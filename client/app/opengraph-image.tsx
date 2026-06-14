import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Limit Break — Trade Dragon Ball Card Perpetuals";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#060504",
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(255,106,26,0.35), transparent 60%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 132,
            height: 132,
            borderRadius: "50%",
            backgroundImage: "linear-gradient(135deg, #ff6a1a, #d6480a)",
            boxShadow: "0 0 90px rgba(255,106,26,0.55)",
            marginBottom: 40,
          }}
        >
          <span style={{ fontSize: 64, fontWeight: 800, color: "#000" }}>LB</span>
        </div>
        <div style={{ display: "flex", fontSize: 100, fontWeight: 800, letterSpacing: -2 }}>
          <span style={{ color: "#f5f1ec" }}>LIMIT&nbsp;</span>
          <span style={{ color: "#ff6a1a" }}>BREAK</span>
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 34, color: "#cbc4bb" }}>
          Trade Dragon Ball Card Perpetuals
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 14,
            fontSize: 22,
            color: "#8a8178",
            letterSpacing: 6,
            textTransform: "uppercase",
          }}
        >
          Powered by Solana
        </div>
      </div>
    ),
    { ...size }
  );
}
