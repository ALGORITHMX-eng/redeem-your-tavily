import { ChatMessage, SavedProfile } from "./unmapped-types";

const PROFILES_KEY = "unmapped:profiles";
const CHAT_KEY = (profileId: string) => `unmapped:chat:${profileId}`;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getProfiles(): SavedProfile[] {
  if (typeof window === "undefined") return [];
  const list = safeParse<SavedProfile[]>(localStorage.getItem(PROFILES_KEY), []);
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

export function saveProfile(profile: SavedProfile): void {
  if (typeof window === "undefined") return;
  const all = safeParse<SavedProfile[]>(localStorage.getItem(PROFILES_KEY), []);
  const next = [profile, ...all.filter((p) => p.id !== profile.id)].slice(0, 25);
  localStorage.setItem(PROFILES_KEY, JSON.stringify(next));
}

export function deleteProfile(id: string): void {
  if (typeof window === "undefined") return;
  const all = safeParse<SavedProfile[]>(localStorage.getItem(PROFILES_KEY), []);
  localStorage.setItem(PROFILES_KEY, JSON.stringify(all.filter((p) => p.id !== id)));
  localStorage.removeItem(CHAT_KEY(id));
}

export function newProfileId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function getChat(profileId: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  return safeParse<ChatMessage[]>(localStorage.getItem(CHAT_KEY(profileId)), []);
}

export function saveChat(profileId: string, messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHAT_KEY(profileId), JSON.stringify(messages));
}

export function clearChat(profileId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CHAT_KEY(profileId));
}
