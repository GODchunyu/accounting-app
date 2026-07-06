import "dotenv/config";
import { z } from "zod";

const placeholderJwtSecrets = new Set([
  "change_me_to_a_very_long_secret_with_at_least_32_chars",
  "replace_with_a_real_random_secret_of_at_least_32_chars",
]);

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    UPLOAD_DIR: z.string().default("uploads"),
  })
  .superRefine((value, context) => {
    if (
      value.NODE_ENV === "production" &&
      placeholderJwtSecrets.has(value.JWT_SECRET)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "JWT_SECRET must be changed in production",
        path: ["JWT_SECRET"],
      });
    }
  });

export const env = envSchema.parse(process.env);
