import { memo } from "react";
import {
  img,
  matchPct,
  maturityFor,
  titleOf,
  yearOf,
  genreNames,
  type Movie,
} from "../api/tmdb";
import { useStore } from "../store/profiles";

interface Props {
  item: Movie;
  variant?: "poster" | "wide";
  rank?: number;
  className?: string;
  onPlay: (m: Movie) => void;
  onInfo: (m: Movie) => void;
}

function CardBase({ item, variant = "poster", rank, className = "", onPlay, onInfo }: Props) {
  const { inList, toggleList, ratingOf, rate, progressOf } = useStore();
  const rating = ratingOf(item.id);
  const prog = progressOf(item.id);
  const listed = inList(item.id);

  return (
    <div className={`group/card relative shrink-0 ${className}`}>
      <button
        onClick={() => onInfo(item)}
        className="block w-full text-left overflow-hidden rounded-sm bg-[#1b1b1b] ring-white/0 group-hover/card:ring-2 group-hover/card:ring-white/10 transition"
      >
        <div className="relative">
          <img
            src={img(variant === "wide" ? item.backdrop_path || item.poster_path : item.poster_path || item.backdrop_path, "w500")}
            alt={titleOf(item)}
            loading="lazy"
            className={`w-full object-cover transition duration-300 group-hover/card:opacity-80 ${
              variant === "wide" ? "aspect-video" : "aspect-[2/3]"
            }`}
          />
          {rank && (
            <span className="absolute -left-1 bottom-0 text-[64px] md:text-[86px] leading-none font-black text-black/80 [-webkit-text-stroke:2px_#6d6d6e] select-none">
              {rank}
            </span>
          )}
          {prog && (
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/30">
              <div className="h-full bg-netflix-red" style={{ width: `${prog.pct}%` }} />
            </div>
          )}
        </div>
      </button>

      {/* hover chrome */}
      <div className="pointer-events-none absolute inset-x-0 -bottom-1 translate-y-1 opacity-0 group-hover/card:pointer-events-auto group-hover/card:translate-y-0 group-hover/card:opacity-100 transition duration-200 z-20">
        <div className="rounded-sm bg-[#181818] shadow-2xl p-2.5 space-y-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPlay(item)}
              aria-label="Play"
              className="h-7 w-7 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/80"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </button>
            <button
              onClick={() => toggleList(item)}
              aria-label="My List"
              className={`h-7 w-7 rounded-full border-2 flex items-center justify-center ${
                listed ? "border-white bg-white/20" : "border-white/50 hover:border-white"
              }`}
            >
              {listed ? (
                <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path d="M20 6 9 17l-5-5" /></svg>
              ) : (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}><path d="M12 5v14M5 12h14" /></svg>
              )}
            </button>
            <button
              onClick={() => rate(item, "up")}
              aria-label="I like this"
              className={`h-7 w-7 rounded-full border-2 flex items-center justify-center ${
                rating === "up" ? "border-white bg-white/20" : "border-white/50 hover:border-white"
              }`}
            >
              <svg className={`h-3.5 w-3.5 ${rating === "up" ? "text-white" : "text-white"}`} viewBox="0 0 24 24" fill="white"><path d="M7 10v12H3V10h4zm2 0 4-8a3 3 0 0 1 3 3v3h4a2 2 0 0 1 2 2.3l-1.6 8A2 2 0 0 1 18.4 22H9V10z" /></svg>
            </button>
            <button
              onClick={() => onInfo(item)}
              aria-label="More info"
              className="ml-auto h-7 w-7 rounded-full border-2 border-white/50 hover:border-white flex items-center justify-center"
            >
              <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}><path d="m6 9 6 6 6-6" /></svg>
            </button>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-green-400 font-bold">{matchPct(item)}%</span>
            <span className="px-1 border border-white/40 text-white/80">{maturityFor(item)}</span>
            <span className="text-white/70">{yearOf(item)}</span>
          </div>
          <p className="text-[11px] text-white/70 truncate">{genreNames(item).join(" · ")}</p>
        </div>
      </div>
    </div>
  );
}

export default memo(CardBase);
