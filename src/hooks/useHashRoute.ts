import { useEffect, useState } from "react";

export type Route =
  | "home"
  | "tv"
  | "movies"
  | "new"
  | "mylist"
  | "languages"
  | "latest"
  | "search";

const MAP: Record<string, Route> = {
  "": "home",
  "#/": "home",
  "#/home": "home",
  "#/tv": "tv",
  "#/movies": "movies",
  "#/new": "new",
  "#/mylist": "mylist",
  "#/languages": "languages",
  "#/latest": "latest",
  "#/search": "search",
};

export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => MAP[window.location.hash] || "home");

  useEffect(() => {
    const onHash = () => {
      setRoute(MAP[window.location.hash] || "home");
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (r: Route) => {
    window.location.hash = r === "home" ? "#/" : `#/${r}`;
  };

  return { route, go };
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );
  useEffect(() => {
    const m = window.matchMedia(query);
    const cb = () => setMatches(m.matches);
    cb();
    m.addEventListener("change", cb);
    return () => m.removeEventListener("change", cb);
  }, [query]);
  return matches;
}
