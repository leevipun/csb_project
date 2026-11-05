import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "./components/auth-provider";
export const metadata: Metadata = {
  title: "NoteVault — a little room for your thoughts",
  description:
    "A personal notebook for ideas, plans, and everyday observations.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className="scheme-light-dark" lang="en">
      <body className="m-0 bg-[#f9f8f5] font-[Arial,Helvetica,sans-serif] text-[15px] leading-[1.65] text-[#292d28] selection:bg-[#334e3d] selection:text-[#f9f8f5] dark:bg-[#1e231e] dark:text-[#eeeede] dark:selection:bg-[#b7d0ac] dark:selection:text-[#1e231e] [&_*:focus-visible]:outline-2 [&_*:focus-visible]:outline-solid [&_*:focus-visible]:outline-offset-4 [&_*:focus-visible]:outline-[#334e3d] dark:[&_*:focus-visible]:outline-[#b7d0ac] motion-reduce:[&_*]:transition-none motion-reduce:[&_*]:scroll-auto">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
