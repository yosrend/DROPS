export const MOOD_BADGES = [
  "Mind blown",
  "Inspired",
  "Shipped it",
  "I was there",
  "First Config",
  "Need coffee",
] as const;

export const CARD_SKINS = ["Paper", "Sticker", "Note", "Polaroid", "Pixel"] as const;

export const CARD_SIZES = ["Small", "Medium", "Large"] as const;

export const ACCENT_COLORS = [
  { label: "Purple", value: "#7B61FF" },
  { label: "Coral", value: "#F24822" },
  { label: "Blue", value: "#1ABCFE" },
  { label: "Amber", value: "#FFCD29" },
  { label: "Green", value: "#0FA958" },
  { label: "Black", value: "#111111" },
] as const;

export const STICKERS = [
  "I Was There",
  "First Config",
  "Online",
  "IRL",
  "Speaker",
  "Builder",
  "Designer",
  "Developer",
  "Community",
  "Day 1",
  "Day 2",
] as const;

export const STICKER_COLORS = [
  "#7B61FF",
  "#F24822",
  "#1ABCFE",
  "#FFCD29",
  "#111111",
  "#0FA958",
] as const;

export const ONBOARDING_KEY = "drops_onboarding_completed";
export const CARDS_KEY = "drops_user_cards";
export const MAX_CARDS = 2;

export interface UserCard {
  bg: string;
  quote: string;
  handle: string;
  type: "text" | "image" | "gif" | "sticker" | "camera_gif";
  imageData?: string;
  accentColor: string;
  moodBadge?: string;
  cardSkin: string;
  cardSize?: string;
  fontStyle?: string;
  textAlign?: string;
  stickerLabel?: string;
  id: string;
  userName?: string;
  userRole?: string;
  themeId?: string;
  borderStyle?: string;
}
