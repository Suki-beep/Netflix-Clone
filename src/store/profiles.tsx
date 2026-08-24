import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Movie } from "../api/tmdb";

const PKEY = "nf.profiles.v2";
const DKEY = "nf.data.v2";
const AKEY = "nf.active.v2";

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  color: string;
  kids: boolean;
  language: string;
  maturity: string;
  autoplayPreviews: boolean;
  autoplayNext: boolean;
}

export interface ProgressEntry {
  id: number;
  pct: number;
  seconds: number;
  at: number;
  item: Movie;
  episodeLabel?: string;
}

export interface ProfileData {
  list: Movie[];
  liked: number[];
  disliked: number[];
  loved: number[];
  progress: ProgressEntry[];
  history: { q: string; at: number }[];
}

export const AVATARS = ["😀", "😎", "🤠", "🥳", "👾", "🦊", "🐼", "🤖", "🦄", "🐯", "🐸", "🎃", "🌈", "⚡️", "🎬", "🍿"];
export const COLORS = [
  "from-blue-500 to-blue-700",
  "from-yellow-400 to-amber-600",
  "from-emerald-500 to-green-700",
  "from-fuchsia-500 to-purple-700",
  "from-rose-500 to-red-700",
  "from-cyan-500 to-teal-700",
];

const DEFAULT_PROFILES: Profile[] = [
  { id: "p1", name: "You", avatar: "😀", color: COLORS[0], kids: false, language: "English", maturity: "18+, all maturity ratings", autoplayPreviews: true, autoplayNext: true },
  { id: "p2", name: "Alex", avatar: "🤠", color: COLORS[1], kids: false, language: "English", maturity: "16+", autoplayPreviews: false, autoplayNext: true },
  { id: "p3", name: "Sam", avatar: "🦊", color: COLORS[2], kids: false, language: "English", maturity: "13+", autoplayPreviews: true, autoplayNext: false },
  { id: "p4", name: "Kids", avatar: "🐼", color: COLORS[4], kids: true, language: "English", maturity: "Kids, all", autoplayPreviews: false, autoplayNext: true },
];

const emptyData = (): ProfileData => ({
  list: [], liked: [], disliked: [], loved: [], progress: [], history: [],
});

const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export interface Toast {
  id: number;
  msg: string;
  icon?: string;
}

interface Ctx {
  profiles: Profile[];
  active: Profile | null;
  data: ProfileData;
  toasts: Toast[];
  gateOpen: boolean;
  manageOpen: boolean;
  setGateOpen: (v: boolean) => void;
  setManageOpen: (v: boolean) => void;
  selectProfile: (id: string) => void;
  addProfile: (p: Omit<Profile, "id">) => void;
  updateProfile: (id: string, patch: Partial<Profile>) => void;
  deleteProfile: (id: string) => void;
  inList: (id: number) => boolean;
  toggleList: (m: Movie) => void;
  ratingOf: (id: number) => "up" | "down" | "love" | null;
  rate: (m: Movie, kind: "up" | "down" | "love") => void;
  clearRating: (id: number) => void;
  progressOf: (id: number) => ProgressEntry | undefined;
  saveProgress: (m: Movie, pct: number, seconds: number, episodeLabel?: string) => void;
  clearProgress: (id: number) => void;
  pushSearch: (q: string) => void;
  clearHistory: () => void;
  toast: (msg: string, icon?: string) => void;
  dismissToast: (id: number) => void;
}

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>(() => load(PKEY, DEFAULT_PROFILES));
  const [allData, setAllData] = useState<Record<string, ProfileData>>(() => load(DKEY, {}));
  const [activeId, setActiveId] = useState<string | null>(() => load<string | null>(AKEY, null));
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [gateOpen, setGateOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  useEffect(() => localStorage.setItem(PKEY, JSON.stringify(profiles)), [profiles]);
  useEffect(() => localStorage.setItem(DKEY, JSON.stringify(allData)), [allData]);
  useEffect(() => localStorage.setItem(AKEY, JSON.stringify(activeId)), [activeId]);

  const active = useMemo(
    () => profiles.find((p) => p.id === activeId) || null,
    [profiles, activeId]
  );
  const data = useMemo(() => allData[activeId || ""] || emptyData(), [allData, activeId]);

  const toast = useCallback((msg: string, icon?: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, icon }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);

  const mutate = useCallback(
    (fn: (d: ProfileData) => ProfileData) => {
      if (!activeId) return;
      setAllData((prev) => ({
        ...prev,
        [activeId]: fn(prev[activeId] || emptyData()),
      }));
    },
    [activeId]
  );

  const selectProfile = useCallback((id: string) => {
    setActiveId(id);
    setGateOpen(false);
  }, []);

  const addProfile = useCallback(
    (p: Omit<Profile, "id">) => {
      const id = "p" + Date.now();
      setProfiles((prev) => [...prev, { ...p, id }]);
      toast(`Profile "${p.name}" created`, "✅");
    },
    [toast]
  );

  const updateProfile = useCallback(
    (id: string, patch: Partial<Profile>) => {
      setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      toast("Profile updated", "✅");
    },
    [toast]
  );

  const deleteProfile = useCallback(
    (id: string) => {
      setProfiles((prev) => (prev.length <= 1 ? prev : prev.filter((p) => p.id !== id)));
      setAllData((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setActiveId((cur) => (cur === id ? null : cur));
      toast("Profile deleted", "🗑️");
    },
    [toast]
  );

  const inList = useCallback((id: number) => data.list.some((m) => m.id === id), [data.list]);

  const toggleList = useCallback(
    (m: Movie) => {
      const has = data.list.some((x) => x.id === m.id);
      mutate((d) => ({ ...d, list: has ? d.list.filter((x) => x.id !== m.id) : [m, ...d.list] }));
      toast(has ? `Removed from My List` : `Added "${m.title || m.name}" to My List`, has ? "➖" : "➕");
    },
    [data.list, mutate, toast]
  );

  const ratingOf = useCallback(
    (id: number): "up" | "down" | "love" | null =>
      data.loved.includes(id) ? "love" : data.liked.includes(id) ? "up" : data.disliked.includes(id) ? "down" : null,
    [data]
  );

  const rate = useCallback(
    (m: Movie, kind: "up" | "down" | "love") => {
      mutate((d) => {
        const id = m.id;
        const was =
          d.loved.includes(id) ? "love" : d.liked.includes(id) ? "up" : d.disliked.includes(id) ? "down" : null;
        if (was === kind) return { ...d, liked: d.liked.filter((x) => x !== id), disliked: d.disliked.filter((x) => x !== id), loved: d.loved.filter((x) => x !== id) };
        return {
          ...d,
          liked: kind === "up" ? [...d.liked.filter((x) => x !== id), id] : d.liked.filter((x) => x !== id),
          disliked: kind === "down" ? [...d.disliked.filter((x) => x !== id), id] : d.disliked.filter((x) => x !== id),
          loved: kind === "love" ? [...d.loved.filter((x) => x !== id), id] : d.loved.filter((x) => x !== id),
        };
      });
      const label = kind === "up" ? "Rated: I like this" : kind === "down" ? "Rated: Not for me" : "Rated: Love this!";
      toast(label, kind === "up" ? "👍" : kind === "down" ? "👎" : "❤️");
    },
    [mutate, toast]
  );

  const clearRating = useCallback((id: number) => {
    mutate((d) => ({
      ...d,
      liked: d.liked.filter((x) => x !== id),
      disliked: d.disliked.filter((x) => x !== id),
      loved: d.loved.filter((x) => x !== id),
    }));
  }, [mutate]);

  const progressOf = useCallback(
    (id: number) => data.progress.find((p) => p.id === id),
    [data.progress]
  );

  const saveProgress = useCallback(
    (m: Movie, pct: number, seconds: number, episodeLabel?: string) => {
      if (pct <= 1) return;
      mutate((d) => {
        const rest = d.progress.filter((p) => p.id !== m.id);
        return { ...d, progress: [{ id: m.id, pct, seconds, at: Date.now(), item: m, episodeLabel }, ...rest].slice(0, 20) };
      });
    },
    [mutate]
  );

  const clearProgress = useCallback(
    (id: number) => mutate((d) => ({ ...d, progress: d.progress.filter((p) => p.id !== id) })),
    [mutate]
  );

  const pushSearch = useCallback(
    (q: string) => {
      const t = q.trim();
      if (!t) return;
      mutate((d) => ({
        ...d,
        history: [{ q: t, at: Date.now() }, ...d.history.filter((h) => h.q.toLowerCase() !== t.toLowerCase())].slice(0, 12),
      }));
    },
    [mutate]
  );

  const clearHistory = useCallback(() => mutate((d) => ({ ...d, history: [] })), [mutate]);
  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const value: Ctx = {
    profiles, active, data, toasts, gateOpen, manageOpen,
    setGateOpen, setManageOpen, selectProfile, addProfile, updateProfile, deleteProfile,
    inList, toggleList, ratingOf, rate, clearRating, progressOf, saveProgress, clearProgress,
    pushSearch, clearHistory, toast, dismissToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
