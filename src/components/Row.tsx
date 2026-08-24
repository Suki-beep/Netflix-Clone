import { useEffect, useRef, useState } from "react";
import { fetchFeed, type Feed, type Movie } from "../api/tmdb";
import Card from "./Card";

interface Props {
  title: string;
  feed?: Feed;
  items?: Movie[];
  variant?: "poster" | "wide" | "top10";
  subtitle?: string;
  onPlay: (m: Movie) => void;
  onInfo: (m: Movie) => void;
}

export default function Row({ title, feed, items, variant = "poster", subtitle, onPlay, onInfo }: Props) {
  const [data, setData] = useState<Movie[]>([]);
  const [expanded, setExpanded] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    if (!feed || items) return;
    let alive = true;
    setData([]);
    fetchFeed(feed)
      .then((r) => alive && setData(r))
      .catch(() => {});
    return () => { alive = false; };
  }, [feed, items]);

  const list = (items ?? data).filter((m) => m.poster_path || m.backdrop_path);
  const shown = variant === "top10" ? list.slice(0, 10) : expanded ? list : list.slice(0, 18);

  const updateArrows = () => {
    const el = scroller.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    updateArrows();
    const el = scroller.current;
    el?.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el?.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [shown.length]);

  if (list.length === 0) return null;

  const nudge = (dir: "l" | "r") => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir === "l" ? -el.clientWidth * 0.9 : el.clientWidth * 0.9, behavior: "smooth" });
  };

  const size =
    variant === "wide"
      ? "w-[240px] md:w-[300px]"
      : variant === "top10"
      ? "w-[190px] md:w-[250px]"
      : "w-[130px] md:w-[165px]";

  return (
    <section className="group/row relative py-3 md:py-4">
      <div className="flex items-end gap-3 px-4 md:px-12 mb-2">
        <h2 className="text-white text-base md:text-xl font-bold">{title}</h2>
        {subtitle && <span className="text-[11px] text-netflix-red mb-0.5">{subtitle}</span>}
        {list.length > 18 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="opacity-0 group-hover/row:opacity-100 transition text-[11px] md:text-xs text-white/60 hover:text-white mb-0.5"
          >
            {expanded ? "Show less" : "Explore all ›"}
          </button>
        )}
      </div>

      <div className="relative">
        {canLeft && (
          <button
            onClick={() => nudge("l")}
            aria-label="Scroll left"
            className="absolute left-0 top-0 bottom-0 z-20 w-8 md:w-12 bg-black/60 opacity-0 group-hover/row:opacity-100 transition flex items-center justify-center text-white hover:bg-black/80"
          >
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="m15 18-6-6 6-6" /></svg>
          </button>
        )}

        <div ref={scroller} className="flex gap-1.5 md:gap-2 overflow-x-auto scrollbar-hide px-4 md:px-12 pb-14 pt-1">
          {shown.map((m, i) => (
            <Card
              key={`${m.id}-${i}`}
              item={m}
              rank={variant === "top10" ? i + 1 : undefined}
              variant={variant === "wide" ? "wide" : "poster"}
              className={size}
              onPlay={onPlay}
              onInfo={onInfo}
            />
          ))}
        </div>

        {canRight && (
          <button
            onClick={() => nudge("r")}
            aria-label="Scroll right"
            className="absolute right-0 top-0 bottom-0 z-20 w-8 md:w-12 bg-black/60 opacity-0 group-hover/row:opacity-100 transition flex items-center justify-center text-white hover:bg-black/80"
          >
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="m9 18 6-6-6-6" /></svg>
          </button>
        )}
      </div>
    </section>
  );
}
