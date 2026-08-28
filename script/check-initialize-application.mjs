#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {execFileSync, spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {
  assertSameInventory,
  committedInventory,
  filesystemInventory,
} from "./application-repository-inventory.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "drawing-board-application-init-test-"));

function write(relativePath, contents, mode = 0o644) {
  const destination = path.join(harnessRoot, relativePath);
  fs.mkdirSync(path.dirname(destination), {recursive: true});
  fs.writeFileSync(destination, contents, {mode});
}

const harnessRoot = path.join(temporaryRoot, "drawing-board");
const applicationRoot = path.join(harnessRoot, "application");

try {
  fs.mkdirSync(path.join(harnessRoot, "script"), {recursive: true});
  for (const script of ["application-smoke", "initialize-application", "application-repository-inventory.mjs"]) {
    fs.copyFileSync(path.join(repositoryRoot, "script", script), path.join(harnessRoot, "script", script));
  }

  write("application/.gitignore", ".firstdraft/\nignored.txt\n");
  write("application/.firstdraft/submitted-foundation-plan.json", "{\"plan\":true}\n");
  write("application/.firstdraft/gaps.json", "{\"gaps\":[]}\n");
  write("application/bin/setup", "#!/usr/bin/env bash\ntouch setup-ran\n", 0o755);
  write("application/bin/ci", "#!/usr/bin/env bash\nexit 0\n", 0o755);
  write("application/ignored.txt", "trailing whitespace  \n");
  write("application/ordinary.txt", "ordinary bytes\n");
  fs.cpSync(applicationRoot, path.join(harnessRoot, "custom-application"), {recursive: true});

  const expected = filesystemInventory(applicationRoot);
  const initializer = path.join(harnessRoot, "script", "initialize-application");

  const uninitializedSmoke = spawnSync("bash", [path.join(harnessRoot, "script", "application-smoke")], {
    cwd: harnessRoot,
    encoding: "utf8",
  });
  assert.notEqual(uninitializedSmoke.status, 0, "application smoke must reject a missing nested repository");
  assert.equal(fs.existsSync(path.join(applicationRoot, "setup-ran")), false, "application setup ran before Git validation");

  const extraArguments = spawnSync("bash", [initializer, "application", "extra"], {
    cwd: harnessRoot,
    encoding: "utf8",
  });
  assert.notEqual(extraArguments.status, 0, "initializer must reject extra arguments");
  assert.equal(fs.existsSync(path.join(applicationRoot, ".git")), false);

  const outsideRoot = spawnSync("bash", [initializer, temporaryRoot], {
    cwd: harnessRoot,
    encoding: "utf8",
  });
  assert.notEqual(outsideRoot.status, 0, "initializer must reject paths outside Drawing Board");
  assert.equal(fs.existsSync(path.join(applicationRoot, ".git")), false);

  const initialized = spawnSync("bash", [initializer], {
    cwd: harnessRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "Drawing Board Test",
      GIT_AUTHOR_EMAIL: "drawing-board-test@example.invalid",
      GIT_CONFIG_COUNT: "3",
      GIT_CONFIG_KEY_0: "commit.gpgsign",
      GIT_CONFIG_VALUE_0: "true",
      GIT_CONFIG_KEY_1: "core.autocrlf",
      GIT_CONFIG_VALUE_1: "true",
      GIT_CONFIG_KEY_2: "core.fileMode",
      GIT_CONFIG_VALUE_2: "false",
    },
  });
  assert.equal(initialized.status, 0, initialized.stderr);

  const git = (...arguments_) => execFileSync("git", ["-C", applicationRoot, ...arguments_], {
    encoding: "utf8",
  }).trim();
  assert.equal(git("branch", "--show-current"), "main");
  assert.equal(git("rev-list", "--parents", "--max-count=1", "HEAD").split(/\s+/).length, 1);
  assert.equal(git("status", "--porcelain"), "");

  const current = filesystemInventory(applicationRoot);
  const committed = committedInventory(applicationRoot, path.join(applicationRoot, ".git"));
  assertSameInventory(expected, current, "Fixture source inventory");
  assertSameInventory(expected, committed, "Fixture commit inventory");
  assert.equal(committed.find((record) => record.path === "bin/setup")?.mode, "100755");
  assert.ok(committed.some((record) => record.path === ".firstdraft/gaps.json"));
  assert.ok(committed.some((record) => record.path === ".firstdraft/submitted-foundation-plan.json"));
  assert.equal(fs.readFileSync(path.join(applicationRoot, "ignored.txt"), "utf8"), "trailing whitespace  \n");

  const customRoot = path.join(harnessRoot, "custom-application");
  const customInitialized = spawnSync("bash", [initializer, "custom-application"], {
    cwd: harnessRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "Drawing Board Test",
      GIT_AUTHOR_EMAIL: "drawing-board-test@example.invalid",
    },
  });
  assert.equal(customInitialized.status, 0, customInitialized.stderr);
  assert.equal(execFileSync("git", ["-C", customRoot, "branch", "--show-current"], {encoding: "utf8"}).trim(), "main");
  assertSameInventory(expected, filesystemInventory(customRoot), "Custom-path source inventory");
  assertSameInventory(
    expected,
    committedInventory(customRoot, path.join(customRoot, ".git")),
    "Custom-path commit inventory",
  );

  console.log("Generated application initialization contract passed.");
} finally {
  fs.rmSync(temporaryRoot, {recursive: true, force: true});
}
