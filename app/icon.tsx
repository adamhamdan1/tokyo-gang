import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 50% 38%, #301010 0%, #090909 46%, #000 100%)",
          color: "white",
          border: "18px solid #111",
        }}
      >
        <div
          style={{
            width: 390,
            height: 390,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            border: "3px solid rgba(239,68,68,0.72)",
            boxShadow: "0 0 48px rgba(239,68,68,0.4), inset 0 0 42px rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ display: "flex", fontSize: 84, fontWeight: 900, letterSpacing: 18, marginLeft: 18 }}>TOKYO</div>
          <div style={{ display: "flex", marginTop: 18, fontSize: 25, fontWeight: 800, letterSpacing: 12, color: "#ef4444", marginLeft: 12 }}>GANG</div>
          <div style={{ display: "flex", marginTop: 30, width: 210, height: 3, background: "linear-gradient(90deg, transparent, #ef4444, transparent)" }} />
        </div>
      </div>
    ),
    size
  );
}
