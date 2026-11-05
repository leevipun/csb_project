"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Workspace from "./workspace";

type Note = { id: number; title: string; content: string; updatedAt: string };
export default function NoteList({
  dashboard = false,
  search = false,
}: {
  dashboard?: boolean;
  search?: boolean;
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const load = useCallback(
    async (q = "") => {
      setBusy(true);
      setError("");
      try {
        const r = await fetch(
          search ? `/api/search?q=${encodeURIComponent(q)}` : "/api/notes",
        );
        const data = await r.json();
        if (!r.ok) setError(data.error);
        else setNotes(data.notes);
      } catch {
        setError("Unable to load notes. Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [search],
  );
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <Workspace>
      <header className="mb-[38px] flex items-center justify-between gap-5 max-[700px]:mb-7 [&_h1]:mb-2.5 [&_h1]:text-[44px] max-[700px]:[&_h1]:text-[36px] [&_p]:text-[14px]">
        <div>
          <h1 className="font-[Georgia,Times_New_Roman,serif] font-normal tracking-[-0.025em] leading-[1.15] text-balance">
            {dashboard
              ? "Space to think."
              : search
                ? "Find a thought."
                : "Your notebook."}
          </h1>
          <p className="text-[#62685e] dark:text-[#b2bcac]">
            {dashboard
              ? "Good ideas deserve a place to stay."
              : search
                ? "A word, a phrase, a thread to pick up again."
                : "Everything you wanted to remember, all in one place."}
          </p>
        </div>
        <span className="whitespace-nowrap text-[12px] text-[#62685e] dark:text-[#b2bcac] max-[1100px]:hidden">
          {new Date().toLocaleDateString("fi-FI", {
            month: "long",
            year: "numeric",
          })}
        </span>
      </header>
      {dashboard && (
        <section className="mb-11 flex items-center justify-between gap-6 rounded-xl bg-[#e9eee4] p-8 dark:bg-[#303e30] max-[1100px]:flex-col max-[1100px]:items-start max-[700px]:mb-8 max-[700px]:p-6 [&_h2]:mb-[7px] [&_h2]:font-[Georgia,serif] [&_h2]:text-[27px] [&_p]:text-[13px]">
          <div>
            <h2 className="text-[19px] font-medium text-balance">
              What’s on your mind?
            </h2>
            <p className="text-[#62685e] dark:text-[#b2bcac]">
              You don’t need a big idea. Just a place to begin.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-5 rounded-[7px] border-0 bg-[#334e3d] px-5 py-[11px] text-[14px] font-semibold text-white hover:bg-[#243d2d] hover:no-underline dark:bg-[#b7d0ac] dark:text-[#182719] dark:hover:bg-[#c7ddb9] [-webkit-tap-highlight-color:transparent]"
            href="/notes/new"
          >
            Write something <span aria-hidden="true">→</span>
          </Link>
        </section>
      )}
      <div className="mb-[22px] flex items-center justify-between [&_h2]:text-[16px] [&>span]:text-[12px] [&>span]:text-[#62685e] dark:[&>span]:text-[#b2bcac]">
        <h2 className="text-[19px] font-medium text-balance">
          {dashboard
            ? "Recent notes"
            : search
              ? "Search your notes"
              : "All notes"}
        </h2>
        {!busy && (
          <span>
            {notes.length} {notes.length === 1 ? "note" : "notes"}
          </span>
        )}
      </div>
      {search && (
        <form
          className="mb-[30px] flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void load(query);
          }}
        >
          <label className="sr-only" htmlFor="search">
            Search notes
          </label>
          <input
            className="w-full rounded-lg border border-[#dddfd6] dark:border-[#404b3f] bg-white px-3.5 py-3 text-inherit caret-[#334e3d] placeholder:text-[#62685e] dark:bg-[#242a24] dark:caret-[#b7d0ac] dark:placeholder:text-[#b2bcac] [-webkit-tap-highlight-color:transparent]"
            id="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or content…"
            maxLength={200}
          />
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center gap-5 rounded-[7px] border-0 bg-[#334e3d] px-5 py-[11px] text-[14px] font-semibold text-white hover:bg-[#243d2d] hover:no-underline dark:bg-[#b7d0ac] dark:text-[#182719] dark:hover:bg-[#c7ddb9] cursor-pointer disabled:cursor-wait disabled:opacity-60 [-webkit-tap-highlight-color:transparent]"
            disabled={busy}
          >
            Search
          </button>
        </form>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-[7px] bg-[#f3ebdd] px-[18px] py-3.5 text-[14px] text-[#853c2c] [overflow-wrap:anywhere] dark:bg-[#403a2e] dark:text-[#ffbcab]"
        >
          {error}
        </p>
      )}
      {busy ? (
        <output>Opening your notebook…</output>
      ) : notes.length ? (
        <div className="grid grid-cols-3 gap-[18px] max-[1100px]:grid-cols-2 max-[700px]:grid-cols-1">
          {notes.map((note, i) => (
            <Link
              className={`flex min-h-[290px] flex-col rounded-xl p-[26px] transition-colors duration-[180ms] ease-out hover:bg-[#dddfd6] hover:no-underline dark:hover:bg-[#404b3f] max-[700px]:min-h-[240px] [&_h3]:mt-5 [&_h3]:mb-3.5 [&_h3]:font-[Georgia,serif] [&_h3]:text-[24px] [&_h3]:font-normal [&_h3]:leading-[1.3] [&_h3]:[overflow-wrap:anywhere] [&_p]:line-clamp-4 [&_p]:whitespace-pre-wrap [&_p]:text-[13px] [&_p]:[overflow-wrap:anywhere] ${["bg-[#f3ebdd] dark:bg-[#403a2e]", "bg-[#e7ecee] dark:bg-[#303d42]", "bg-[#e9eee4] dark:bg-[#303e30]"][i % 3]}`}
              key={note.id}
              href={`/notes/${note.id}`}
            >
              <span className="text-[11px] text-[#62685e] dark:text-[#b2bcac]">
                {new Date(note.updatedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
              <h3 className="text-balance">{note.title}</h3>
              <p className="text-[#62685e] dark:text-[#b2bcac]">
                {note.content}
              </p>
              <span className="mt-auto flex justify-between pt-6 text-[11px] text-[#62685e] dark:text-[#b2bcac]">
                Open note <span aria-hidden="true">↗</span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-[70px] [&_p]:mt-2 [&_p]:mb-6">
          <h2 className="text-[19px] font-medium text-balance">
            {search ? "No matching pages." : "Your first page is waiting."}
          </h2>
          <p className="text-[#62685e] dark:text-[#b2bcac]">
            {search
              ? "Try another word or phrase."
              : "Give a thought somewhere to land."}
          </p>
          {!search && (
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-5 rounded-[7px] border-0 bg-[#334e3d] px-5 py-[11px] text-[14px] font-semibold text-white hover:bg-[#243d2d] hover:no-underline dark:bg-[#b7d0ac] dark:text-[#182719] dark:hover:bg-[#c7ddb9] [-webkit-tap-highlight-color:transparent]"
              href="/notes/new"
            >
              Write a note
            </Link>
          )}
        </div>
      )}
      <footer className="mt-[72px] border-t border-[#dddfd6] dark:border-[#404b3f] pt-6 text-[12px] text-[#62685e] dark:text-[#b2bcac] max-[700px]:mt-11">
        A page for the everyday. A place for the unexpected.
      </footer>
    </Workspace>
  );
}
