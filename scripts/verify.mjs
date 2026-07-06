import { spawn } from "node:child_process";

const checks = [
  ["format", ["format"]],
  ["lint", ["lint"]],
  ["typecheck", ["typecheck"]],
  ["test", ["test"]],
  ["build", ["build"]],
  ["db:generate", ["db:generate"]],
  ["test:e2e", ["test:e2e"]],
];

const pnpmExecPath = process.env.npm_execpath;
const pnpmCommand = pnpmExecPath
  ? process.execPath
  : process.platform === "win32"
    ? "pnpm.cmd"
    : "pnpm";
const pnpmPrefixArgs = pnpmExecPath ? [pnpmExecPath] : [];

for (const [label, args] of checks) {
  console.log(`\n[verify] ${label}`);
  const code = await runPnpm(args);
  if (code !== 0) {
    console.error(`[verify] ${label} failed with exit code ${code}`);
    process.exit(code);
  }
}

console.log("\n[verify] all checks passed");

function runPnpm(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(pnpmCommand, [...pnpmPrefixArgs, ...args], {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
}
