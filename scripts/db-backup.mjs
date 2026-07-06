import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { getDatabaseEnv } from "./db-env.mjs";

const { database, user } = getDatabaseEnv();
const backupDir = path.resolve("backups");
await mkdir(backupDir, { recursive: true });

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputPath = path.join(backupDir, `${database}-${timestamp}.dump`);
const output = createWriteStream(outputPath, { flags: "wx" });

const code = await runDump(output);
if (code !== 0) {
  console.error(`Database backup failed with exit code ${code}`);
  process.exit(code);
}

console.log(`Database backup written to ${outputPath}`);

function runDump(outputStream) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "docker",
      [
        "compose",
        "exec",
        "-T",
        "postgres",
        "pg_dump",
        "-U",
        user,
        "-d",
        database,
        "-Fc",
      ],
      { stdio: ["ignore", "pipe", "inherit"] },
    );

    child.stdout.pipe(outputStream);
    child.once("error", reject);
    child.once("exit", (code) => {
      outputStream.end();
      resolve(code ?? 1);
    });
  });
}
