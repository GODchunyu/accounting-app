import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2).filter((arg) => arg !== "--");
const envPath = path.resolve(args[0] ?? ".env");
const placeholderJwtSecrets = new Set([
  "change_me_to_a_very_long_secret_with_at_least_32_chars",
  "replace_with_a_real_random_secret_of_at_least_32_chars",
]);
const placeholderPostgresPasswords = new Set([
  "accounting_dev_password",
  "replace_with_a_real_database_password",
]);

if (!existsSync(envPath)) {
  fail(`Environment file not found: ${envPath}`);
}

const env = readDotEnv(envPath);
const errors = [];

if (env.NODE_ENV !== "production") {
  errors.push("NODE_ENV must be production for release deployment.");
}

if (!env.JWT_SECRET) {
  errors.push("JWT_SECRET is required.");
} else {
  if (env.JWT_SECRET.length < 32) {
    errors.push("JWT_SECRET must be at least 32 characters.");
  }
  if (placeholderJwtSecrets.has(env.JWT_SECRET)) {
    errors.push("JWT_SECRET must be changed from the template value.");
  }
}

if (!env.POSTGRES_PASSWORD) {
  errors.push("POSTGRES_PASSWORD is required.");
} else {
  if (env.POSTGRES_PASSWORD.length < 12) {
    errors.push("POSTGRES_PASSWORD must be at least 12 characters.");
  }
  if (placeholderPostgresPasswords.has(env.POSTGRES_PASSWORD)) {
    errors.push("POSTGRES_PASSWORD must be changed from the template value.");
  }
}

for (const key of ["POSTGRES_USER", "POSTGRES_DB", "API_PORT"]) {
  if (!env[key]) {
    errors.push(`${key} is required.`);
  }
}

if (errors.length > 0) {
  console.error(`Environment check failed for ${envPath}:`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Environment check passed for ${envPath}`);

function readDotEnv(filePath) {
  const result = {};
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    result[key] = value.replace(/^["']|["']$/g, "");
  }

  return result;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
