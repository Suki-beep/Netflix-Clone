import { useState } from "react";
import { AVATARS, COLORS, useStore, type Profile } from "../store/profiles";
import { titleOf } from "../api/tmdb";

const LANGUAGES = ["English", "Español", "Français", "Deutsch", "हिन्दी", "日本語", "Português"];
const MATURITY = [
  "Little Kids, 6+",
  "Older Kids, 9+",
  "Teens, 13+",
  "16+",
  "18+, all maturity ratings",
  "Kids, all",
];

function Tile({
  profile,
  size = "lg",
  onClick,
  overlay,
}: {
  profile: Profile;
  size?: "lg" | "md";
  onClick?: () => void;
  overlay?: React.ReactNode;
}) {
  const dim = size === "lg" ? "h-28 w-28 md:h-36 md:w-36 text-6xl md:text-7xl" : "h-16 w-16 text-3xl";
  return (
    <button onClick={onClick} className="group flex flex-col items-center gap-3">
      <div className="relative">
        <div
          className={`${dim} rounded-md bg-gradient-to-br ${profile.color} flex items-center justify-center border-2 border-transparent group-hover:border-white transition`}
        >
          <span className="drop-shadow-lg">{profile.avatar}</span>
        </div>
        {overlay}
      </div>
      {size === "lg" && (
        <span className="text-gray-400 group-hover:text-white text-sm md:text-base transition">
          {profile.name}
        </span>
      )}
    </button>
  );
}

/* ---------------- Who's watching? ---------------- */
export function ProfileGate() {
  const { profiles, selectProfile, setManageOpen, setGateOpen, toast } = useStore();
  const [manage, setManage] = useState(false);

  const pick = (p: Profile) => {
    if (manage) return;
    if (p.kids) toast(`Welcome to Kids profile, ${p.name}!`, "🧒");
    setGateOpen(false);
    selectProfile(p.id);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-[#141414] flex flex-col items-center justify-center px-6">
      <h1 className="text-white text-3xl md:text-5xl font-medium mb-10 md:mb-16 text-center">
        {manage ? "Manage Profiles:" : "Who's watching?"}
      </h1>

      <div className="flex flex-wrap justify-center gap-6 md:gap-8">
        {profiles.slice(0, 5).map((p) => (
          <Tile
            key={p.id}
            profile={p}
            onClick={() => (manage ? setManageOpen(true) : pick(p))}
            overlay={
              manage ? (
                <div className="absolute inset-0 rounded-md bg-black/60 flex items-center justify-center">
                  <svg className="h-9 w-9 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </div>
              ) : undefined
            }
          />
        ))}
        {!manage && profiles.length < 5 && (
          <button
            onClick={() => setManageOpen(true)}
            className="group flex flex-col items-center gap-3"
          >
            <div className="h-28 w-28 md:h-36 md:w-36 rounded-md border-2 border-transparent bg-transparent flex items-center justify-center group-hover:border-white transition">
              <svg className="h-16 w-16 text-gray-500 group-hover:text-white transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </div>
            <span className="text-gray-400 group-hover:text-white text-sm md:text-base transition">
              Add Profile
            </span>
          </button>
        )}
      </div>

      <button
        onClick={() => (manage ? setManageOpen(true) : setManage(true))}
        className="mt-12 md:mt-16 px-6 py-2 text-sm md:text-base border border-gray-500 text-gray-400 hover:text-white hover:border-white transition uppercase tracking-widest"
      >
        {manage ? "Continue" : "Manage Profiles"}
      </button>
    </div>
  );
}

/* ---------------- Profile editor ---------------- */
function ProfileForm({ profile, onDone }: { profile?: Profile; onDone: () => void }) {
  const { addProfile, updateProfile, deleteProfile, profiles } = useStore();
  const isNew = !profile;
  const base: Omit<Profile, "id"> = isNew
    ? { name: "", avatar: AVATARS[0], color: COLORS[3], kids: false, language: "English", maturity: "18+, all maturity ratings", autoplayPreviews: true, autoplayNext: true }
    : { ...profile };

  const [form, setForm] = useState<Omit<Profile, "id">>(base);
  const set = <K extends keyof Omit<Profile, "id">>(k: K, v: (Omit<Profile, "id">)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    const name = form.name.trim() || "New Profile";
    if (!profile) addProfile({ ...form, name });
    else updateProfile(profile.id, { ...form, name });
    onDone();
  };

  return (
    <div className="fixed inset-0 z-[95] bg-black/80 flex items-start justify-center overflow-y-auto py-10 px-4">
      <div className="w-full max-w-2xl bg-[#141414] border border-white/10 rounded-lg p-6 md:p-10 text-white space-y-7">
        <h2 className="text-2xl md:text-3xl font-medium border-b border-white/20 pb-4">
          {isNew ? "Add Profile" : "Edit Profile"}
        </h2>

        <div className="flex items-center gap-6">
          <div className={`h-24 w-24 shrink-0 rounded-md bg-gradient-to-br ${form.color} flex items-center justify-center text-5xl`}>
            {form.avatar}
          </div>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Name"
            maxLength={16}
            className="w-full bg-[#333] px-4 py-3 rounded outline-none focus:bg-[#454545] transition text-white"
          />
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-2">Avatar</p>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => set("avatar", a)}
                className={`h-11 w-11 rounded-md bg-[#333] text-2xl flex items-center justify-center transition ${
                  form.avatar === a ? "ring-2 ring-white" : "hover:bg-[#454545]"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-2">Colour</p>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => set("color", c)}
                className={`h-10 w-16 rounded bg-gradient-to-br ${c} transition ${
                  form.color === c ? "ring-2 ring-white" : "opacity-70 hover:opacity-100"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <label className="block">
            <span className="text-sm text-gray-400">Language</span>
            <select
              value={form.language}
              onChange={(e) => set("language", e.target.value)}
              className="mt-1 w-full bg-[#333] px-3 py-2.5 rounded outline-none text-white"
            >
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-gray-400">Allowed maturity ratings</span>
            <select
              value={form.maturity}
              onChange={(e) => set("maturity", e.target.value)}
              className="mt-1 w-full bg-[#333] px-3 py-2.5 rounded outline-none text-white"
            >
              {MATURITY.map((m) => <option key={m}>{m}</option>)}
            </select>
          </label>
        </div>

        <div className="space-y-3 border-t border-white/10 pt-5">
          {([
            ["autoplayPreviews", "Autoplay previews while browsing"],
            ["autoplayNext", "Autoplay next episode"],
            ["kids", "Kids profile (family titles only)"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form[key] as boolean}
                onChange={(e) => set(key, e.target.checked as never)}
                className="h-5 w-5 accent-red-600"
              />
              <span className="text-sm text-gray-200">{label}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-white/20 pt-6">
            {!isNew && profiles.length > 1 ? (
            <button
              onClick={() => {
                if (profile) deleteProfile(profile.id);
                onDone();
              }}
              className="px-6 py-2.5 border border-white/30 text-gray-300 uppercase text-sm hover:text-white hover:border-white transition"
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-4">
            <button
              onClick={onDone}
              className="px-6 py-2.5 border border-white/30 text-gray-300 uppercase text-sm hover:text-white hover:border-white transition"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="px-8 py-2.5 bg-white text-black uppercase text-sm font-semibold hover:bg-white/80 transition"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Manage + Account ---------------- */
export function ManageProfiles() {
  const {
    profiles, active, data, setManageOpen, updateProfile, clearProgress, clearHistory, toast, deleteProfile,
  } = useStore();
  const [editing, setEditing] = useState<Profile | null>(null);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<"profiles" | "account">("profiles");

  const totalMinutes = Math.round(
    data.progress.reduce((acc, p) => acc + (p.seconds || 0), 0) / 60
  );

  return (
    <div className="fixed inset-0 z-[92] bg-[#141414] overflow-y-auto">
      <div className="mx-auto max-w-4xl px-5 md:px-8 py-10 pb-24">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl text-white font-medium">Account</h1>
          <button
            onClick={() => setManageOpen(false)}
            className="text-gray-400 hover:text-white transition text-sm uppercase tracking-widest border border-white/20 px-4 py-2"
          >
            Close
          </button>
        </div>

        <div className="flex gap-6 border-b border-white/15 mb-8">
          {(["profiles", "account"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm uppercase tracking-widest transition border-b-2 -mb-px ${
                tab === t ? "text-white border-netflix-red" : "text-gray-500 border-transparent hover:text-gray-300"
              }`}
            >
              {t === "profiles" ? "Profiles" : "Settings & Activity"}
            </button>
          ))}
        </div>

        {tab === "profiles" ? (
          <>
            <div className="flex flex-wrap gap-6 md:gap-8">
              {profiles.map((p) => (
                <Tile
                  key={p.id}
                  profile={p}
                  size="md"
                  onClick={() => setEditing(p)}
                  overlay={
                    <div className="absolute inset-0 rounded-md bg-black/60 flex items-center justify-center">
                      <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </div>
                  }
                />
              ))}
              {profiles.length < 5 && (
                <button
                  onClick={() => setCreating(true)}
                  className="h-16 w-16 rounded-md border-2 border-dashed border-white/25 flex items-center justify-center text-white/60 hover:text-white hover:border-white transition text-3xl"
                >
                  +
                </button>
              )}
            </div>

            <div className="mt-8 grid sm:grid-cols-3 gap-4 text-sm">
              {profiles.map((p) => (
                <div key={p.id} className="bg-[#1b1b1b] rounded p-4 space-y-1 border border-white/5">
                  <p className="font-semibold text-white flex items-center gap-2">
                    <span>{p.avatar}</span> {p.name}
                  </p>
                  <p className="text-gray-400">{p.language} · {p.maturity}</p>
                  {active?.id === p.id && <p className="text-netflix-red text-xs uppercase tracking-widest">Active</p>}
                  {active?.id === p.id && profiles.length > 1 && (
                    <button onClick={() => deleteProfile(p.id)} className="text-xs text-gray-500 hover:text-white underline">
                      delete this profile
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-8 text-sm">
            <section className="grid md:grid-cols-[160px_1fr] gap-2 md:gap-6 border-b border-white/10 pb-6">
              <span className="text-gray-500">Membership & Billing</span>
              <div className="space-y-2 text-gray-200">
                <p className="font-semibold text-white">Premium · 4K + HDR</p>
                <p className="text-gray-400">{active?.name || "Member"} · 4 screens · Downloads on 6 devices</p>
                <p className="text-gray-400">Next payment: {new Date(Date.now() + 12096e5).toLocaleDateString()}</p>
                <div className="flex gap-3 pt-1">
                  <button onClick={() => toast("Redirecting to plans…", "💳")} className="underline hover:text-white">Change plan</button>
                  <button onClick={() => toast("Payment details updated", "💳")} className="underline hover:text-white">Update payment</button>
                </div>
              </div>
            </section>

            {active && (
              <section className="grid md:grid-cols-[160px_1fr] gap-2 md:gap-6 border-b border-white/10 pb-6">
                <span className="text-gray-500">Playback Settings ({active.name})</span>
                <div className="space-y-3 text-gray-200">
                  {([
                    ["autoplayPreviews", "Autoplay previews while browsing"],
                    ["autoplayNext", "Autoplay next episode in a series"],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-red-600"
                        checked={active[key]}
                        onChange={(e) => updateProfile(active.id, { [key]: e.target.checked })}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                  <div className="flex flex-wrap gap-6 pt-2">
                    <p>Language: <span className="text-white">{active.language}</span></p>
                    <p>Maturity: <span className="text-white">{active.maturity}</span></p>
                  </div>
                </div>
              </section>
            )}

            <section className="grid md:grid-cols-[160px_1fr] gap-2 md:gap-6 border-b border-white/10 pb-6">
              <span className="text-gray-500">My Netflix</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-gray-200">
                {[
                  ["My List", data.list.length],
                  ["Liked", data.liked.length + data.loved.length],
                  ["Not for me", data.disliked.length],
                  ["Watching", data.progress.length],
                ].map(([l, v]) => (
                  <div key={l as string} className="bg-[#1b1b1b] rounded p-3 border border-white/5">
                    <p className="text-2xl font-bold text-white">{v as number}</p>
                    <p className="text-gray-400 text-xs uppercase tracking-widest">{l as string}</p>
                  </div>
                ))}
                <p className="col-span-full text-gray-400">≈ {totalMinutes} minutes watched</p>
              </div>
            </section>

            <section className="grid md:grid-cols-[160px_1fr] gap-2 md:gap-6 border-b border-white/10 pb-6">
              <span className="text-gray-500">Viewing Activity</span>
              <div className="space-y-2">
                {data.progress.length === 0 && <p className="text-gray-500">No activity yet.</p>}
                {data.progress.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-4 bg-[#1b1b1b] rounded px-3 py-2">
                    <span className="text-gray-200 truncate">
                      {titleOf(p.item)}{" "}
                      <span className="text-gray-500 text-xs">
                        · {Math.round(p.pct)}% · {new Date(p.at).toLocaleDateString()}
                      </span>
                    </span>
                    <button
                      onClick={() => { clearProgress(p.id); toast("Removed from viewing activity", "🗑️"); }}
                      className="text-xs text-gray-500 hover:text-white underline shrink-0"
                    >
                      remove
                    </button>
                  </div>
                ))}
                {data.progress.length > 0 && (
                  <button
                    onClick={() => {
                      data.progress.forEach((p) => clearProgress(p.id));
                      toast("Viewing activity cleared", "✅");
                    }}
                    className="text-xs text-gray-500 hover:text-white underline"
                  >
                    clear all activity
                  </button>
                )}
              </div>
            </section>

            <section className="grid md:grid-cols-[160px_1fr] gap-2 md:gap-6">
              <span className="text-gray-500">Search History</span>
              <div className="space-y-2">
                {data.history.length === 0 && <p className="text-gray-500">No searches yet.</p>}
                {data.history.map((h) => (
                  <span key={h.q} className="inline-block bg-[#1b1b1b] rounded px-3 py-1 mr-2 text-gray-300">{h.q}</span>
                ))}
                {data.history.length > 0 && (
                  <button onClick={() => { clearHistory(); toast("Search history cleared", "✅"); }}
                    className="block pt-2 text-xs text-gray-500 hover:text-white underline">clear history</button>
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      {(editing || creating) && (
        <ProfileForm
          profile={editing ?? undefined}
          onDone={() => { setEditing(null); setCreating(false); }}
        />
      )}
    </div>
  );
}
