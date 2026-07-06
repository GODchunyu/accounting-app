import { spawn } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const env = {
  ...process.env,
  E2E_SKIP_WEB_SERVER: "1",
};
const pnpmExecPath = process.env.npm_execpath;
const pnpmCommand = pnpmExecPath
  ? process.execPath
  : process.platform === "win32"
    ? "pnpm.cmd"
    : "pnpm";
const pnpmArgs = pnpmExecPath ? [pnpmExecPath] : [];
const playwrightCli = path.join(
  root,
  "node_modules",
  "@playwright",
  "test",
  "cli.js",
);

let stoppingServer = false;
const server = spawnCommand(
  pnpmCommand,
  [...pnpmArgs, "--filter", "@accounting-app/web", "dev:e2e"],
  {
    cwd: root,
    env,
    stdio: "inherit",
  },
);

let serverExited = false;
server.once("exit", (code) => {
  serverExited = true;
  if (!stoppingServer && code !== 0) {
    console.error(`E2E web server exited early with code ${code ?? "null"}.`);
  }
});

try {
  await waitForServer("http://127.0.0.1:5173", 60_000);
  if (serverExited) {
    process.exit(1);
  }

  const code = await runCommand(process.execPath, [playwrightCli, "test"], env);
  process.exitCode = code;
} finally {
  if (!serverExited) {
    stoppingServer = true;
    await stopProcessTree(server);
  }
}

async function waitForServer(url, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Server is still starting.
    }
    await delay(500);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function runCommand(command, args, commandEnv) {
  return new Promise((resolve, reject) => {
    const child = spawnCommand(command, args, {
      cwd: root,
      env: commandEnv,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
}

function spawnCommand(command, args, options) {
  return spawn(command, args, options);
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function stopProcessTree(child) {
  return new Promise((resolve) => {
    if (process.platform !== "win32") {
      child.kill();
      resolve();
      return;
    }

    const stopper = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
    });
    stopper.once("exit", () => resolve());
    stopper.once("error", () => resolve());
  });
}
