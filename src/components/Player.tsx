import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchVideos,
  img,
  loadYouTubeAPI,
  mediaType,
  pickTrailer,
  titleOf,
  type Movie,
} from "../api/tmdb";
import { useStore } from "../store/profiles";

interface Props {
  item: Movie;
  startAt?: number;
  episodeLabel?: string;
  nextLabel?: string;
  onNext?: () => void;
  onClose: () => void;
}

const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
};

export default function Player({ item, startAt = 0, episodeLabel, nextLabel, onNext, onClose }: Props) {
  const { saveProgress, active } = useStore();
  const holder = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number | null>(null);
  const lastSaved = useRef(0);

  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "none">("loading");
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(70);
  const [time, setTime] = useState(startAt);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [showUI, setShowUI] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [ended, setEnded] = useState(false);
  const [countdown, setCountdown] = useState(8);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Resolve trailer
  useEffect(() => {
    let alive = true;
    setStatus("loading");
    setVideoKey(null);
    setEnded(false);
    setTime(startAt);
    lastSaved.current = 0;
    fetchVideos(item.id, mediaType(item))
      .then((v) => {
        if (!alive) return;
        const t = pickTrailer(v);
        if (t) { setVideoKey(t.key); setStatus("ready"); }
        else setStatus("none");
      })
      .catch(() => alive && setStatus("none"));
    return () => { alive = false; };
  }, [item.id, startAt]);

  // Build player
  useEffect(() => {
    if (!videoKey || !holder.current) return;
    let destroyed = false;
    loadYouTubeAPI().then((YT) => {
      if (destroyed || !holder.current) return;
      playerRef.current = new YT.Player(holder.current, {
        videoId: videoKey,
        playerVars: {
          controls: 0, disablekb: 1, modestbranding: 1, rel: 0, playsinline: 1,
          fs: 0, iv_load_policy: 3, start: Math.floor(startAt), autoplay: 1,
        },
        events: {
          onReady: (e: any) => {
            setDuration(e.target.getDuration() || 0);
            e.target.setVolume(volume);
            if (muted) e.target.mute();
            e.target.playVideo();
          },
          onStateChange: (e: any) => {
            const S = (window as any).YT.PlayerState;
            if (e.data === S.PLAYING) { setPlaying(true); setEnded(false); setDuration(e.target.getDuration() || 0); }
            if (e.data === S.PAUSED) setPlaying(false);
            if (e.data === S.ENDED) { setPlaying(false); setEnded(true); setCountdown(8); }
            if (e.data === S.BUFFERING) setShowUI(true);
          },
        },
      });
    });
    return () => {
      destroyed = true;
      try { playerRef.current?.destroy?.(); } catch { /* noop */ }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoKey]);

  // ticker
  useEffect(() => {
    const iv = window.setInterval(() => {
      const p = playerRef.current;
      if (!p?.getCurrentTime) return;
      const t = p.getCurrentTime() || 0;
      const d = p.getDuration() || 0;
      setTime(t);
      if (d) setDuration(d);
      if (d && t - lastSaved.current > 4) {
        lastSaved.current = t;
        saveProgress(item, Math.min(100, (t / d) * 100), t, episodeLabel);
      }
    }, 400);
    return () => window.clearInterval(iv);
  }, [item, episodeLabel, saveProgress]);

  // countdown to next episode
  useEffect(() => {
    if (!ended || !onNext || !active?.autoplayNext) return;
    if (countdown <= 0) { onNext(); return; }
    const t = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [ended, countdown, onNext, active?.autoplayNext]);

  const flash = (m: string) => { setToastMsg(m); window.setTimeout(() => setToastMsg(null), 900); };

  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    const S = (window as any).YT?.PlayerState;
    if (p.getPlayerState?.() === S?.PLAYING) { p.pauseVideo(); flash("Paused"); }
    else { p.playVideo(); flash("Playing"); }
  }, []);

  const seekTo = useCallback((t: number) => {
    playerRef.current?.seekTo?.(Math.max(0, t), true);
    setTime(Math.max(0, t));
  }, []);

  const nudge = useCallback((d: number) => { seekTo((playerRef.current?.getCurrentTime?.() || 0) + d); flash(d > 0 ? "Forward 10s" : "Back 10s"); }, [seekTo]);

  const setVol = (v: number) => {
    setVolume(v);
    setMuted(v === 0);
    playerRef.current?.setVolume?.(v);
    if (v > 0) playerRef.current?.unMute?.();
  };
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (next) playerRef.current?.mute?.();
    else { playerRef.current?.unMute?.(); playerRef.current?.setVolume?.(volume || 60); }
  };
  const setRate = (r: number) => {
    setSpeed(r);
    playerRef.current?.setPlaybackRate?.(r);
    setSpeedOpen(false);
    flash(`Speed ${r}x`);
  };
  const toggleFullscreen = () => {
    const el = shell.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  };

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      switch (e.key) {
        case " ": case "k": e.preventDefault(); toggle(); break;
        case "ArrowRight": e.preventDefault(); nudge(10); break;
        case "ArrowLeft": e.preventDefault(); nudge(-10); break;
        case "ArrowUp": e.preventDefault(); setVol(Math.min(100, volume + 10)); break;
        case "ArrowDown": e.preventDefault(); setVol(Math.max(0, volume - 10)); break;
        case "m": toggleMute(); break;
        case "f": toggleFullscreen(); break;
        case "Escape": if (!document.fullscreenElement) onClose(); break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // auto-hide chrome
  const bumpUI = () => {
    setShowUI(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (playing && !speedOpen && !ended) setShowUI(false);
    }, 3200);
  };
  useEffect(() => { bumpUI(); return () => { if (hideTimer.current) window.clearTimeout(hideTimer.current); }; }, [playing, speedOpen, ended]);

  const seekFromPointer = (e: React.PointerEvent) => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect || !duration) return;
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    seekTo(ratio * duration);
  };

  const pct = duration ? Math.min(100, (time / duration) * 100) : 0;
  const showSkipIntro = time > 3 && time < 28 && duration > 60;
  const title = titleOf(item);

  return (
    <div
      ref={shell}
      className="fixed inset-0 z-[80] bg-black select-none"
      onMouseMove={bumpUI}
      onClick={bumpUI}
      style={{ cursor: showUI ? "default" : "none" }}
    >
      {/* video surface */}
      <div className="absolute inset-0 flex items-center justify-center bg-black">
        {status === "none" ? (
          <div className="relative w-full h-full">
            <img src={img(item.backdrop_path || item.poster_path, "original")} alt={title} className="w-full h-full object-cover opacity-40" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center px-6">
              <h2 className="text-white text-3xl md:text-5xl font-black">{title}</h2>
              <p className="text-gray-300">Streaming is not available for this title right now.</p>
              <button onClick={onClose} className="mt-2 bg-white text-black px-6 py-2 rounded font-bold">Back to browse</button>
            </div>
          </div>
        ) : (
          <div className={`w-full ${status === "loading" ? "opacity-0" : "opacity-100"} transition-opacity`}>
            <div ref={holder} className="mx-auto aspect-video w-full max-h-screen" />
          </div>
        )}
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="nf-spinner" />
          </div>
        )}
      </div>

      {/* flash message */}
      {toastMsg && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-black/70 px-5 py-2 rounded text-white text-sm">
          {toastMsg}
        </div>
      )}

      {/* top bar */}
      <div className={`absolute top-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-b from-black/80 to-transparent transition-opacity ${showUI ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-start gap-4">
          <button onClick={onClose} className="text-white hover:scale-110 transition" aria-label="Back">
            <svg className="h-8 w-8 md:h-10 md:w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M19 12H5m7-7-7 7 7 7" />
            </svg>
          </button>
          <div className="min-w-0">
            <h2 className="text-white text-lg md:text-2xl font-bold truncate">{title}</h2>
            {episodeLabel && <p className="text-gray-300 text-sm">{episodeLabel}</p>}
          </div>
        </div>
      </div>

      {/* skip intro */}
      {showSkipIntro && showUI && (
        <button
          onClick={() => { seekTo(35); flash("Intro skipped"); }}
          className="absolute bottom-32 right-6 md:right-12 bg-white/95 text-black px-6 py-3 rounded font-bold hover:bg-white transition"
        >
          Skip Intro
        </button>
      )}

      {/* next episode card */}
      {ended && onNext && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center px-6">
          <div className="bg-[#181818] rounded-lg p-6 md:p-8 max-w-md w-full text-white space-y-4 shadow-2xl">
            <p className="text-sm text-gray-400 uppercase tracking-widest">Next</p>
            <h3 className="text-2xl font-bold">{nextLabel || "Next episode"}</h3>
            <div className="h-1 bg-white/20 rounded overflow-hidden">
              {active?.autoplayNext && <div className="h-full bg-netflix-red transition-all duration-1000" style={{ width: `${((8 - countdown) / 8) * 100}%` }} />}
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={onNext} className="bg-white text-black px-6 py-2.5 rounded font-bold hover:bg-white/80 transition">
                Play {active?.autoplayNext ? `(${countdown})` : ""}
              </button>
              <button onClick={onClose} className="bg-white/20 px-6 py-2.5 rounded font-bold hover:bg-white/30 transition">
                Back to browse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* bottom controls */}
      <div className={`absolute bottom-0 left-0 right-0 px-4 md:px-8 pb-4 md:pb-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity ${showUI ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        {/* progress */}
        <div
          ref={barRef}
          onPointerDown={(e) => { setDragging(true); seekFromPointer(e); }}
          onPointerMove={(e) => dragging && seekFromPointer(e)}
          onPointerUp={() => setDragging(false)}
          onPointerLeave={() => setDragging(false)}
          className="group/bar relative h-6 flex items-center cursor-pointer"
        >
          <div className="relative h-1 w-full bg-white/30 group-hover/bar:h-1.5 transition-all">
            <div className="absolute inset-y-0 left-0 bg-gray-400/60" style={{ width: `${Math.min(100, pct + 25)}%` }} />
            <div className="absolute inset-y-0 left-0 bg-netflix-red" style={{ width: `${pct}%` }} />
            <div
              className="absolute h-3.5 w-3.5 rounded-full bg-netflix-red -top-1.5 opacity-0 group-hover/bar:opacity-100 transition"
              style={{ left: `calc(${pct}% - 7px)` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mt-1">
          <div className="flex items-center gap-3 md:gap-5 text-white">
            <button onClick={toggle} aria-label="Play/pause" className="hover:scale-110 transition">
              {playing ? (
                <svg className="h-8 w-8 md:h-9 md:w-9" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
              ) : (
                <svg className="h-8 w-8 md:h-9 md:w-9" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
            <button onClick={() => nudge(-10)} aria-label="Back 10s" className="hover:scale-110 transition">
              <svg className="h-7 w-7 md:h-8 md:w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 8v4l3 2" />
              </svg>
            </button>
            <button onClick={() => nudge(10)} aria-label="Forward 10s" className="hover:scale-110 transition">
              <svg className="h-7 w-7 md:h-8 md:w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 12a9 9 0 1 1-3-6.7" /><path d="M21 4v5h-5" /><path d="M12 8v4l-3 2" />
              </svg>
            </button>

            <div className="group/vol flex items-center gap-2">
              <button onClick={toggleMute} aria-label="Mute" className="hover:scale-110 transition">
                {muted || volume === 0 ? (
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M11 5 6 9H2v6h4l5 4V5z" /><line x1="22" y1="9" x2="16" y2="15" /><line x1="16" y1="9" x2="22" y2="15" />
                  </svg>
                ) : (
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a10 10 0 0 1 0 14" />
                  </svg>
                )}
              </button>
              <input
                type="range" min={0} max={100} value={muted ? 0 : volume}
                onChange={(e) => setVol(Number(e.target.value))}
                style={{ ["--v" as string]: `${muted ? 0 : volume}%` } as React.CSSProperties}
                className="nf-range w-0 group-hover/vol:w-24 transition-all duration-300"
                aria-label="Volume"
              />
            </div>

            <span className="text-xs md:text-sm tabular-nums text-gray-200">
              {fmt(time)} <span className="text-gray-500">/ {fmt(duration)}</span>
            </span>
          </div>

          <div className="flex items-center gap-3 md:gap-5 text-white">
            <div className="relative">
              <button onClick={() => setSpeedOpen((s) => !s)} className="text-xs md:text-sm font-semibold hover:scale-105 transition px-2 py-1 border border-white/30 rounded">
                {speed}x
              </button>
              {speedOpen && (
                <div className="absolute bottom-10 right-0 bg-[#181818] border border-white/10 rounded shadow-2xl py-2 w-24">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
                    <button key={r} onClick={() => setRate(r)}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-white/10 ${r === speed ? "text-netflix-red font-bold" : "text-gray-200"}`}>
                      {r}x
                    </button>
                  ))}
                </div>
              )}
            </div>
            {onNext && (
              <button onClick={onNext} aria-label="Next episode" className="hover:scale-110 transition">
                <svg className="h-7 w-7 md:h-8 md:w-8" viewBox="0 0 24 24" fill="currentColor"><path d="M5 5v14l10-7zM17 5h3v14h-3z" /></svg>
              </button>
            )}
            <button onClick={toggleFullscreen} aria-label="Fullscreen" className="hover:scale-110 transition">
              <svg className="h-7 w-7 md:h-8 md:w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
              </svg>
            </button>
          </div>
        </div>
        <p className="mt-2 text-[10px] md:text-xs text-gray-500 hidden md:block">
          Space play/pause · ← → seek 10s · ↑ ↓ volume · M mute · F fullscreen · Esc exit
        </p>
      </div>
    </div>
  );
}
