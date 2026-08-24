import { useEffect, useRef, useState } from "react";
import { useStore } from "../store/profiles";
import { titleOf } from "../api/tmdb";
import type { Route } from "../hooks/useHashRoute";

interface Props {
  route: Route;
  go: (r: Route) => void;
  query: string;
  setQuery: (q: string) => void;
}

const LINKS: { label: string; route: Route }[] = [
  { label: "Home", route: "home" },
  { label: "TV Shows", route: "tv" },
  { label: "Movies", route: "movies" },
  { label: "New & Popular", route: "new" },
  { label: "My List", route: "mylist" },
  { label: "Browse by Languages", route: "languages" },
];

export default function Navbar({ route, go, query, setQuery }: Props) {
  const { active, profiles, selectProfile, setGateOpen, setManageOpen, data, clearHistory, toast } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(!!query);
  const [menu, setMenu] = useState<"none" | "profile" | "bell" | "mobile">("none");
  const inputRef = useRef<HTMLInputElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setMenu("none");
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const notifications = [
    ...data.progress.slice(0, 3).map((p) => ({
      title: `Continue watching ${titleOf(p.item)}`,
      body: `${Math.round(p.pct)}% complete`,
      poster: p.item.poster_path,
      id: "c" + p.id,
    })),
    ...data.list.slice(0, 2).map((m) => ({
      title: `New episode of ${titleOf(m)}`,
      body: "Now on Netflix",
      poster: m.poster_path,
      id: "n" + m.id,
    })),
  ];

  const kidsProfile = profiles.find((p) => p.kids);

  return (
    <div ref={navRef}>
      {/* top bar */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
          scrolled || menu !== "none" ? "bg-[#141414]" : "bg-gradient-to-b from-black/80 via-black/40 to-transparent"
        }`}
      >
        <div className="flex items-center gap-4 md:gap-8 px-4 md:px-12 py-3">
          <button onClick={() => go("home")} className="shrink-0">
            <span className={`font-black tracking-tighter text-2xl md:text-3xl select-none ${active?.kids ? "text-[#1e80e5]" : "text-netflix-red"}`}>
              {active?.kids ? "NETFLIX KIDS" : "NETFLIX"}
            </span>
          </button>

          <nav className="hidden lg:flex items-center gap-5 text-sm">
            {LINKS.map((l) => (
              <button
                key={l.route}
                onClick={() => go(l.route)}
                className={`transition hover:text-white/60 ${
                  route === l.route ? "font-semibold text-white" : "text-white/85"
                }`}
              >
                {l.label}
              </button>
            ))}
          </nav>

          <button
            onClick={() => setMenu((m) => (m === "mobile" ? "none" : "mobile"))}
            className="lg:hidden text-white/85 text-sm"
          >
            Browse ▾
          </button>

          <div className="ml-auto flex items-center gap-4 md:gap-5 text-white">
            {/* search */}
            <div className={`flex items-center transition-all ${searchOpen ? "bg-black/90 border border-white/40" : "border border-transparent"}`}>
              <button onClick={() => setSearchOpen((s) => !s)} aria-label="Search">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
              </button>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && go("search")}
                placeholder="Titles, people, genres"
                className={`bg-transparent outline-none text-sm px-2 py-1 transition-all ${
                  searchOpen ? "w-36 md:w-56 opacity-100" : "w-0 px-0 opacity-0"
                }`}
              />
              {query && (
                <button onClick={() => setQuery("")} className="pr-2 text-white/60 hover:text-white" aria-label="Clear">✕</button>
              )}
            </div>

            <button
              onClick={() => { if (kidsProfile) { selectProfile(kidsProfile.id); go("home"); } else { setManageOpen(true); } }}
              className="hidden md:inline text-sm text-white/85 hover:text-white/60"
            >
              {active?.kids ? "Exit Kids" : "Kids"}
            </button>

            {/* notifications */}
            <div className="relative">
              <button onClick={() => setMenu((m) => (m === "bell" ? "none" : "bell"))} aria-label="Notifications" className="relative">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-netflix-red text-[10px] h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              {menu === "bell" && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-[#141414] border-t-2 border-white/70 shadow-2xl py-2 max-h-[70vh] overflow-y-auto">
                  <div className="flex items-center justify-between px-4 pb-2">
                    <p className="text-sm font-semibold">Notifications</p>
                    {data.history.length > 0 && (
                      <button onClick={clearHistory} className="text-[11px] text-white/50 hover:text-white underline">clear searches</button>
                    )}
                  </div>
                  {notifications.length === 0 && (
                    <p className="px-4 py-6 text-sm text-white/50">No notifications yet — add titles to My List.</p>
                  )}
                  {notifications.map((n) => (
                    <div key={n.id} className="flex gap-3 px-4 py-3 hover:bg-white/5 transition">
                      <div className="h-14 w-24 shrink-0 bg-[#222] overflow-hidden rounded-sm">
                        {n.poster && <img src={`https://image.tmdb.org/t/p/w300${n.poster}`} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{n.title}</p>
                        <p className="text-xs text-white/50">{n.body}</p>
                        <button onClick={() => { setMenu("none"); go("mylist"); }} className="mt-1 text-[11px] text-white/70 hover:text-white underline">view</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* profile */}
            <div className="relative">
              <button onClick={() => setMenu((m) => (m === "profile" ? "none" : "profile"))} className="flex items-center gap-2">
                <span className={`h-8 w-8 rounded bg-gradient-to-br ${active?.color || "from-gray-600 to-gray-800"} flex items-center justify-center`}>
                  {active?.avatar || "👤"}
                </span>
                <svg className={`h-3 w-3 transition-transform ${menu === "profile" ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {menu === "profile" && (
                <div className="absolute right-0 mt-3 w-60 bg-[#141414] border-t-2 border-white/70 shadow-2xl py-3 text-sm">
                  {profiles.filter((p) => p.id !== active?.id).slice(0, 4).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { selectProfile(p.id); setMenu("none"); go("home"); toast(`Switched to ${p.name}`, p.avatar); }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:underline text-white/85"
                    >
                      <span className={`h-7 w-7 rounded bg-gradient-to-br ${p.color} flex items-center justify-center`}>{p.avatar}</span>
                      {p.name}
                    </button>
                  ))}
                  <button onClick={() => { setManageOpen(true); setMenu("none"); }} className="w-full text-left px-4 py-2 hover:underline text-white/85">
                    Manage Profiles
                  </button>
                  <button onClick={() => { setManageOpen(true); setMenu("none"); }} className="w-full text-left px-4 py-2 hover:underline text-white/85">
                    Account
                  </button>
                  <button onClick={() => { setGateOpen(true); setMenu("none"); }} className="w-full text-left px-4 pt-2 mt-1 border-t border-white/15 hover:underline text-white/85">
                    Sign out of Netflix
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* mobile browse */}
        {menu === "mobile" && (
          <nav className="lg:hidden bg-[#141414] border-t border-white/10 py-2">
            {LINKS.map((l) => (
              <button
                key={l.route}
                onClick={() => { go(l.route); setMenu("none"); }}
                className={`block w-full text-left px-6 py-2.5 text-sm ${route === l.route ? "text-white font-semibold" : "text-white/70"}`}
              >
                {l.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      {/* recent searches pill row */}
      {route === "search" && data.history.length > 0 && (
        <div className="fixed top-[60px] inset-x-0 z-40 bg-[#141414]/95 border-b border-white/10 px-4 md:px-12 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <span className="text-xs text-white/50 shrink-0">Recent:</span>
          {data.history.map((h) => (
            <button
              key={h.q}
              onClick={() => setQuery(h.q)}
              className="shrink-0 text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full text-white/85"
            >
              {h.q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
