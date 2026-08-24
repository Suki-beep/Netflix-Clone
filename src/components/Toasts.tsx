import { useStore } from "../store/profiles";

export default function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="nf-toast flex items-center gap-3 bg-[#181818]/95 border border-white/10 backdrop-blur px-5 py-3 rounded shadow-2xl text-sm text-white"
        >
          {t.icon && <span className="text-lg">{t.icon}</span>}
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
