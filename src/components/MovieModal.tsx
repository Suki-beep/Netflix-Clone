import { useEffect, useState } from "react";
import {
  fetchCredits,
  fetchDetails,
  fetchSeason,
  fetchSimilar,
  fetchVideos,
  img,
  matchPct,
  maturityFor,
  mediaType,
  pickTrailer,
  runtimeText,
  titleOf,
  yearOf,
  type CastMember,
  type Details,
  type Episode,
  type Movie,
} from "../api/tmdb";
import { useStore } from "../store/profiles";

interface Props {
  item: Movie | null;
  onClose: () => void;
  onPlay: (m: Movie, label?: string) => void;
  onSelect: (m: Movie) => void;
}

type Tab = "episodes" | "similar" | "details";

export default function MovieModal({ item, onClose, onPlay, onSelect }: Props) {
  const { inList, toggleList, ratingOf, rate, toast } = useStore();
  const [tab, setTab] = useState<Tab>("details");
  const [details, setDetails] = useState<Details | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [season, setSeason] = useState(1);
  const [seasons, setSeasons] = useState(1);
  const [hasTrailer, setHasTrailer] = useState(true);
  const [loadingEps, setLoadingEps] = useState(false);

  const type = item ? mediaType(item) : "movie";

  useEffect(() => {
    if (!item) return;
    setTab(mediaType(item) === "tv" ? "episodes" : "details");
    setDetails(null); setCast([]); setSimilar([]); setEpisodes([]); setSeason(1); setSeasons(1); setHasTrailer(true);
    fetchDetails(item.id, mediaType(item)).then((d) => {
      setDetails(d);
      setSeasons(Math.max(1, Math.min(20, d.number_of_seasons || 1)));
    }).catch(() => {});
    fetchVideos(item.id, mediaType(item)).then((v) => setHasTrailer(!!pickTrailer(v))).catch(() => setHasTrailer(false));
    fetchCredits(item.id, mediaType(item)).then((c) => setCast(c.cast || [])).catch(() => {});
    fetchSimilar(item.id, mediaType(item)).then((s) => setSimilar(s.slice(0, 12))).catch(() => {});
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [item]);

  useEffect(() => {
    if (!item || tab !== "episodes") return;
    setLoadingEps(true);
    fetchSeason(item.id, season)
      .then((s) => setEpisodes(s.episodes || []))
      .catch(() => setEpisodes([]))
      .finally(() => setLoadingEps(false));
  }, [item, season, tab]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!item) return null;

  const title = titleOf(item);
  const rating = ratingOf(item.id);
  const listed = inList(item.id);
  const creators = details?.created_by?.map((c) => c.name).join(", ");

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}#title-${item.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied to clipboard", "🔗");
    } catch {
      toast("Share link: " + url, "🔗");
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    ...(type === "tv" ? [{ key: "episodes" as Tab, label: "Episodes" }] : []),
    { key: "similar", label: "More Like This" },
    { key: "details", label: "Details" },
  ];

  return (
    <div className="fixed inset-0 z-[70] bg-black/75 overflow-y-auto" onClick={onClose}>
      <div
        className="relative mx-auto my-6 md:my-10 w-full max-w-[900px] bg-[#181818] rounded-md overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-[#181818] text-white flex items-center justify-center hover:bg-black transition"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>

        {/* hero */}
        <div className="relative aspect-video bg-black">
          <img src={img(item.backdrop_path || item.poster_path, "original")} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-[#181818]/20 to-transparent" />
          <div className="absolute bottom-5 left-5 md:left-8 right-5 space-y-4">
            <h2 className="text-white text-2xl md:text-4xl font-black drop-shadow-2xl">{title}</h2>
            <div className="flex flex-wrap items-center gap-2.5">
              {hasTrailer && (
                <button
                  onClick={() => onPlay(item)}
                  className="flex items-center gap-2 bg-white text-black px-5 md:px-7 py-2 rounded font-bold hover:bg-white/80 transition"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  Play
                </button>
              )}
              <button
                onClick={() => toggleList(item)}
                aria-label="My List"
                className={`h-10 w-10 rounded-full border-2 flex items-center justify-center transition ${listed ? "border-white bg-white/20" : "border-white/60 hover:border-white"}`}
              >
                {listed ? (
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M20 6 9 17l-5-5" /></svg>
                ) : (
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M12 5v14M5 12h14" /></svg>
                )}
              </button>
              <button
                onClick={() => rate(item, "up")}
                aria-label="I like this"
                className={`h-10 w-10 rounded-full border-2 flex items-center justify-center transition ${rating === "up" ? "border-white bg-white/20" : "border-white/60 hover:border-white"}`}
              >
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10v12H3V10h4zm2 0 4-8a3 3 0 0 1 3 3v3h4a2 2 0 0 1 2 2.3l-1.6 8A2 2 0 0 1 18.4 22H9V10z" /></svg>
              </button>
              <button
                onClick={() => rate(item, "love")}
                aria-label="Love this"
                className={`h-10 w-10 rounded-full border-2 flex items-center justify-center transition ${rating === "love" ? "border-white bg-white/20" : "border-white/60 hover:border-white"}`}
              >
                <span className={rating === "love" ? "text-lg" : "text-lg grayscale opacity-80"}>❤️</span>
              </button>
              <button
                onClick={() => rate(item, "down")}
                aria-label="Not for me"
                className={`h-10 w-10 rounded-full border-2 flex items-center justify-center transition ${rating === "down" ? "border-white bg-white/20" : "border-white/60 hover:border-white"}`}
              >
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M17 14V2h4v12h-4zm-2 0-4 8a3 3 0 0 1-3-3v-3H4a2 2 0 0 1-2-2.3l1.6-8A2 2 0 0 1 5.6 2H15v12z" /></svg>
              </button>
              <button
                onClick={share}
                aria-label="Share"
                className="ml-auto h-10 w-10 rounded-full border-2 border-white/60 hover:border-white flex items-center justify-center transition"
              >
                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M12 3v12" /><path d="m8 7 4-4 4 4" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* meta strip */}
        <div className="grid md:grid-cols-[1fr_260px] gap-8 p-5 md:p-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-green-400 font-bold">{matchPct(item)}% Match</span>
              <span className="text-white/80">{yearOf(item)}</span>
              {runtimeText(details?.runtime || details?.episode_run_time?.[0]) && (
                <span className="text-white/80">{runtimeText(details?.runtime || details?.episode_run_time?.[0])}</span>
              )}
              <span className="px-1.5 border border-white/40 text-xs text-white/80">{maturityFor(item)}</span>
              <span className="px-1.5 border border-white/40 text-xs text-white/80">HD</span>
              {type === "tv" && details?.number_of_seasons && (
                <span className="text-white/80">{details.number_of_seasons} Season{details.number_of_seasons > 1 ? "s" : ""}</span>
              )}
            </div>
            {details?.tagline && <p className="text-white/60 italic text-sm">{details.tagline}</p>}
            <p className="text-white/90 text-sm leading-relaxed">{item.overview || details?.overview}</p>

            {rating && (
              <div className="flex items-center gap-2 text-xs text-white/70">
                <span>Your rating:</span>
                <button onClick={() => rate(item, "up")} className="underline hover:text-white">I like this</button>
                <button onClick={() => rate(item, "love")} className="underline hover:text-white">Love this!</button>
                <button onClick={() => rate(item, "down")} className="underline hover:text-white">Not for me</button>
              </div>
            )}
          </div>

          <div className="space-y-3 text-xs leading-relaxed">
            {cast.length > 0 && (
              <p><span className="text-white/50">Cast: </span><span className="text-white/90">{cast.slice(0, 4).map((c) => c.name).join(", ")}</span>{cast.length > 4 && <span className="text-white/50">, more</span>}</p>
            )}
            {creators && <p><span className="text-white/50">{type === "tv" ? "Creator" : "Director"}: </span><span className="text-white/90">{creators}</span></p>}
            <p><span className="text-white/50">Genres: </span><span className="text-white/90">{details?.genres?.map((g) => g.name).join(", ") || "—"}</span></p>
            <p><span className="text-white/50">This title is: </span><span className="text-white/90">Exciting, Suspenseful</span></p>
          </div>
        </div>

        {/* tabs */}
        <div className="sticky top-0 z-10 bg-[#181818] border-t border-white/10 px-5 md:px-8">
          <div className="flex gap-6 overflow-x-auto scrollbar-hide">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`py-3 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition ${
                  tab === t.key ? "border-netflix-red text-white" : "border-transparent text-white/50 hover:text-white/80"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* tab content */}
        <div className="p-5 md:p-8 pt-5">
          {tab === "episodes" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold">Episodes</h3>
                <select
                  value={season}
                  onChange={(e) => setSeason(Number(e.target.value))}
                  className="bg-[#333] text-white text-sm px-3 py-2 rounded outline-none"
                >
                  {Array.from({ length: seasons }, (_, i) => i + 1).map((s) => (
                    <option key={s} value={s}>Season {s}</option>
                  ))}
                </select>
              </div>
              {loadingEps && <p className="text-white/50 text-sm">Loading episodes…</p>}
              {!loadingEps && episodes.length === 0 && <p className="text-white/50 text-sm">No episode data available.</p>}
              {episodes.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => onPlay(item, `S${season}:E${ep.episode_number} ${ep.name}`)}
                  className="w-full flex gap-4 p-3 rounded hover:bg-white/5 transition text-left group"
                >
                  <span className="text-white/60 text-lg w-6 text-center self-center">{ep.episode_number}</span>
                  <div className="relative h-16 md:h-20 w-28 md:w-36 shrink-0 rounded overflow-hidden bg-[#222]">
                    {ep.still_path && <img src={img(ep.still_path, "w300")} alt="" className="w-full h-full object-cover" />}
                    <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-white font-semibold truncate">{ep.name}</p>
                      <span className="text-white/50 text-xs whitespace-nowrap">{ep.runtime ? `${ep.runtime}m` : ""}</span>
                    </div>
                    <p className="text-white/60 text-xs line-clamp-2 mt-1">{ep.overview}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {tab === "similar" && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {similar.length === 0 && <p className="text-white/50 text-sm">No recommendations yet.</p>}
              {similar.map((m) => (
                <div key={m.id} className="bg-[#232323] rounded overflow-hidden group">
                  <button onClick={() => { onSelect(m); window.scrollTo({ top: 0 }); }} className="block w-full">
                    <img src={img(m.backdrop_path || m.poster_path, "w500")} alt={titleOf(m)} className="w-full aspect-video object-cover group-hover:opacity-80 transition" />
                  </button>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-400 font-bold">{matchPct(m)}%</span>
                        <span className="px-1 border border-white/30 text-white/70">{maturityFor(m)}</span>
                        <span className="text-white/60">{yearOf(m)}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => onPlay(m)} aria-label="Play" className="h-7 w-7 rounded-full border border-white/50 hover:border-white flex items-center justify-center">
                          <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                        </button>
                        <button onClick={() => toggleList(m)} aria-label="Add" className="h-7 w-7 rounded-full border border-white/50 hover:border-white flex items-center justify-center">
                          <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M12 5v14M5 12h14" /></svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-white truncate">{titleOf(m)}</p>
                    <p className="text-xs text-white/60 line-clamp-3">{m.overview}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "details" && (
            <div className="space-y-8 text-sm">
              <div>
                <h3 className="text-white/50 text-xs uppercase tracking-widest mb-3">Cast</h3>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                  {cast.length === 0 && <p className="text-white/50">Cast information unavailable.</p>}
                  {cast.slice(0, 12).map((c) => (
                    <div key={c.id} className="w-24 shrink-0 text-center space-y-2">
                      <div className="h-24 w-24 rounded-full overflow-hidden bg-[#333] mx-auto">
                        {c.profile_path && <img src={img(c.profile_path, "w300")} alt={c.name} className="w-full h-full object-cover" />}
                      </div>
                      <p className="text-xs text-white font-medium leading-tight">{c.name}</p>
                      <p className="text-[11px] text-white/50 leading-tight">{c.character}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-x-10 gap-y-3">
                {[
                  ["Type", type === "tv" ? "Series" : "Film"],
                  ["Release", item.release_date || item.first_air_date || "—"],
                  ["Status", details?.status || "—"],
                  ["Original language", (details?.spoken_languages?.[0]?.english_name) || item.original_language?.toUpperCase() || "—"],
                  ["Seasons", details?.number_of_seasons ? String(details.number_of_seasons) : "—"],
                  ["Episodes", details?.number_of_episodes ? String(details.number_of_episodes) : "—"],
                  ["Runtime", runtimeText(details?.runtime) || "—"],
                  ["TMDB score", `${(item.vote_average || 0).toFixed(1)} / 10`],
                  ["Production", details?.production_companies?.slice(0, 2).map((p) => p.name).join(", ") || "—"],
                ].map(([k, v]) => (
                  <p key={k} className="border-b border-white/10 pb-2">
                    <span className="text-white/50">{k}: </span>
                    <span className="text-white/90">{v}</span>
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
