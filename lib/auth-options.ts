import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import { loginSchema } from "./validation";
// BEGIN FIX 2
// import bcrypt from "bcrypt";
// END FIX 2
// BEGIN FIX 4
// import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
// const loginLimiter = new RateLimiterMemory({ points: 5, duration: 30 });
// END FIX 4
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 7 * 86400 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        try {
          const result = loginSchema.safeParse(credentials);
          if (!result.success) return null;
          const { email, password } = result.data;
          // FLAW 4: A07:2021 Identification and Authentication Failures.
          // Every attempt reaches password verification; there is no server-side limit.
          // BEGIN VULNERABLE 4
          // Login attempts are unlimited in the vulnerable version.
          // END VULNERABLE 4
          // BEGIN FIX 4
          // await loginLimiter.consume(email);
          // END FIX 4
          const user = await db.user.findUnique({ where: { email } });
          // FLAW 2: A02:2021 Cryptographic Failures. Plaintext password comparison.
          // BEGIN VULNERABLE 2
          const passwordMatches = user && user.password === password;
          // END VULNERABLE 2
          // BEGIN FIX 2
          // const passwordMatches = user && await bcrypt.compare(password, user.password);
          // END FIX 2
          if (!user || !passwordMatches) {
            // FLAW 5: A09:2021 Security Logging and Monitoring Failures.
            // BEGIN VULNERABLE 5
            // Failed credentials deliberately emit no application audit event.
            // END VULNERABLE 5
            // BEGIN FIX 5
            // await db.securityAuditEvent.create({
            //   data: {
            //     eventType: "LOGIN_FAILED",
            //     account: email,
            //     requestPath: "/api/auth/callback/credentials",
            //     method: req.method ?? "POST",
            //     outcome: "DENIED",
            //   },
            // });
            // END FIX 5
            return null;
          }
          // BEGIN VULNERABLE 4
          // No attempt state to clear in the vulnerable version.
          // END VULNERABLE 4
          // BEGIN FIX 4
          // await loginLimiter.delete(email);
          // END FIX 4
          return { id: String(user.id), name: user.name, email: user.email };
        } catch (error) {
          // BEGIN FIX 4
          // if (error instanceof RateLimiterRes) throw new Error("TooManyAttempts");
          // END FIX 4
          // Never put database errors or submitted credentials in a redirect URL.
          throw new Error("AuthenticationUnavailable");
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) session.user.id = token.sub ?? "";
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      await db.securityAuditEvent.create({
        data: {
          eventType: "LOGIN_SUCCESS",
          account: user.email,
          requestPath: "/api/auth/callback/credentials",
          method: "POST",
          outcome: "ALLOWED",
        },
      });
    },
  },
};
