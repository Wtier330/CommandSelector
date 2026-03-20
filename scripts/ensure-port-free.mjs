import { execSync } from "node:child_process";

function run(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
}

function parseListeningPids(netstatOutput, port) {
  const pids = new Set();
  const lines = netstatOutput.split(/\r?\n/);
  for (const line of lines) {
    if (!line.includes(`:${port}`)) continue;
    if (!/\bLISTENING\b/i.test(line)) continue;
    const m = line.match(/\bLISTENING\b\s+(\d+)\s*$/i);
    if (m) pids.add(Number(m[1]));
  }
  return Array.from(pids).filter((n) => Number.isFinite(n) && n > 0);
}

function getImageName(pid) {
  const out = run(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`);
  const line = out.trim();
  if (!line || /INFO:/i.test(line)) return null;
  const cols = line.split(",").map((s) => s.replace(/^"|"$/g, ""));
  return cols[0] || null;
}

function killPid(pid) {
  run(`taskkill /PID ${pid} /F`);
}

const port = Number(process.argv[2]);
if (!Number.isFinite(port) || port <= 0 || port > 65535) {
  console.error("Usage: node scripts/ensure-port-free.mjs <port>");
  process.exit(2);
}

if (process.platform !== "win32") {
  process.exit(0);
}

let netstatOutput = "";
try {
  netstatOutput = run("netstat -ano");
} catch {
  process.exit(0);
}

const pids = parseListeningPids(netstatOutput, port);
if (pids.length === 0) {
  process.exit(0);
}

for (const pid of pids) {
  const imageName = getImageName(pid);
  if (!imageName) continue;
  if (imageName.toLowerCase() === "node.exe") {
    try {
      killPid(pid);
    } catch {
      console.error(`Port ${port} is in use by PID ${pid} (${imageName}). Unable to stop it automatically.`);
      process.exit(1);
    }
  } else {
    console.error(`Port ${port} is in use by PID ${pid} (${imageName}). Stop it and retry.`);
    process.exit(1);
  }
}

process.exit(0);
