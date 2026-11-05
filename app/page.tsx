import Link from "next/link";
export default function Home() {
  return (
    <main className="mx-auto max-w-[1240px] px-14 py-9 max-[700px]:p-6 [&_nav]:flex [&_nav]:items-center [&_nav]:justify-between [&_footer]:flex [&_footer]:justify-between [&_footer]:border-t [&_footer]:border-[#dddfd6] [&_footer]:pt-[22px] [&_footer]:text-[12px] [&_footer]:text-[#62685e] dark:[&_footer]:border-[#404b3f] dark:[&_footer]:text-[#b2bcac] max-[700px]:[&_footer_span]:max-w-[140px] max-[700px]:[&_footer_span]:text-right">
      <nav>
        <Link
          className="font-[Georgia,serif] inline-flex items-baseline gap-1 text-[27px] leading-[1.3] tracking-[-0.025em] hover:no-underline [-webkit-tap-highlight-color:transparent]"
          href="/"
        >
          NoteVault
          <span className="size-1.5 rounded-full bg-[#334e3d] dark:bg-[#b7d0ac]" />
        </Link>
        <Link
          className="[-webkit-tap-highlight-color:transparent] hover:underline hover:underline-offset-4"
          href="/login"
        >
          Sign in <span aria-hidden="true">→</span>
        </Link>
      </nav>
      <section className="grid min-h-[76vh] grid-cols-[1.2fr_1fr] items-center gap-20 py-[70px] max-[1100px]:gap-10 max-[700px]:grid-cols-1 max-[700px]:gap-7 max-[700px]:py-[52px] [&_h1]:mb-[26px] [&_h1]:text-[clamp(44px,5.2vw,76px)] [&_p]:mb-[30px] [&>div:first-child_p]:leading-[1.9]">
        <div>
          <h1 className="font-[Georgia,Times_New_Roman,serif] font-normal tracking-[-0.025em] leading-[1.15] text-balance">
            A little room
            <br />
            for your thoughts.
          </h1>
          <p className="text-[#62685e] dark:text-[#b2bcac]">
            Keep the ideas that arrive unannounced.
            <br />
            Make space for plans, lists, and everything in between.
          </p>
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-5 rounded-[7px] border-0 bg-[#334e3d] px-5 py-[11px] text-[14px] font-semibold text-white hover:bg-[#243d2d] hover:no-underline dark:bg-[#b7d0ac] dark:text-[#182719] dark:hover:bg-[#c7ddb9] [-webkit-tap-highlight-color:transparent]"
            href="/register"
          >
            Start your notebook <span aria-hidden="true">→</span>
          </Link>
          <p className="text-[13px] [&_a]:underline [&_a]:underline-offset-[3px] text-[#62685e] dark:text-[#b2bcac] mt-[18px]">
            Already have a notebook?{" "}
            <Link
              className="[-webkit-tap-highlight-color:transparent] hover:underline hover:underline-offset-4"
              href="/login"
            >
              Sign in
            </Link>
          </p>
        </div>
        <div className="min-h-[430px] rotate-2 rounded-[3px] bg-[#e9eee4] px-[42px] py-12 dark:bg-[#303e30] max-[700px]:min-h-[340px] max-[700px]:rotate-0 max-[700px]:p-8 [&_h2]:mt-[30px] [&_h2]:mb-[22px] [&_h2]:font-[Georgia,serif] [&_h2]:text-[36px] [&_h2]:leading-[1.25] [&_p]:text-[14px] [&_p]:leading-[1.7]">
          <span className="text-[11px] tracking-[0.06em] text-[#62685e] dark:text-[#b2bcac]">
            SATURDAY, NOVEMBER 7
          </span>
          <h2 className="text-[19px] font-medium text-balance">
            The things
            <br />
            worth noticing.
          </h2>
          <p className="text-[#62685e] dark:text-[#b2bcac]">
            The light through the kitchen window.
            <br />
            <br />A sentence in a book that stays with you.
            <br />
            <br />
            An idea that just needs somewhere to land.
          </p>
          <span className="text-[11px] tracking-[0.06em] text-[#62685e] dark:text-[#b2bcac]">
            A page of your own.
          </span>
        </div>
      </section>
      <footer>
        NoteVault<span>Less noise. More room to think.</span>
      </footer>
    </main>
  );
}
