import { getDeviceId } from "../utils/device";
import { isSupabaseAvailable } from "../lib/supabase";

async function getSupabase(): Promise<any | null> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const sdk = await import(/* @vite-ignore */ "@supabase/supabase-js");
    if (sdk?.createClient) return sdk.createClient(url, key);
  } catch { /* supabase not available */ }
  return null;
}
import { CARDS_KEY, FRIENDS_KEY, MAX_CARDS, type UserCard } from "../app/data/defaults";
import type { DropInput, DropPost, FriendInput, FriendRecord } from "../types/drop";

const TABLE = "drops_posts";
const BUCKET = "drops-assets";

// ── localStorage helpers ──

function getStorage() {
  const stored = localStorage.getItem(CARDS_KEY);
  try { return stored ? JSON.parse(stored) : []; } catch { return []; }
}

function setStorage(cards: UserCard[]) {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
}

function getFriendsStorage(): FriendRecord[] {
  try { return JSON.parse(localStorage.getItem(FRIENDS_KEY) || "[]"); } catch { return []; }
}
function setFriendsStorage(data: FriendRecord[]) {
  localStorage.setItem(FRIENDS_KEY, JSON.stringify(data));
}

// ── Drop CRUD ──

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
    } catch { /* fall through */ }
  }
  return getStorage();
}

export async function getMyDrops(deviceId: string): Promise<UserCard[]> {
  // Read from localStorage directly (user's own created cards)
  const stored = localStorage.getItem(CARDS_KEY);
  try {
    const cards: UserCard[] = stored ? JSON.parse(stored) : [];
    return cards.reverse(); // newest first
  } catch { return []; }
}

export async function getDropById(dropId: string): Promise<UserCard | null> {
  const all = await getDrops();
  return all.find(c => c.id === dropId) || null;
}

export async function createDrop(input: DropInput): Promise<UserCard | null> {
  const card = buildCardFromInput(input);
  const deviceId = getDeviceId();

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
          display_name: input.display_name || null,
          handle: input.handle || null,
          profile_url: input.profile_url || null,
          qr_enabled: input.qr_enabled ?? true,
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
        const savedCard = mapPostToCard(data as DropPost);
        const existing = getStorage();
        setStorage([...existing, savedCard]);
        return savedCard;
      }
    } catch { /* fall through */ }
  }

  // localStorage fallback
  card.imageData = contentUrl || card.imageData;
  const existing = getStorage();
  setStorage([...existing, card]);
  return card;
}

export async function updateDrop(id: string, updates: Partial<DropPost>): Promise<boolean> {
  const sb = await getSupabase();
  if (!sb) return false;
  try {
    await sb.from(TABLE).update(updates).eq("id", id);
    return true;
  } catch { return false; }
}

export async function updateDropConnectInfo(dropId: string, data: { display_name?: string; handle?: string; profile_url?: string; qr_enabled?: boolean }) {
  const sb = await getSupabase();
  if (sb) {
    try { await sb.from(TABLE).update(data).eq("id", dropId); } catch {}
  }
  // update localStorage
  const cards = getStorage();
  const idx = cards.findIndex((c: any) => c.id === dropId);
  if (idx >= 0) {
    cards[idx] = { ...cards[idx], ...data };
    setStorage(cards);
  }
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

export async function uploadDropAsset(file: File, deviceId: string): Promise<string | null> {
  const sb = await getSupabase();
  if (!sb) return null;
  const ext = file.name.split(".").pop() || "png";
  const path = `${deviceId}/${crypto.randomUUID?.() || Date.now().toString(36)}.${ext}`;
  try {
    const { data } = await sb.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600", upsert: false,
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
    } catch {}
  }
  return getStorage().length;
}

export async function canDeviceCreateDrop(deviceId: string): Promise<boolean> {
  const count = await getDropCountByDevice(deviceId);
  return count < MAX_CARDS;
}

// ── Share ──

export function shareWallLink() {
  const url = window.location.href.split("?")[0];
  return shareOrCopy(url, "Drops ✦");
}

export function shareDropLink(dropId: string) {
  const url = `${window.location.href.split("?")[0]}?drop=${dropId}`;
  return shareOrCopy(url, "Drop ✦");
}

export function createConnectUrl(dropId: string, profileUrl?: string): string {
  if (profileUrl) return profileUrl;
  return `${window.location.href.split("?")[0]}?drop=${dropId}`;
}

async function shareOrCopy(url: string, title: string): Promise<"share" | "copy"> {
  if (navigator.share) {
    try { await navigator.share({ title, url }); return "share"; } catch {}
  }
  try { await navigator.clipboard.writeText(url); return "copy"; } catch {}
  return "copy";
}

// ── Likes ──

const LIKES_KEY = "drops_likes";
interface LikeRecord { dropId: string; deviceId: string; }

function getLikesStorage(): LikeRecord[] {
  try { return JSON.parse(localStorage.getItem(LIKES_KEY) || "[]"); } catch { return []; }
}
function setLikesStorage(data: LikeRecord[]) { localStorage.setItem(LIKES_KEY, JSON.stringify(data)); }

export async function toggleLike(dropId: string, deviceId: string): Promise<{ liked: boolean; count: number }> {
  const sb = await getSupabase();
  if (sb) {
    try {
      const existing = await sb.from("likes").select("*").eq("drop_id", dropId).eq("device_id", deviceId).maybeSingle();
      if (existing?.data) {
        await sb.from("likes").delete().eq("id", existing.data.id);
      } else {
        await sb.from("likes").insert({ drop_id: dropId, device_id: deviceId });
      }
      const { count } = await sb.from("likes").select("*", { count: "exact", head: true }).eq("drop_id", dropId);
      return { liked: !existing?.data, count: count || 0 };
    } catch {}
  }
  // localStorage fallback
  const likes = getLikesStorage();
  const existing = likes.findIndex(l => l.dropId === dropId && l.deviceId === deviceId);
  const updated = existing >= 0
    ? likes.filter((_, i) => i !== existing)
    : [...likes, { dropId, deviceId }];
  setLikesStorage(updated);
  return { liked: existing < 0, count: updated.filter(l => l.dropId === dropId).length };
}

export async function getLikes(dropId: string): Promise<number> {
  return getLikesStorage().filter(l => l.dropId === dropId).length;
}

// ── Comments ──

const COMMENTS_KEY = "drops_comments";
export interface CommentRecord {
  id: string; dropId: string; deviceId: string;
  authorName: string; text: string; createdAt: string; isHidden: boolean;
}

function getCommentsStorage(): CommentRecord[] {
  try { return JSON.parse(localStorage.getItem(COMMENTS_KEY) || "[]"); } catch { return []; }
}
function setCommentsStorage(data: CommentRecord[]) { localStorage.setItem(COMMENTS_KEY, JSON.stringify(data)); }

export async function addComment(dropId: string, deviceId: string, authorName: string, text: string): Promise<CommentRecord> {
  const comment: CommentRecord = {
    id: crypto.randomUUID?.() || Date.now().toString(36),
    dropId, deviceId, authorName: authorName || "Anonymous",
    text, createdAt: new Date().toISOString(), isHidden: false,
  };
  const sb = await getSupabase();
  if (sb) {
    try {
      const { data } = await sb.from("comments").insert({
        drop_id: dropId, device_id: deviceId,
        author_name: authorName || "Anonymous", comment_text: text,
      }).select().single();
      if (data) comment.id = data.id;
    } catch {}
  }
  const comments = getCommentsStorage();
  setCommentsStorage([...comments, comment]);
  return comment;
}

export async function getComments(dropId: string): Promise<CommentRecord[]> {
  const sb = await getSupabase();
  if (sb) {
    try {
      const { data } = await sb.from("comments")
        .select("*").eq("drop_id", dropId).eq("is_hidden", false)
        .order("created_at", { ascending: false });
      if (data) return data.map((c: any) => ({
        id: c.id, dropId: c.drop_id, deviceId: c.device_id,
        authorName: c.author_name || "Anonymous", text: c.comment_text,
        createdAt: c.created_at, isHidden: c.is_hidden,
      }));
    } catch {}
  }
  return getCommentsStorage().filter(c => c.dropId === dropId && !c.isHidden)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getSocialCounts(dropId: string): Promise<{ likes: number; comments: number }> {
  return { likes: (await getLikes(dropId)), comments: (await getComments(dropId)).length };
}

// ── Friends ──

export async function createFriend(input: FriendInput): Promise<FriendRecord | null> {
  const friend: FriendRecord = {
    id: crypto.randomUUID?.() || Date.now().toString(36),
    device_id: input.device_id,
    friend_drop_id: input.friend_drop_id,
    friend_name: input.friend_name,
    friend_handle: input.friend_handle,
    friend_profile_url: input.friend_profile_url,
    friend_avatar_url: input.friend_avatar_url,
    created_at: new Date().toISOString(),
  };
  const sb = await getSupabase();
  if (sb) {
    try {
      const { data } = await sb.from("drops_friends").insert({
        device_id: input.device_id,
        friend_drop_id: input.friend_drop_id,
        friend_name: input.friend_name,
        friend_handle: input.friend_handle || null,
        friend_profile_url: input.friend_profile_url || null,
        friend_avatar_url: input.friend_avatar_url || null,
      }).select().single();
      if (data) return data;
    } catch {}
  }
  // localStorage fallback
  const friends = getFriendsStorage();
  setFriendsStorage([...friends, friend]);
  return friend;
}

export async function getFriends(deviceId: string): Promise<FriendRecord[]> {
  const sb = await getSupabase();
  if (sb) {
    try {
      const { data } = await sb.from("drops_friends")
        .select("*").eq("device_id", deviceId)
        .order("created_at", { ascending: false });
      if (data) return data;
    } catch {}
  }
  return getFriendsStorage().filter(f => f.device_id === deviceId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function removeFriend(friendId: string): Promise<boolean> {
  const sb = await getSupabase();
  if (sb) {
    try { await sb.from("drops_friends").delete().eq("id", friendId); return true; } catch {}
  }
  setFriendsStorage(getFriendsStorage().filter(f => f.id !== friendId));
  return true;
}

// ── QR scan ──

export function scanQrResult(rawValue: string): { type: "drop" | "profile" | "external"; dropId?: string; url?: string } {
  if (!rawValue) return { type: "external" };
  // Internal DROPS link: ?drop=DROP_ID
  try {
    const url = new URL(rawValue);
    const dropId = url.searchParams.get("drop");
    if (dropId) return { type: "drop", dropId, url: rawValue };
    // Profile URL from DROPS
    if (url.pathname === "/connect" || rawValue.includes("/profile/")) {
      return { type: "profile", url: rawValue };
    }
  } catch {}
  // Plain drop ID
  if (rawValue.length > 10 && !rawValue.includes("/")) {
    return { type: "drop", dropId: rawValue };
  }
  return { type: "external", url: rawValue };
}

// ── Mappers ──

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
    displayName: post.display_name || undefined,
    profileUrl: post.profile_url || undefined,
    qrEnabled: post.qr_enabled ?? true,
  };
}

function mapPostsToCards(posts: DropPost[]): UserCard[] {
  return posts.map(mapPostToCard);
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
    displayName: input.display_name,
    profileUrl: input.profile_url,
    qrEnabled: input.qr_enabled ?? true,
  };
}
