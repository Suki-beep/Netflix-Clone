export default function Footer() {
  const cols = [
    ["Audio Description", "Investor Relations", "Legal Notices"],
    ["Help Center", "Jobs", "Cookie Preferences"],
    ["Gift Cards", "Terms of Use", "Corporate Information"],
    ["Media Center", "Privacy", "Contact Us"],
  ];
  return (
    <footer className="px-4 md:px-12 py-12 text-[#808080] text-[13px] border-t border-white/5">
      <div className="max-w-5xl mx-auto space-y-7">
        <div className="flex gap-5">
          {["facebook", "instagram", "twitter", "youtube"].map((s) => (
            <a key={s} href="#" aria-label={s} className="hover:text-white transition">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2c1.7 0 3.2.6 4.4 1.6l-1 1a5.6 5.6 0 0 0-3.4-1.1V4zm-6.4 3.6 3 2.2-.8 1.2-3-2.2.8-1.2zM12 20a8 8 0 0 1-7.7-5.9l3.9-1 .4 1.5-3.3.9A6.4 6.4 0 0 0 12 18.6V20zm1.6-.2v-1.4c2.2-.4 3.9-2.3 3.9-4.6 0-.6-.1-1.2-.3-1.7l1.3-.7c.3.7.5 1.5.5 2.4 0 3.3-2.4 6-5.4 6z" />
              </svg>
            </a>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3">
          {cols.flat().map((l) => (
            <a key={l} href="#" className="hover:underline">{l}</a>
          ))}
        </div>
        <button className="border border-[#808080] px-2.5 py-1.5 hover:text-white transition">Service Code</button>
        <p className="text-[11px] leading-relaxed">
          Educational clone — not affiliated with Netflix, Inc. Metadata &amp; trailers by{" "}
          <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" className="underline">TMDB</a> / YouTube.
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </div>
    </footer>
  );
}
