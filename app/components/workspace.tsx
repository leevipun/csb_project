"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

export default function Workspace({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      router.replace("/login");
    },
  });
  const user = session?.user;
  const [error, setError] = useState("");
  const path = usePathname();
  async function logout() {
    try {
      await signOut({ redirect: false });
      router.replace("/login");
    } catch {
      setError("Could not sign out. Please try again.");
    }
  }
  return (
    <div className="grid min-h-screen grid-cols-[248px_1fr] max-[1100px]:grid-cols-[210px_1fr] max-[700px]:block">
      <aside className="sticky top-0 flex h-screen flex-col border-r border-[#dddfd6] dark:border-[#404b3f] bg-white px-[26px] pt-10 pb-7 dark:bg-[#242a24] max-[1100px]:px-5 max-[1100px]:py-8 max-[700px]:relative max-[700px]:grid max-[700px]:h-auto max-[700px]:grid-cols-[1fr_auto] max-[700px]:gap-[18px] max-[700px]:border-r-0 max-[700px]:border-b max-[700px]:px-6 max-[700px]:py-5">
        <Link
          className="font-[Georgia,serif] inline-flex items-baseline gap-1 text-[27px] leading-[1.3] tracking-[-0.025em] hover:no-underline [-webkit-tap-highlight-color:transparent]"
          href="/dashboard"
        >
          NoteVault
          <span className="size-1.5 rounded-full bg-[#334e3d] dark:bg-[#b7d0ac]" />
        </Link>
        <p className="mt-2 text-[12px] text-[#62685e] dark:text-[#b2bcac] max-[700px]:hidden">
          Your personal notebook.
        </p>
        <Link
          className="inline-flex min-h-11 items-center rounded-[7px] border-0 bg-[#334e3d] px-5 py-[11px] text-[14px] font-semibold text-white hover:bg-[#243d2d] hover:no-underline dark:bg-[#b7d0ac] dark:text-[#182719] dark:hover:bg-[#c7ddb9] mt-9 mb-[26px] justify-start gap-3 max-[700px]:m-0 max-[700px]:min-h-[38px] max-[700px]:gap-1.5 max-[700px]:px-3 max-[700px]:py-2 max-[700px]:text-[12px] [-webkit-tap-highlight-color:transparent]"
          href="/notes/new"
        >
          <span aria-hidden="true">+</span> Write a note
        </Link>
        <nav
          className="grid gap-1.5 max-[700px]:col-span-full max-[700px]:flex"
          aria-label="Main navigation"
        >
          <Link
            className={
              path === "/dashboard"
                ? "rounded-md px-3.5 py-2.5 text-[14px] hover:bg-[#f9f8f5] hover:no-underline dark:hover:bg-[#1e231e] max-[700px]:px-[13px] max-[700px]:py-2 bg-[#e9eee4] font-semibold text-[#334e3d] dark:bg-[#303e30] dark:text-[#b7d0ac]"
                : "rounded-md px-3.5 py-2.5 text-[14px] hover:bg-[#f9f8f5] hover:no-underline dark:hover:bg-[#1e231e] max-[700px]:px-[13px] max-[700px]:py-2 text-[#62685e] dark:text-[#b2bcac]"
            }
            href="/dashboard"
          >
            Overview
          </Link>
          <Link
            className={
              path.startsWith("/notes")
                ? "rounded-md px-3.5 py-2.5 text-[14px] hover:bg-[#f9f8f5] hover:no-underline dark:hover:bg-[#1e231e] max-[700px]:px-[13px] max-[700px]:py-2 bg-[#e9eee4] font-semibold text-[#334e3d] dark:bg-[#303e30] dark:text-[#b7d0ac]"
                : "rounded-md px-3.5 py-2.5 text-[14px] hover:bg-[#f9f8f5] hover:no-underline dark:hover:bg-[#1e231e] max-[700px]:px-[13px] max-[700px]:py-2 text-[#62685e] dark:text-[#b2bcac]"
            }
            href="/notes"
          >
            All notes
          </Link>
          <Link
            className={
              path === "/search"
                ? "rounded-md px-3.5 py-2.5 text-[14px] hover:bg-[#f9f8f5] hover:no-underline dark:hover:bg-[#1e231e] max-[700px]:px-[13px] max-[700px]:py-2 bg-[#e9eee4] font-semibold text-[#334e3d] dark:bg-[#303e30] dark:text-[#b7d0ac]"
                : "rounded-md px-3.5 py-2.5 text-[14px] hover:bg-[#f9f8f5] hover:no-underline dark:hover:bg-[#1e231e] max-[700px]:px-[13px] max-[700px]:py-2 text-[#62685e] dark:text-[#b2bcac]"
            }
            href="/search"
          >
            Search
          </Link>
        </nav>
        <div className="mt-auto pt-10 max-[700px]:col-span-full max-[700px]:m-0 max-[700px]:flex max-[700px]:justify-end max-[700px]:p-0">
          <div className="mb-[18px] flex items-center gap-3 max-[700px]:hidden [&_strong]:block [&_strong]:text-[13px] [&_div>span]:block [&_div>span]:text-[11px] [&_div>span]:text-[#62685e] [&_div>span]:[overflow-wrap:anywhere] dark:[&_div>span]:text-[#b2bcac]">
            <span className="font-[Georgia,serif] grid size-9 place-items-center rounded-full bg-[#e9eee4] dark:bg-[#303e30]">
              {user?.name?.slice(0, 1) ?? "…"}
            </span>
            <div>
              <strong>{user?.name ?? "Loading…"}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
          <button
            type="button"
            className="border-0 bg-transparent px-0 py-1 text-[13px] text-[#62685e] dark:text-[#b2bcac] hover:underline hover:underline-offset-4 cursor-pointer disabled:cursor-wait disabled:opacity-60 [-webkit-tap-highlight-color:transparent]"
            onClick={logout}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="m-auto w-full min-w-0 max-w-[1450px] px-[clamp(24px,4.5vw,80px)] py-[54px] min-[1600px]:my-0 max-[700px]:px-6 max-[700px]:py-8">
        {error && (
          <p
            role="alert"
            className="rounded-[7px] bg-[#f3ebdd] px-[18px] py-3.5 text-[14px] text-[#853c2c] [overflow-wrap:anywhere] dark:bg-[#403a2e] dark:text-[#ffbcab]"
          >
            {error}
          </p>
        )}
        {children}
      </main>
    </div>
  );
}
