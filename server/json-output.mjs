import { spawn } from "node:child_process";

// Keep stdout untouched. Formatting is optional and never executes a shell.
export function formatWithJq(stdout) {
  if (!stdout.trim()) return Promise.resolve(null);
  return new Promise((resolve) => {
    const child = spawn("jq", ["--monochrome-output", "--indent", "2", "."], { shell: false });
    let output = "";
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => { child.kill(); finish(null); }, 2000);
    child.stdout.on("data", (chunk) => {
      output += chunk;
      if (output.length > 2000000) { child.kill(); finish(null); }
    });
    child.stderr.resume();
    child.stdin.on("error", () => {});
    child.on("error", () => finish(null));
    child.on("close", (code) => finish(code === 0 && output.trim() ? output : null));
    child.stdin.end(stdout);
  });
}
