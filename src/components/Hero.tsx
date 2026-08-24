import { useEffect, useState } from "react";
import {
  fetchVideos,
  img,
  matchPct,
  maturityFor,
  mediaType,
  pickTrailer,
  titleOf,
  yearOf,
  genreNames,
  type Movie,
} from "../api/tmdb";
import { useStore } from "../store/profiles";

interface Props {
  movie: Movie;
  onPlay: (m: Movie) => void;
  onInfo: (m: Movie) => void;
  rankLabel?: string;
}

export default function Hero({ movie, onPlay, onInfo, rankLabel }: Props) {
  const { active, inList, toggleList } = useStore();
  const [key, setKey] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);
  const previewsOn = active?.autoplayPreviews !== false;

  useEffect(() => {
    setKey(null);
    setReady(false);
    if (!previewsOn) return;
    const t = window.setTimeout(() => {
      fetchVideos(movie.id, mediaType(movie))
        .then((v) => setKey(pickTrailer(v)?.key || null))
        .catch(() => setKey(null));
    }, 1200);
    return () => window.clearTimeout(t);
  }, [movie.id, previewsOn]);

  const listed = inList(movie.id);

  return (
    <section className="relative h-[88vh] min-h-[520px] w-full overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={img(movie.backdrop_path || movie.poster_path, "original")}
          alt={titleOf(movie)}
          className={`w-full h-full object-cover transition-opacity duration-700 ${key && ready ? "opacity-0" : "opacity-100"}`}
        />
        {key && (
          <iframe
            key={key}
            title="preview"
            src={`https://www.youtube.com/embed/${key}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&loop=1&playlist=${key}&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&start=8`}
            onLoad={() => setReady(true)}
            className="absolute top-1/2 left-1/2 w-[190%] h-[190%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            allow="autoplay; encrypted-media"
            frameBorder={0}
          />
        )}
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent" />

      <div className="relative z-10 h-full flex flex-col justify-end md:justify-center pb-28 md:pb-16 px-4 md:px-12">
        <div className="max-w-xl space-y-4">
          <div className="flex items-center gap-2 text-xs md:text-sm text-white/80">
            <span className={`font-black ${active?.kids ? "text-[#1e80e5]" : "text-netflix-red"}`}>N</span>
            <span className="uppercase tracking-[0.2em]">
              {mediaType(movie) === "tv" ? "Series" : "Film"}
            </span>
            {rankLabel && (
              <span className="ml-2 font-bold text-white bg-netflix-red px-1.5 py-0.5 text-[10px] uppercase">{rankLabel}</span>
            )}
          </div>

          <h1 className="text-3xl md:text-6xl font-black text-white leading-tight drop-shadow-2xl">
            {titleOf(movie)}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-sm text-white/85">
            <span className="text-green-400 font-bold">{matchPct(movie)}% Match</span>
            <span>{yearOf(movie)}</span>
            <span className="px-1.5 border border-white/40 text-xs">{maturityFor(movie)}</span>
            <span className="px-1.5 border border-white/40 text-xs">HD</span>
            <span className="hidden sm:inline">{genreNames(movie).join(" · ")}</span>
          </div>

          <p className="text-white/90 text-sm md:text-base line-clamp-3 drop-shadow max-w-lg">{movie.overview}</p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onPlay(movie)}
              className="flex items-center gap-2 bg-white text-black px-6 md:px-8 py-2.5 md:py-3 rounded font-bold hover:bg-white/80 transition"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              Play
            </button>
            <button
              onClick={() => onInfo(movie)}
              className="flex items-center gap-2 bg-white/25 backdrop-blur text-white px-6 md:px-8 py-2.5 md:py-3 rounded font-bold hover:bg-white/35 transition"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
              </svg>
              More Info
            </button>
            <button
              onClick={() => toggleList(movie)}
              className="flex items-center justify-center h-11 w-11 rounded-full border-2 border-white/50 hover:border-white text-white transition"
              aria-label="My List"
            >
              {listed ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M20 6 9 17l-5-5" /></svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M12 5v14M5 12h14" /></svg>
              )}
            </button>
            {key && (
              <button
                onClick={() => setMuted((m) => !m)}
                className="ml-auto flex items-center justify-center h-11 w-11 rounded-full border-2 border-white/50 hover:border-white text-white transition"
                aria-label="Toggle sound"
              >
                {muted ? (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M11 5 6 9H2v6h4l5 4V5z" /><line x1="22" y1="9" x2="16" y2="15" /><line x1="16" y1="9" x2="22" y2="15" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a10 10 0 0 1 0 14" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
