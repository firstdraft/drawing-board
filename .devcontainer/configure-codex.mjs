import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

if (process.env.CODESPACES === "true") {
  const codexHome = process.env.CODEX_HOME || join(homedir(), ".codex");
  mkdirSync(codexHome, { recursive: true });
  try {
    writeFileSync(
      join(codexHome, "config.toml"),
      'sandbox_mode = "danger-full-access"\napproval_policy = "on-request"\n',
      { flag: "wx", mode: 0o600 },
    );
    console.log("Codex will use the Codespace as its sandbox and retain on-request approvals.");
  } catch (error) {
    // A mounted home or dotfiles may already contain the user's choices.
    if (error.code !== "EEXIST") throw error;
    console.log("Existing Codex config path preserved; no defaults were applied.");
  }
}
