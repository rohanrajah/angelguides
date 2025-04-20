import { spawn } from "child_process";

const child = spawn("tsx", ["scripts/populate-database.ts"], {
  stdio: "inherit",
});

child.on("exit", (code) => {
  process.exit(code || 0);
});