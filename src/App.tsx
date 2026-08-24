import { useCallback, useEffect, useRef, useState } from "react";
import { StoreProvider, useStore } from "./store/profiles";
import { useHashRoute } from "./hooks/useHashRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import MovieModal from "./components/MovieModal";
import Player from "./components/Player";
import Toasts from "./components/Toasts";
import { ManageProfiles, ProfileGate } from "./components/Profiles";
import Browse from "./pages/Browse";
import { Catalog, MyListPage, SearchPage } from "./pages/Pages";
import { fetchSimilar, mediaType, titleOf, type Movie } from "./api/tmdb";

function Intro() {
  return (
    <div className="fixed inset-0 z-[99] bg-black flex items-center justify-center nf-intro">
      <span className="text-netflix-red font-black tracking-tighter text-[22vw] leading-none nf-intro-n">
        N
      </span>
    </div>
  );
}

function Shell() {
  const { active, gateOpen, manageOpen, setGateOpen, progressOf } = useStore();
  const { route, go } = useHashRoute();
  const [query, setQuery] = useState("");
  const [info, setInfo] = useState<Movie | null>(null);
  const [player, setPlayer] = useState<{ item: Movie; label?: string; startAt: number } | null>(null);
  const [queue, setQueue] = useState<Movie[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [intro, setIntro] = useState(false);
  const introShown = useRef(false);

  // Netflix-style intro the first time a profile is picked this session
  useEffect(() => {
    if (!active || introShown.current) return;
    introShown.current = true;
    setIntro(true);
    const t = window.setTimeout(() => setIntro(false), 1500);
    return () => window.clearTimeout(t);
  }, [active]);

  const openPlayer = useCallback(
    (m: Movie, label?: string) => {
      const prog = progressOf(m.id);
      const resume = prog && prog.pct > 3 && prog.pct < 95 ? prog.seconds : 0;
      setInfo(null);
      setPlayer({ item: m, label, startAt: resume });
      setQIndex(0);
      fetchSimilar(m.id, mediaType(m))
        .then((r) => setQueue(r.filter((x) => x.id !== m.id).slice(0, 8)))
        .catch(() => setQueue([]));
    },
    [progressOf]
  );

  const playNext = useCallback(() => {
    const next = queue[qIndex];
    if (!next) return;
    setQIndex((i) => i + 1);
    setPlayer({ item: next, label: `Up next · ${titleOf(next)}`, startAt: 0 });
  }, [queue, qIndex]);

  const handleQuery = useCallback(
    (q: string) => {
      setQuery(q);
      if (q.trim() && route !== "search") go("search");
      if (!q.trim() && route === "search") go("home");
    },
    [route, go]
  );

  const nextUp = queue[qIndex];
  const showGate = !active || gateOpen;

  if (showGate) {
    return (
      <>
        <ProfileGate />
        <Toasts />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <Navbar route={route} go={go} query={query} setQuery={handleQuery} />

      <main>
        {route === "home" && <Browse onPlay={openPlayer} onInfo={setInfo} />}

        {route === "tv" && (
          <Catalog
            heading="TV Shows"
            basePath="/discover/tv"
            type="tv"
            onPlay={openPlayer}
            onInfo={setInfo}
          />
        )}

        {route === "movies" && (
          <Catalog
            heading="Movies"
            basePath="/discover/movie"
            type="movie"
            onPlay={openPlayer}
            onInfo={setInfo}
          />
        )}

        {route === "new" && (
          <Catalog
            heading="New & Popular"
            basePath="/discover/movie"
            type="movie"
            defaultParams={{ "primary_release_date.lte": new Date().toISOString().slice(0, 10), "vote_count.gte": "40" }}
            onPlay={openPlayer}
            onInfo={setInfo}
          />
        )}

        {route === "languages" && (
          <Catalog
            heading="Browse by Languages"
            basePath="/discover/movie"
            type="movie"
            showLanguage
            showYear={false}
            onPlay={openPlayer}
            onInfo={setInfo}
          />
        )}

        {route === "mylist" && <MyListPage onPlay={openPlayer} onInfo={setInfo} />}

        {route === "search" && <SearchPage query={query} onPlay={openPlayer} onInfo={setInfo} />}
      </main>

      <Footer />

      <MovieModal
        item={info}
        onClose={() => setInfo(null)}
        onPlay={openPlayer}
        onSelect={setInfo}
      />

      {player && (
        <Player
          item={player.item}
          startAt={player.startAt}
          episodeLabel={player.label}
          nextLabel={nextUp ? `Up next · ${titleOf(nextUp)}` : undefined}
          onNext={nextUp ? playNext : undefined}
          onClose={() => setPlayer(null)}
        />
      )}

      {manageOpen && <ManageProfiles />}
      {intro && <Intro />}
      <Toasts />

      {/* quick switcher floating button */}
      <button
        onClick={() => setGateOpen(true)}
        className="fixed bottom-5 right-5 z-30 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 text-white text-xs px-4 py-2.5 rounded-full transition"
      >
        ⇄ Switch profile
      </button>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
