import { execFileSync } from "node:child_process";
import fs from "node:fs";

console.log("=== Deploying 0.1.0-beta.1 to staging ===");
try {
  const out1 = execFileSync("arc", ["deploy", "--json"], {
    cwd: "/home/agent/game",
    encoding: "utf-8",
  });
  console.log("Staging deploy output:", out1);
} catch (err) {
  console.error("Staging deploy error:", err.stdout || "", err.stderr || "", err.message);
  process.exit(1);
}

console.log("=== Updating arcadible.toml to version 0.1.0 for production ===");
const tomlPath = "/home/agent/game/arcadible.toml";
const toml = fs.readFileSync(tomlPath, "utf-8").replace('version = "0.1.0-beta.1"', 'version = "0.1.0"');
fs.writeFileSync(tomlPath, toml);

console.log("=== Deploying 0.1.0 to production ===");
try {
  const out2 = execFileSync("arc", ["deploy", "--json"], {
    cwd: "/home/agent/game",
    encoding: "utf-8",
  });
  console.log("Production deploy output:", out2);
} catch (err) {
  console.error("Production deploy error:", err.stdout || "", err.stderr || "", err.message);
  process.exit(1);
}
