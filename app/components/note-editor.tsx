"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Workspace from "./workspace";
export default function NoteEditor({
  id,
  create = false,
  edit = false,
}: {
  id?: string;
  create?: boolean;
  edit?: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(!create);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    if (create) return;
    async function loadNote() {
      try {
        const r = await fetch(`/api/notes/${id}`);
        const data = await r.json();
        if (!r.ok) setError(data.error);
        else {
          setTitle(data.note.title);
          setContent(data.note.content);
        }
      } catch {
        setError("Unable to open note.");
      } finally {
        setBusy(false);
      }
    }
    void loadNote();
  }, [id, create]);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch(create ? "/api/notes" : `/api/notes/${id}`, {
        method: create ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = await r.json();
      if (!r.ok) setError(data.error);
      else router.push(`/notes/${create ? data.note.id : id}`);
    } catch {
      setError("Unable to save. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    try {
      const r = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
      });
      const data = await r.json();
      if (!r.ok) setError(data.error);
      else router.push("/notes");
    } catch {
      setError("Unable to delete. Please try again.");
    } finally {
      setBusy(false);
      setDeleting(false);
    }
  }
  return (
    <Workspace>
      <Link
        className="mb-8 inline-block text-[13px] text-[#62685e] dark:text-[#b2bcac] [-webkit-tap-highlight-color:transparent] hover:underline hover:underline-offset-4"
        href="/notes"
      >
        ← All notes
      </Link>
      {error ? (
        <p
          role="alert"
          className="rounded-[7px] bg-[#f3ebdd] px-[18px] py-3.5 text-[14px] text-[#853c2c] [overflow-wrap:anywhere] dark:bg-[#403a2e] dark:text-[#ffbcab]"
        >
          {error}
        </p>
      ) : busy && !create && !title ? (
        <output>Opening your page…</output>
      ) : create || edit ? (
        <form
          method="post"
          className="max-w-[760px] [&_h1]:mb-[34px] [&_h1]:text-[40px] max-[700px]:[&_h1]:text-[34px] [&_label]:mb-6 [&_input]:font-[Georgia,serif] [&_input]:text-[24px] [&_textarea]:leading-[1.8]"
          onSubmit={save}
        >
          <h1 className="font-[Georgia,Times_New_Roman,serif] font-normal tracking-[-0.025em] leading-[1.15] text-balance">
            {create ? "A fresh page." : "Keep the thought going."}
          </h1>
          <label className="block text-[13px] font-semibold">
            Title
            <input
              className="w-full rounded-lg border border-[#dddfd6] dark:border-[#404b3f] bg-white px-3.5 py-3 text-inherit caret-[#334e3d] placeholder:text-[#62685e] dark:bg-[#242a24] dark:caret-[#b7d0ac] dark:placeholder:text-[#b2bcac] mt-[7px] [-webkit-tap-highlight-color:transparent]"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give this thought a title"
              required
              maxLength={200}
            />
          </label>
          <label className="block text-[13px] font-semibold">
            Your note
            <textarea
              className="w-full rounded-lg border border-[#dddfd6] dark:border-[#404b3f] bg-white px-3.5 py-3 text-inherit caret-[#334e3d] placeholder:text-[#62685e] dark:bg-[#242a24] dark:caret-[#b7d0ac] dark:placeholder:text-[#b2bcac] mt-[7px] resize-y [-webkit-tap-highlight-color:transparent]"
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start anywhere…"
              maxLength={50000}
              rows={14}
            />
          </label>
          <div className="flex items-center gap-6 [&_a]:text-[13px]">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center gap-5 rounded-[7px] border-0 bg-[#334e3d] px-5 py-[11px] text-[14px] font-semibold text-white hover:bg-[#243d2d] hover:no-underline dark:bg-[#b7d0ac] dark:text-[#182719] dark:hover:bg-[#c7ddb9] cursor-pointer disabled:cursor-wait disabled:opacity-60 [-webkit-tap-highlight-color:transparent]"
              disabled={busy}
            >
              {busy ? "Saving…" : "Save note"}
            </button>
            <Link
              className="[-webkit-tap-highlight-color:transparent] hover:underline hover:underline-offset-4"
              href={create ? "/notes" : `/notes/${id}`}
            >
              Cancel
            </Link>
          </div>
        </form>
      ) : (
        <article className="max-w-[780px] [&_h1]:mb-8 [&_h1]:text-[48px] [&_h1]:[overflow-wrap:anywhere] max-[700px]:[&_h1]:text-[38px]">
          <div className="mb-[42px] flex items-center justify-between gap-5 border-b border-[#dddfd6] dark:border-[#404b3f] pb-6 text-[12px] text-[#62685e] dark:text-[#b2bcac] max-[700px]:flex-col max-[700px]:items-start [&>div]:flex [&>div]:items-center [&>div]:gap-[22px]">
            <span>Your notebook / Note {id}</span>
            <div>
              <Link
                className="[-webkit-tap-highlight-color:transparent] hover:underline hover:underline-offset-4"
                href={`/notes/${id}/edit`}
              >
                Edit note
              </Link>
              <button
                type="button"
                className="border-0 bg-transparent px-0 py-1 text-[13px] hover:underline hover:underline-offset-4 text-[#853c2c] dark:text-[#ffbcab] cursor-pointer disabled:cursor-wait disabled:opacity-60 [-webkit-tap-highlight-color:transparent]"
                onClick={() => setDeleting(true)}
              >
                Delete note
              </button>
            </div>
          </div>
          <h1 className="font-[Georgia,Times_New_Roman,serif] font-normal tracking-[-0.025em] leading-[1.15] text-balance">
            {title}
          </h1>
          <div className="whitespace-pre-wrap text-[17px] leading-[1.9] [overflow-wrap:anywhere]">
            {content}
          </div>
          {deleting && (
            <div
              className="mt-10 rounded-[10px] bg-[#f3ebdd] p-6 dark:bg-[#403a2e] [&_p]:mb-[18px] [&_button+button]:ml-5"
              role="alert"
            >
              <p className="text-[#62685e] dark:text-[#b2bcac]">
                Delete this note? This cannot be undone.
              </p>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center gap-5 rounded-[7px] border-0 bg-[#334e3d] px-5 py-[11px] text-[14px] font-semibold text-white hover:bg-[#243d2d] hover:no-underline dark:bg-[#b7d0ac] dark:text-[#182719] dark:hover:bg-[#c7ddb9] cursor-pointer disabled:cursor-wait disabled:opacity-60 [-webkit-tap-highlight-color:transparent]"
                disabled={busy}
                onClick={remove}
              >
                Confirm deletion
              </button>
              <button
                type="button"
                className="border-0 bg-transparent px-0 py-1 text-[13px] text-[#62685e] dark:text-[#b2bcac] hover:underline hover:underline-offset-4 cursor-pointer disabled:cursor-wait disabled:opacity-60 [-webkit-tap-highlight-color:transparent]"
                onClick={() => setDeleting(false)}
              >
                Keep note
              </button>
            </div>
          )}
        </article>
      )}
    </Workspace>
  );
}
