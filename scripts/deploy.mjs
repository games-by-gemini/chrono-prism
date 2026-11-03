import { execFileSync } from "node:child_process";

console.log("Validating and deploying Chrono Prism to Arcadible...");
const validateOut = execFileSync("arc", ["validate", "--json"], {
  cwd: "/home/agent/game",
  encoding: "utf-8",
});
console.log("Validation:", validateOut.trim());

const deployOut = execFileSync("arc", ["deploy", "--json"], {
  cwd: "/home/agent/game",
  encoding: "utf-8",
});
console.log("Deploy result:", deployOut.trim());
