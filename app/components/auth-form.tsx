"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useActionState } from "react";
export default function AuthForm({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const [error, submit, busy] = useActionState(
    async (_error: string, formData: FormData) => {
      const data = Object.fromEntries(formData);
      try {
        if (register) {
          const response = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const result = await response.json();
          if (!response.ok) return result.error as string;
        } else {
          const result = await signIn("credentials", {
            redirect: false,
            email: data.email,
            password: data.password,
            callbackUrl: "/dashboard",
          });
          if (!result?.ok || result.error) {
            if (result?.error === "TooManyAttempts")
              return "Too many attempts. Try again in 30 seconds.";
            if (result?.error === "AuthenticationUnavailable")
              return "Unable to sign in. Please try again.";
            return "Invalid email or password.";
          }
        }
        router.replace(register ? "/login" : "/dashboard");
        return "";
      } catch {
        return "Unable to connect. Please try again.";
      }
    },
    "",
  );
  return (
    <main className="mx-auto flex min-h-screen max-w-[1200px] flex-col px-12 py-9 max-[700px]:p-6">
      <Link
        className="font-[Georgia,serif] inline-flex items-baseline gap-1 text-[27px] leading-[1.3] tracking-[-0.025em] hover:no-underline [-webkit-tap-highlight-color:transparent]"
        href="/"
      >
        NoteVault
        <span className="size-1.5 rounded-full bg-[#334e3d] dark:bg-[#b7d0ac]" />
      </Link>
      <section className="m-auto w-full max-w-[380px] py-12 [&_h1]:mb-3 [&_h1]:text-[40px] [&>p]:mb-8 [&_form]:grid [&_form]:gap-[18px] [&_form+p]:mt-6">
        <h1 className="font-[Georgia,Times_New_Roman,serif] font-normal tracking-[-0.025em] leading-[1.15] text-balance">
          {register ? "A fresh page awaits." : "Welcome back."}
        </h1>
        <p className="text-[#62685e] dark:text-[#b2bcac]">
          {register
            ? "Create a home for your everyday thoughts."
            : "Your thoughts, right where you left them."}
        </p>
        <form action={submit}>
          {register && (
            <label className="block text-[13px] font-semibold">
              Your name
              <input
                className="w-full rounded-lg border border-[#dddfd6] dark:border-[#404b3f] bg-white px-3.5 py-3 text-inherit caret-[#334e3d] placeholder:text-[#62685e] dark:bg-[#242a24] dark:caret-[#b7d0ac] dark:placeholder:text-[#b2bcac] mt-[7px] [-webkit-tap-highlight-color:transparent]"
                name="name"
                autoComplete="name"
                required
                maxLength={80}
              />
            </label>
          )}
          <label className="block text-[13px] font-semibold">
            Email address
            <input
              className="w-full rounded-lg border border-[#dddfd6] dark:border-[#404b3f] bg-white px-3.5 py-3 text-inherit caret-[#334e3d] placeholder:text-[#62685e] dark:bg-[#242a24] dark:caret-[#b7d0ac] dark:placeholder:text-[#b2bcac] mt-[7px] [-webkit-tap-highlight-color:transparent]"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
          <label className="block text-[13px] font-semibold">
            Password
            <input
              className="w-full rounded-lg border border-[#dddfd6] dark:border-[#404b3f] bg-white px-3.5 py-3 text-inherit caret-[#334e3d] placeholder:text-[#62685e] dark:bg-[#242a24] dark:caret-[#b7d0ac] dark:placeholder:text-[#b2bcac] mt-[7px] [-webkit-tap-highlight-color:transparent]"
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              required
              minLength={register ? 12 : 1}
            />
          </label>
          {error && (
            <p
              className="rounded-[7px] bg-[#f3ebdd] px-[18px] py-3.5 text-[14px] text-[#853c2c] [overflow-wrap:anywhere] dark:bg-[#403a2e] dark:text-[#ffbcab]"
              role="alert"
            >
              {error}
            </p>
          )}
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center gap-5 rounded-[7px] border-0 bg-[#334e3d] px-5 py-[11px] text-[14px] font-semibold text-white hover:bg-[#243d2d] hover:no-underline dark:bg-[#b7d0ac] dark:text-[#182719] dark:hover:bg-[#c7ddb9] cursor-pointer disabled:cursor-wait disabled:opacity-60 [-webkit-tap-highlight-color:transparent]"
            disabled={busy}
          >
            {busy ? "Please wait…" : register ? "Create account" : "Sign in"}
          </button>
        </form>
        <p className="text-[13px] [&_a]:underline [&_a]:underline-offset-[3px] text-[#62685e] dark:text-[#b2bcac]">
          {register ? "Already have an account?" : "New here?"}{" "}
          <Link
            className="[-webkit-tap-highlight-color:transparent] hover:underline hover:underline-offset-4"
            href={register ? "/login" : "/register"}
          >
            {register ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </section>
      <span className="text-center text-[12px] text-[#62685e] dark:text-[#b2bcac]">
        A little room for your thoughts.
      </span>
    </main>
  );
}
