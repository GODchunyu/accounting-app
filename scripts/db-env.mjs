import { existsSync, readFileSync } from "node:fs";

export function getDatabaseEnv() {
  const fileEnv = readDotEnv(".env");
  return {
    database:
      process.env.POSTGRES_DB ?? fileEnv.POSTGRES_DB ?? "accounting_app",
    user: process.env.POSTGRES_USER ?? fileEnv.POSTGRES_USER ?? "accounting",
  };
}

function readDotEnv(path) {
  if (!existsSync(path)) {
    return {};
  }

  const result = {};
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
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
