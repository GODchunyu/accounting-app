import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { getDatabaseEnv } from "./db-env.mjs";

const backupPath = process.argv[2];
if (!backupPath) {
  console.error("Usage: pnpm db:restore -- <backup-file.dump>");
  process.exit(1);
}

const absoluteBackupPath = path.resolve(backupPath);
if (!existsSync(absoluteBackupPath)) {
  console.error(`Backup file not found: ${absoluteBackupPath}`);
  process.exit(1);
}

const { database, user } = getDatabaseEnv();
console.warn(
  `Restoring ${absoluteBackupPath} into database "${database}". Existing objects may be replaced.`,
);

const code = await runRestore(absoluteBackupPath);
if (code !== 0) {
  console.error(`Database restore failed with exit code ${code}`);
  process.exit(code);
}

console.log("Database restore completed");

function runRestore(inputPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "docker",
      [
        "compose",
        "exec",
        "-T",
        "postgres",
        "pg_restore",
        "--clean",
        "--if-exists",
        "--no-owner",
        "-U",
        user,
        "-d",
        database,
      ],
      { stdio: ["pipe", "inherit", "inherit"] },
    );

    createReadStream(inputPath).pipe(child.stdin);
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
}
