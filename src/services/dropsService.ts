import { getDeviceId } from "../utils/device";
import { isSupabaseAvailable } from "../lib/supabase";

async function getSupabase(): Promise<any | null> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    // Dynamic import - Vite splits this into separate chunk
    const sdk = await import(/* @vite-ignore */ "@supabase/supabase-js");
    if (sdk?.createClient) return sdk.createClient(url, key);
  } catch { /* supabase not available */ }
  return null;
}
import { CARDS_KEY, MAX_CARDS, type UserCard } from "../app/data/defaults";
import type { DropInput, DropPost } from "../types/drop";

const TABLE = "drops_posts";
const BUCKET = "drops-assets";

// ── helpers ──

function getStorage() {
  const stored = localStorage.getItem(CARDS_KEY);
  try { return stored ? JSON.parse(stored) : []; } catch { return []; }
}

function setStorage(cards: UserCard[]) {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

// ── public API ──

export async function getDrops(): Promise<UserCard[]> {
  const sb = await getSupabase();
  if (sb) {
    try {
      const { data } = await sb
        .from(TABLE)
        .select("*")
        .eq("is_hidden", false)
        .order("created_at", { ascending: false });
      if (data) return mapPostsToCards(data);
    } catch { /* fall through to localStorage */ }
  }
  return getStorage();
}

export async function createDrop(input: DropInput): Promise<UserCard | null> {
  const card = buildCardFromInput(input);
  const deviceId = getDeviceId();

  // upload file if image/gif
  let contentUrl = "";
  if (input.image_file && (input.type === "image" || input.type === "gif")) {
    const url = await uploadDropAsset(input.image_file, deviceId);
    if (url) contentUrl = url;
  }

  const sb = await getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from(TABLE)
        .insert({
          device_id: deviceId,
          type: input.type,
          content_url: contentUrl || null,
          text_content: input.text_content || null,
          caption: input.caption || null,
          accent_color: input.accent_color,
          mood_badge: input.mood_badge || null,
          card_skin: input.card_skin,
          card_size: input.card_size || null,
          font_style: input.font_style || null,
          text_align: input.text_align || null,
          sticker_label: input.sticker_label || null,
          user_name: input.user_name || null,
          user_role: input.user_role || null,
          theme_id: input.theme_id || null,
          x_position: Math.random() * 80 + 10,
          y_position: Math.random() * 80 + 10,
          z_index: Math.floor(Math.random() * 100),
          rotation: (Math.random() - 0.5) * 10,
          is_hidden: false,
          is_pinned: false,
          is_featured: false,
        })
        .select()
        .single();
      if (error) throw error;
      if (data) {
        const card = mapPostToCard(data as DropPost);
        // save to localStorage as fallback
        const existing = getStorage();
        setStorage([...existing, card]);
        return card;
      }
    } catch { /* fall through */ }
  }

  // localStorage fallback
  card.imageData = contentUrl || card.imageData;
  const existing = getStorage();
  setStorage([...existing, card]);
  return card;
}

export async function uploadDropAsset(file: File, deviceId: string): Promise<string | null> {
  const sb = await getSupabase();
  if (!sb) return null;

  const ext = file.name.split(".").pop() || "png";
  const path = `${deviceId}/${crypto.randomUUID?.() || Date.now().toString(36)}.${ext}`;

  try {
    const { data } = await sb.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (data) {
      const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(data.path);
      return urlData.publicUrl;
    }
  } catch { /* silent */ }
  return null;
}

export async function getDropCountByDevice(deviceId: string): Promise<number> {
  const sb = await getSupabase();
  if (sb) {
    try {
      const { count } = await sb
        .from(TABLE)
        .select("*", { count: "exact", head: true })
        .eq("device_id", deviceId);
      if (count !== null) return count;
    } catch { /* fall through */ }
  }
  // localStorage fallback
  return getStorage().filter((c: UserCard) => c.id.startsWith(deviceId.slice(0, 8)) || true).length;
}

export async function canDeviceCreateDrop(deviceId: string): Promise<boolean> {
  const count = await getDropCountByDevice(deviceId);
  return count < MAX_CARDS;
}

export async function updateDrop(id: string, updates: Partial<DropPost>): Promise<boolean> {
  const sb = await getSupabase();
  if (!sb) return false;
  try {
    await sb.from(TABLE).update(updates).eq("id", id);
    return true;
  } catch { return false; }
}

export async function deleteDrop(id: string, contentUrl?: string): Promise<boolean> {
  const sb = await getSupabase();
  if (!sb) return false;
  try {
    if (contentUrl) {
      const path = contentUrl.split("/").pop();
      if (path) await sb.storage.from(BUCKET).remove([path]);
    }
    await sb.from(TABLE).delete().eq("id", id);
    return true;
  } catch { return false; }
}

// ── mappers ──

function mapPostToCard(post: DropPost): UserCard {
  return {
    bg: post.accent_color,
    quote: post.text_content || "",
    handle: post.caption || "@you",
    type: post.type,
    imageData: post.content_url || undefined,
    accentColor: post.accent_color,
    moodBadge: post.mood_badge || undefined,
    cardSkin: post.card_skin,
    cardSize: post.card_size || undefined,
    fontStyle: post.font_style || undefined,
    textAlign: post.text_align || undefined,
    stickerLabel: post.sticker_label || undefined,
    id: post.id,
    userName: post.user_name || undefined,
    userRole: post.user_role || undefined,
    themeId: post.theme_id || undefined,
  };
}

function mapPostsToCards(posts: DropPost[]): UserCard[] {
  return posts.map(mapPostToCard);
}

// ── Social ──

const LIKES_KEY = "drops_likes";
const REACTIONS_KEY = "drops_reactions";
const COMMENTS_KEY = "drops_comments";

interface LikeRecord { dropId: string; deviceId: string; }
interface ReactionRecord { dropId: string; deviceId: string; emoji: string; createdAt: string; }
export interface CommentRecord { id: string; dropId: string; deviceId: string; authorName: string; text: string; createdAt: string; isHidden: boolean; }

function getLikesStorage(): LikeRecord[] {
  try { return JSON.parse(localStorage.getItem(LIKES_KEY) || "[]"); } catch { return []; }
}
function setLikesStorage(data: LikeRecord[]) { localStorage.setItem(LIKES_KEY, JSON.stringify(data)); }
function getReactionsStorage(): ReactionRecord[] {
  try { return JSON.parse(localStorage.getItem(REACTIONS_KEY) || "[]"); } catch { return []; }
}
function setReactionsStorage(data: ReactionRecord[]) { localStorage.setItem(REACTIONS_KEY, JSON.stringify(data)); }
function getCommentsStorage(): CommentRecord[] {
  try { return JSON.parse(localStorage.getItem(COMMENTS_KEY) || "[]"); } catch { return []; }
}
function setCommentsStorage(data: CommentRecord[]) { localStorage.setItem(COMMENTS_KEY, JSON.stringify(data)); }

export async function toggleLike(dropId: string, deviceId: string): Promise<{ liked: boolean; count: number }> {
  const sb = await getSupabase();
  if (sb) {
    try { /* would call Supabase likes table */ } catch {}
  }
  // localStorage fallback
  const likes = getLikesStorage();
  const existing = likes.findIndex(l => l.dropId === dropId && l.deviceId === deviceId);
  let updated: LikeRecord[];
  if (existing >= 0) { updated = likes.filter((_, i) => i !== existing); }
  else { updated = [...likes, { dropId, deviceId }]; }
  setLikesStorage(updated);
  return { liked: existing < 0, count: updated.filter(l => l.dropId === dropId).length };
}

export async function getLikes(dropId: string): Promise<number> {
  return getLikesStorage().filter(l => l.dropId === dropId).length;
}

export async function addReaction(dropId: string, deviceId: string, emoji: string): Promise<void> {
  const sb = await getSupabase();
  if (sb) { try {} catch {} }
  const reactions = getReactionsStorage();
  // remove existing reaction from same device (toggle off)
  const filtered = reactions.filter(r => !(r.dropId === dropId && r.deviceId === r.deviceId));
  setReactionsStorage([...filtered, { dropId, deviceId, emoji, createdAt: new Date().toISOString() }]);
}

export async function getReactions(dropId: string): Promise<ReactionRecord[]> {
  return getReactionsStorage().filter(r => r.dropId === dropId);
}

export async function addComment(dropId: string, deviceId: string, authorName: string, text: string): Promise<CommentRecord> {
  const comment: CommentRecord = {
    id: crypto.randomUUID?.() || Date.now().toString(36),
    dropId, deviceId, authorName: authorName || "Anonymous", text, createdAt: new Date().toISOString(), isHidden: false,
  };
  const sb = await getSupabase();
  if (sb) { try {} catch {} }
  const comments = getCommentsStorage();
  setCommentsStorage([...comments, comment]);
  return comment;
}

export async function getComments(dropId: string): Promise<CommentRecord[]> {
  return getCommentsStorage().filter(c => c.dropId === dropId && !c.isHidden)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getSocialCounts(dropId: string): Promise<{ likes: number; reactions: number; comments: number }> {
  return {
    likes: (await getLikes(dropId)),
    reactions: (await getReactions(dropId)).length,
    comments: (await getComments(dropId)).length,
  };
}

export function shareWallLink() {
  const url = window.location.href.split("?")[0];
  shareOrCopy(url, "Drops ✦");
}

export function shareDropLink(dropId: string) {
  const url = `${window.location.href.split("?")[0]}?drop=${dropId}`;
  shareOrCopy(url, "Drop ✦");
}

async function shareOrCopy(url: string, title: string) {
  if (navigator.share) {
    try { await navigator.share({ title, url }); return; } catch {}
  }
  try { await navigator.clipboard.writeText(url); } catch {}
}

function buildCardFromInput(input: DropInput): UserCard {
  return {
    bg: input.accent_color,
    quote: input.text_content || "",
    handle: input.caption || "@you",
    type: input.type,
    imageData: undefined,
    accentColor: input.accent_color,
    moodBadge: input.mood_badge,
    cardSkin: input.card_skin,
    cardSize: input.card_size,
    fontStyle: input.font_style,
    textAlign: input.text_align,
    stickerLabel: input.sticker_label,
    id: crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    userName: input.user_name,
    userRole: input.user_role,
    themeId: input.theme_id,
  };
}
