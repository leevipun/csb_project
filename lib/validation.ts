import { z } from "zod";

const email = z.string().max(254).trim().toLowerCase().pipe(z.email());
const password = z.string();

export const loginSchema = z.object({ email, password: password.min(1) });

export const registrationSchema = loginSchema.extend({
  name: z.string().trim().min(1).max(80),
  password: password.min(12),
});

export const noteSchema = z.object(
  {
    title: z
      .string({ error: "Invalid title." })
      .min(1, "Invalid title.")
      .max(200, "Invalid title."),
    content: z
      .string({ error: "Invalid content." })
      .max(50000, "Invalid content."),
  },
  { error: "Expected a JSON object." },
);

export const noteIdSchema = z.coerce.number().int().positive();

export const searchQuerySchema = z
  .string()
  .max(200, "Search is limited to 200 characters.");
