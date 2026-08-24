import { useEffect, useState } from "react";
import { fetchFeed, fetchSimilar, feeds, titleOf, type Feed, type Movie } from "../api/tmdb";
import Hero from "../components/Hero";
import Row from "../components/Row";
import { useStore } from "../store/profiles";

interface Props {
  onPlay: (m: Movie, label?: string) => void;
  onInfo: (m: Movie) => void;
}

interface RowDef {
  title: string;
  feed: Feed;
  variant?: "poster" | "wide" | "top10";
}

export default function Browse({ onPlay, onInfo }: Props) {
  const { active, data } = useStore();
  const kids = !!active?.kids;
  const [hero, setHero] = useState<Movie | null>(null);
  const [because, setBecause] = useState<Movie[]>([]);
  const source = data.list.find((m) => data.loved.includes(m.id)) || data.list[0] || null;

  useEffect(() => {
    let alive = true;
    setHero(null);
    fetchFeed(kids ? feeds.family : feeds.trendingToday)
      .then((r) => {
        if (!alive || r.length === 0) return;
        const pool = r.filter((m) => m.backdrop_path);
        setHero(pool[Math.floor(Math.random() * Math.min(pool.length, 8))] || r[0]);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [kids]);

  useEffect(() => {
    if (!source) { setBecause([]); return; }
    let alive = true;
    fetchSimilar(source.id, "movie")
      .then((r) => alive && setBecause(r))
      .catch(() => alive && setBecause([]));
    return () => { alive = false; };
  }, [source?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const continueItems = data.progress.map((p) => p.item);

  const rows: RowDef[] = kids
    ? [
        { title: "Family Favourites", feed: feeds.family },
        { title: "Animation for Kids", feed: feeds.animation },
        { title: "Adventures for Everyone", feed: feeds.adventure },
        { title: "Anime", feed: feeds.anime },
        { title: "Kids Comedy", feed: feeds.comedy },
      ]
    : [
        { title: "Trending Now", feed: feeds.trending },
        { title: "Only on Netflix", feed: feeds.netflixOriginals, variant: "wide" },
        { title: "New Releases", feed: feeds.nowPlaying },
        { title: "Blockbuster Movies", feed: feeds.action },
        { title: "Top Rated", feed: feeds.topRated },
        { title: "Bingeworthy TV", feed: feeds.topRatedTv },
        { title: "Comedies", feed: feeds.comedy },
        { title: "Edge-of-Your-Seat Thrillers", feed: feeds.thrillers },
        { title: "Sci-Fi & Fantasy", feed: feeds.scifi },
        { title: "Horror", feed: feeds.horror },
        { title: "Romance", feed: feeds.romance },
        { title: "Animation", feed: feeds.animation },
        { title: "Crime TV Dramas", feed: feeds.crime },
        { title: "Award-Winning War Stories", feed: feeds.war },
        { title: "Popular Series", feed: feeds.popularTv },
        { title: "TV on Air Now", feed: feeds.onAir },
        { title: "Documentaries", feed: feeds.documentaries },
        { title: "Anime", feed: feeds.anime },
        { title: "Bollywood", feed: feeds.bollywood },
        { title: "Coming Soon", feed: feeds.upcoming },
      ];

  return (
    <>
      {hero ? (
        <Hero movie={hero} onPlay={onPlay} onInfo={onInfo} />
      ) : (
        <div className="h-[88vh] min-h-[520px] w-full bg-[#141414] animate-pulse" />
      )}

      <div className="relative z-20 -mt-20 md:-mt-28 pb-6">
        {continueItems.length > 0 && (
          <Row
            title={`Continue Watching for ${active?.name || "you"}`}
            items={continueItems}
            variant="wide"
            onPlay={onPlay}
            onInfo={onInfo}
          />
        )}

        <Row
          title="Top 10 in your country today"
          feed={kids ? feeds.family : feeds.trendingToday}
          variant="top10"
          subtitle="TOP 10"
          onPlay={onPlay}
          onInfo={onInfo}
        />

        {data.list.length > 0 && (
          <Row title="My List" items={data.list} onPlay={onPlay} onInfo={onInfo} />
        )}

        {because.length > 0 && source && (
          <Row
            title={`Because you liked ${titleOf(source)}`}
            items={because}
            onPlay={onPlay}
            onInfo={onInfo}
          />
        )}

        {rows.map((r) => (
          <Row
            key={r.title}
            title={r.title}
            feed={r.feed}
            variant={r.variant || "poster"}
            onPlay={onPlay}
            onInfo={onInfo}
          />
        ))}
      </div>
    </>
  );
}
