import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchFeed,
  fetchGenres,
  searchMulti,
  titleOf,
  yearOf,
  matchPct,
  maturityFor,
  img,
  type Movie,
} from "../api/tmdb";
import Card from "../components/Card";
import { useStore } from "../store/profiles";

interface PageProps {
  onPlay: (m: Movie, label?: string) => void;
  onInfo: (m: Movie) => void;
}

/* ---------------- filterable grid (TV / Movies / New / Languages) ---------------- */
export function Catalog({
  heading,
  basePath,
  type,
  defaultParams = {},
  showLanguage = false,
  showYear = true,
  onPlay,
  onInfo,
}: PageProps & {
  heading: string;
  basePath: string;
  type: "movie" | "tv";
  defaultParams?: Record<string, string>;
  showLanguage?: boolean;
  showYear?: boolean;
}) {
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState("popularity.desc");
  const [year, setYear] = useState("");
  const [lang, setLang] = useState("en");
  const [items, setItems] = useState<Movie[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(true);

  const yearKey = type === "movie" ? "primary_release_year" : "first_air_date_year";
  const thisYear = new Date().getFullYear();

  const params = useMemo(() => {
    const p: Record<string, string> = { ...defaultParams, sort_by: sort };
    if (genre) p.with_genres = genre;
    if (year) p[yearKey] = year;
    if (showLanguage) p.with_original_language = lang;
    if (sort.startsWith("vote_average")) p["vote_count.gte"] = "300";
    return p;
  }, [defaultParams, sort, genre, year, lang, showLanguage, yearKey]);

  useEffect(() => {
    fetchGenres(type).then(setGenres).catch(() => {});
  }, [type]);

  useEffect(() => { setGenre(""); setYear(""); setSort("popularity.desc"); }, [type, basePath]);

  const load = useCallback(
    (p: number, replace: boolean) => {
      setLoading(true);
      fetchFeed({ path: basePath, params }, p)
        .then((r) => {
          setItems((prev) => (replace ? r : [...prev, ...r]));
          setMore(r.length >= 18 && p < 40);
        })
        .catch(() => replace && setItems([]))
        .finally(() => setLoading(false));
    },
    [basePath, params]
  );

  useEffect(() => {
    setPage(1);
    load(1, true);
  }, [load]);

  return (
    <div className="pt-24 md:pt-28 pb-16 px-4 md:px-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-4xl font-bold text-white">{heading}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="bg-[#242424] text-white px-3 py-2 rounded outline-none border border-white/10"
          >
            <option value="">All genres</option>
            {genres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          {showYear && (
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="bg-[#242424] text-white px-3 py-2 rounded outline-none border border-white/10"
            >
              <option value="">Any year</option>
              {Array.from({ length: 26 }, (_, i) => thisYear - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
          {showLanguage && (
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="bg-[#242424] text-white px-3 py-2 rounded outline-none border border-white/10"
            >
              {[["en", "English"], ["hi", "Hindi"], ["es", "Spanish"], ["fr", "French"], ["ja", "Japanese"], ["ko", "Korean"], ["ta", "Tamil"], ["de", "German"], ["it", "Italian"], ["pt", "Portuguese"]].map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          )}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-[#242424] text-white px-3 py-2 rounded outline-none border border-white/10"
          >
            <option value="popularity.desc">Suggestions for you</option>
            <option value="vote_average.desc">Highest rated</option>
            <option value={type === "movie" ? "primary_release_date.desc" : "first_air_date.desc"}>
              Newest first
            </option>
            <option value="revenue.desc">Biggest blockbusters</option>
            <option value="title.asc">A–Z</option>
          </select>
        </div>
      </div>

      {items.length === 0 && !loading && (
        <p className="text-white/60">No titles match these filters.</p>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
        {items.map((m, i) => (
          <Card
            key={`${m.id}-${i}`}
            item={m}
            className="w-full"
            onPlay={onPlay}
            onInfo={onInfo}
          />
        ))}
        {loading && Array.from({ length: 14 }).map((_, i) => (
          <div key={"s" + i} className="aspect-[2/3] bg-white/5 animate-pulse rounded" />
        ))}
      </div>

      {more && !loading && (
        <div className="flex justify-center mt-10">
          <button
            onClick={() => { const p = page + 1; setPage(p); load(p, false); }}
            className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded font-semibold transition"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- My List page ---------------- */
export function MyListPage({ onPlay, onInfo }: PageProps) {
  const { data, active } = useStore();
  const [tab, setTab] = useState<"list" | "watching" | "liked">("list");

  const sections = {
    list: data.list,
    watching: data.progress.map((p) => p.item),
    liked: data.list.filter((m) => data.liked.includes(m.id) || data.loved.includes(m.id)),
  } as const;

  const items = sections[tab];
  const tabs = [
    { key: "list" as const, label: `My List (${data.list.length})` },
    { key: "watching" as const, label: `Continue Watching (${data.progress.length})` },
    { key: "liked" as const, label: `Liked (${data.liked.length + data.loved.length})` },
  ];

  return (
    <div className="pt-24 md:pt-28 pb-16 px-4 md:px-12">
      <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">My Netflix</h1>
      <p className="text-white/50 text-sm mb-6">Saved for {active?.name || "you"} · stored on this device</p>

      <div className="flex gap-6 border-b border-white/10 mb-7 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-3 text-sm whitespace-nowrap border-b-2 -mb-px transition ${
              tab === t.key ? "text-white border-netflix-red font-semibold" : "text-white/50 hover:text-white/80 border-transparent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <p className="text-white/70">Nothing here yet.</p>
          <p className="text-white/45 text-sm">Hover a title and press + to add it to your list.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
          {items.map((m) => (
            <Card key={m.id} item={m} className="w-full" onPlay={onPlay} onInfo={onInfo} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Search page ---------------- */
export function SearchPage({ query, onPlay, onInfo }: PageProps & { query: string }) {
  const { pushSearch, data } = useStore();
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const q = query.trim();

  useEffect(() => {
    if (!q) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(() => {
      searchMulti(q)
        .then((r) => setResults(r.filter((m) => m.media_type !== "person" && (m.poster_path || m.backdrop_path))))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
      pushSearch(q);
    }, 400);
    return () => clearTimeout(t);
  }, [q, pushSearch]);

  const exploring = useMemo(
    () => Array.from(new Set(data.history.map((h) => h.q))).slice(0, 12),
    [data.history]
  );

  return (
    <div className="pt-24 md:pt-28 pb-16 px-4 md:px-12">
      {q ? (
        <>
          <p className="text-white/70 text-sm mb-5">
            {loading ? "Searching" : results.length} result{results.length === 1 ? "" : "s"} for
            <span className="text-white font-semibold"> “{q}”</span>
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
            {results.map((m) => (
              <div key={m.id} className="space-y-1.5">
                <Card item={m} className="w-full" onPlay={onPlay} onInfo={onInfo} />
                <p className="text-[11px] text-white/70 truncate">
                  {matchPct(m)}% · {maturityFor(m)} · {yearOf(m)}
                </p>
              </div>
            ))}
            {loading && Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-white/5 animate-pulse rounded" />
            ))}
          </div>
          {!loading && results.length === 0 && (
            <div className="py-16 space-y-2">
              <p className="text-white/80">Your search for “{q}” did not have any matches.</p>
              <p className="text-white/50 text-sm">Suggestions: try different keywords, a title name, genre or actor.</p>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-8">
          <div className="relative h-64 md:h-80 rounded-lg overflow-hidden">
            <img
              src={img(results[0]?.backdrop_path || data.list[0]?.backdrop_path, "original") || "https://image.tmdb.org/t/p/original"}
              alt=""
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <h1 className="text-2xl md:text-4xl font-bold">Search Netflix</h1>
              <p className="text-white/60 text-sm">Search by title, genre, year or keyword.</p>
            </div>
          </div>
          {exploring.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Recent searches</h2>
              <div className="flex flex-wrap gap-2">
                {exploring.map((h) => (
                  <span key={h} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-sm">{h}</span>
                ))}
              </div>
            </div>
          )}
          {data.list.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Titles in your list</h2>
              <div className="flex flex-wrap gap-2">
                {data.list.map((m) => (
                  <button key={m.id} onClick={() => onInfo(m)} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-sm">
                    {titleOf(m)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
