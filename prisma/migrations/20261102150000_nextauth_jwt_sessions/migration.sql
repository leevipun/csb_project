-- NextAuth Credentials uses encrypted JWT cookies. Existing custom sessions expire here.
-- Users and notes are preserved.
DROP TABLE "Session";
