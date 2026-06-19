import { useState } from "react";
import { motion } from "motion/react";
import QrBackCard from "./QrBackCard";
import BorderGlow from "./BorderGlow";
import "./BorderGlow.css";

interface CardFaceProps {
  quote: string;
  handle: string;
  bg: string;
  small?: boolean;
  themeId?: string;
  dropId?: string;
  displayName?: string;
  profileUrl?: string;
  qrEnabled?: boolean;
  type?: string;
  stickerLabel?: string;
  userName?: string;
  userRole?: string;
  fontStyle?: string;
  imageData?: string;
  isOwnCard?: boolean;
}

export function CardFace({
  quote, handle, bg, small,
  themeId, dropId, displayName, profileUrl, qrEnabled,
  type, stickerLabel, userName, userRole, fontStyle, imageData, isOwnCard,
}: CardFaceProps) {
  const [flipped, setFlipped] = useState(false);

  const light = bg === "#FFCD29" || bg === "#F5F0E8" || bg === "#fff";
  const textColor = light ? "rgba(17,17,17,0.9)" : "#fff";
  const mutedColor = light ? "rgba(17,17,17,0.4)" : "rgba(255,255,255,0.45)";

  const hasQr = qrEnabled !== false && !!dropId && !imageData;
  const cardStyle: React.CSSProperties = themeId && !themeId.startsWith("#")
    ? { backgroundImage: `url(/cards/card-${themeId}.png)`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: bg };

  const cardContent = hasQr ? (
    <div className="relative w-full h-full" style={{ perspective: "800px" }}>
      <motion.div className="absolute inset-0" style={{ transformStyle: "preserve-3d", transformOrigin: "center center" }}
        animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }} onClick={() => setFlipped(p => !p)}>
        <div className="absolute inset-0 flex flex-col justify-between" style={{ backfaceVisibility: "hidden", borderRadius: "inherit", overflow: "hidden", ...cardStyle }}>
          <div style={{ fontSize: small ? 13 : 15, fontWeight: 700, color: textColor, lineHeight: 1.3, padding: small ? "6px 12px" : "8px 14px", flex: 1, display: "flex", alignItems: "center", fontFamily: fontStyle || undefined }}>
            {type === "sticker" || stickerLabel ? (stickerLabel || quote) : quote}
          </div>
          <div style={{ fontSize: small ? 9 : 10, color: mutedColor, padding: small ? "0 12px 12px" : "0 14px 14px", display: "flex", justifyContent: "space-between" }}>
            <span>{handle}</span>
            {userName && <span>{userName}</span>}
          </div>
        </div>
        <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", borderRadius: "inherit", overflow: "hidden" }}>
          <QrBackCard dropId={dropId} displayName={displayName || userName || handle} handle={handle} profileUrl={profileUrl} onFlipBack={() => setFlipped(false)} />
        </div>
      </motion.div>
    </div>
  ) : (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: small ? 13 : 15, fontWeight: 700, color: textColor, lineHeight: 1.3, padding: small ? "6px 12px" : "8px 14px", flex: 1, display: "flex", alignItems: "center", fontFamily: fontStyle || undefined }}>
        {type === "sticker" || stickerLabel ? (stickerLabel || quote) : quote}
      </div>
      <div style={{ fontSize: small ? 9 : 10, color: mutedColor, padding: small ? "0 12px 12px" : "0 14px 14px" }}>{handle}</div>
    </div>
  );

  return isOwnCard ? (
    <BorderGlow borderRadius={14} glowIntensity={0.5} colors={['#c084fc', '#f472b6', '#38bdf8']} backgroundColor="transparent" className="w-full h-full">
      {cardContent}
    </BorderGlow>
  ) : cardContent;
}

export default CardFace;
