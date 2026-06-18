function isLightBg(bg: string) {
  return bg === "#FFCD29" || bg === "#F5F0E8";
}

export function CardFace({ quote, handle, bg, small = false }: {
  quote: string; handle: string; bg: string; small?: boolean;
}) {
  const light = isLightBg(bg);
  const textColor = light ? "rgba(17,17,17,0.9)" : "#fff";
  const mutedColor = light ? "rgba(17,17,17,0.4)" : "rgba(255,255,255,0.45)";
  return (
    <>
      <div style={{
        fontSize: small ? 13 : 15, fontWeight: 700, color: textColor, lineHeight: 1.3,
        padding: small ? "6px 12px" : "8px 14px",
        flex: 1, display: "flex", alignItems: "center",
      }}>
        {quote}
      </div>
      <div style={{
        fontSize: small ? 9 : 10, color: mutedColor,
        padding: small ? "0 12px 12px" : "0 14px 14px",
      }}>
        {handle}
      </div>
    </>
  );
}
