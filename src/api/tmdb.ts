// TMDB API client — IMDb has no public API, TMDB is the standard source for
// IMDb-equivalent metadata (ratings, posters, cast, YouTube trailers).

const API_KEY = "3d1cb94d909aab088231f5af899dffdc";
const BASE_URL = "https://api.themoviedb.org/3";

export const IMG_BASE = "https://image.tmdb.org/t/p";
export const img = (
  path: string | null,
  size: "w200" | "w300" | "w500" | "w780" | "original" = "w500"
) => (path ? `${IMG_BASE}/${size}${path}` : "");

export interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  media_type?: string;
  original_language?: string;
  popularity?: number;
}

export interface VideoResult {
  id: string;
  key: string;
  site: string;
  type: string;
  name: string;
  official?: boolean;
  size?: number;
}

export interface CastMember {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
}

export interface Episode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  runtime?: number;
  air_date?: string;
  vote_average?: number;
}

export interface Details extends Movie {
  tagline?: string;
  runtime?: number;
  status?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  genres?: { id: number; name: string }[];
  created_by?: { name: string }[];
  production_companies?: { name: string }[];
  spoken_languages?: { english_name: string }[];
  original_title?: string;
  episode_run_time?: number[];
}

export interface Feed {
  path: string;
  params?: Record<string, string>;
}

// ---------- core fetch ----------
async function fetcher<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path.startsWith("/") ? path : "/" + path}`);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("language", "en-US");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

export const fetchFeed = (feed: Feed, page = 1): Promise<Movie[]> =>
  fetcher<{ results: Movie[] }>(feed.path, { ...(feed.params || {}), page: String(page) }).then(
    (r) => r.results.filter((m) => m.poster_path || m.backdrop_path)
  );

// ---------- rows / feeds ----------
export const feeds = {
  trending: { path: "/trending/all/week" },
  trendingToday: { path: "/trending/movie/day" },
  netflixOriginals: { path: "/discover/tv", params: { with_networks: "213" } },
  topRated: { path: "/movie/top_rated" },
  topRatedTv: { path: "/tv/top_rated" },
  action: { path: "/discover/movie", params: { with_genres: "28" } },
  adventure: { path: "/discover/movie", params: { with_genres: "12" } },
  comedy: { path: "/discover/movie", params: { with_genres: "35" } },
  horror: { path: "/discover/movie", params: { with_genres: "27" } },
  romance: { path: "/discover/movie", params: { with_genres: "10749" } },
  scifi: { path: "/discover/movie", params: { with_genres: "878" } },
  animation: { path: "/discover/movie", params: { with_genres: "16" } },
  documentaries: { path: "/discover/movie", params: { with_genres: "99" } },
  thrillers: { path: "/discover/movie", params: { with_genres: "53" } },
  family: { path: "/discover/movie", params: { with_genres: "10751" } },
  crime: { path: "/discover/tv", params: { with_genres: "80" } },
  war: { path: "/discover/movie", params: { with_genres: "10752" } },
  nowPlaying: { path: "/movie/now_playing" },
  upcoming: { path: "/movie/upcoming" },
  airingToday: { path: "/tv/airing_today" },
  onAir: { path: "/tv/on_the_air" },
  popularTv: { path: "/tv/popular" },
  bollywood: { path: "/discover/movie", params: { with_original_language: "hi" } },
  anime: { path: "/discover/tv", params: { with_genres: "16", with_original_language: "ja" } },
} satisfies Record<string, Feed>;

export type FeedKey = keyof typeof feeds;

// ---------- single title ----------
export const fetchVideos = (id: number, type: "movie" | "tv") =>
  fetcher<{ results: VideoResult[] }>(`/${type}/${id}/videos`).then((r) => r.results);

export const fetchDetails = (id: number, type: "movie" | "tv") =>
  fetcher<Details>(`/${type}/${id}`);

export const fetchCredits = (id: number, type: "movie" | "tv") =>
  fetcher<{ cast: CastMember[]; crew: CastMember[] }>(`/${type}/${id}/credits`);

export const fetchSimilar = (id: number, type: "movie" | "tv") =>
  fetchFeed({ path: `/${type}/${id}/recommendations` });

export const fetchSeason = (id: number, season: number) =>
  fetcher<{ episodes: Episode[]; name: string }>(`/tv/${id}/season/${season}`);

export const fetchGenres = (type: "movie" | "tv") =>
  fetcher<{ genres: { id: number; name: string }[] }>(`/genre/${type}/list`).then((r) => r.genres);

export const searchMulti = (query: string, page = 1) =>
  fetchFeed({ path: "/search/multi", params: { query, include_adult: "false" } }, page);

export const GENRE_MAP: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western", 10759: "Action & Adventure",
  10762: "Kids", 10763: "News", 10764: "Reality", 10765: "Sci-Fi & Fantasy",
  10766: "Soap", 10767: "Talk", 10768: "War & Politics",
};

export const genreNames = (m: Movie) =>
  (m.genre_ids || []).map((g) => GENRE_MAP[g]).filter(Boolean).slice(0, 3);

// ---------- helpers ----------
export const pickTrailer = (videos: VideoResult[]): VideoResult | undefined => {
  const yt = videos.filter((v) => v.site === "YouTube");
  const score = (v: VideoResult) =>
    (v.type === "Trailer" ? 100 : v.type === "Teaser" ? 60 : v.type === "Clip" ? 40 : 10) +
    (v.official ? 5 : 0) +
    (v.size && v.size >= 1080 ? 2 : 0);
  return [...yt].sort((a, b) => score(b) - score(a))[0];
};

export const mediaType = (m: Movie): "movie" | "tv" => {
  if (m.media_type === "tv" || m.media_type === "movie") return m.media_type;
  if (m.first_air_date && !m.release_date) return "tv";
  if (m.name && !m.title) return "tv";
  return "movie";
};

export const titleOf = (m: Movie) => m.title || m.name || "Untitled";
export const yearOf = (m: Movie) =>
  (m.release_date || m.first_air_date || "").slice(0, 4);
export const matchPct = (m: Movie) => Math.min(99, Math.max(35, Math.round((m.vote_average || 0) * 10)));
export const maturityFor = (m: Movie) => {
  const v = m.vote_average || 0;
  if (v >= 8.4) return "TV-MA";
  if (v >= 7.2) return "PG-13";
  return "PG";
};
export const runtimeText = (mins?: number) =>
  mins ? `${Math.floor(mins / 60)}h ${mins % 60}m` : "";

// Load the YouTube IFrame Player API once.
let ytLoader: Promise<any> | null = null;
export function loadYouTubeAPI(): Promise<any> {
  const w = window as any;
  if (w.YT && w.YT.Player) return Promise.resolve(w.YT);
  if (!ytLoader) {
    ytLoader = new Promise((resolve) => {
      w.onYouTubeIframeAPIReady = () => resolve(w.YT);
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    });
  }
  return ytLoader;
}
