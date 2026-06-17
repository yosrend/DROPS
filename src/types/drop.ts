export interface DropPost {
  id: string;
  device_id: string;
  type: "text" | "image" | "gif" | "sticker";
  content_url?: string | null;
  text_content?: string | null;
  caption?: string | null;
  accent_color: string;
  mood_badge?: string | null;
  card_skin: string;
  card_size?: string | null;
  font_style?: string | null;
  text_align?: string | null;
  sticker_label?: string | null;
  user_name?: string | null;
  user_role?: string | null;
  theme_id?: string | null;
  x_position: number;
  y_position: number;
  z_index: number;
  rotation: number;
  is_hidden: boolean;
  is_pinned: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface DropInput {
  type: "text" | "image" | "gif" | "sticker";
  text_content?: string;
  caption?: string;
  accent_color: string;
  mood_badge?: string;
  card_skin: string;
  card_size?: string;
  font_style?: string;
  text_align?: string;
  sticker_label?: string;
  user_name?: string;
  user_role?: string;
  theme_id?: string;
  image_file?: File;
}
