#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const refresher = path.join(repositoryRoot, "script", "refresh-codespaces-private-port");
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "drawing-board-port-refresh-test-"));
const mockBin = path.join(temporaryRoot, "bin");
const statePath = path.join(temporaryRoot, "visibility");
const logPath = path.join(temporaryRoot, "gh.log");
const privateAttemptsPath = path.join(temporaryRoot, "private-attempts");

function writeExecutable(name, contents) {
  const destination = path.join(mockBin, name);
  fs.writeFileSync(destination, contents, {mode: 0o755});
  fs.chmodSync(destination, 0o755);
}

function run(changes = {}, pathValue = `${mockBin}:/usr/bin:/bin`) {
  return spawnSync(refresher, [], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: pathValue,
      PORT_REFRESH_LOG: logPath,
      PORT_REFRESH_STATE: statePath,
      PORT_REFRESH_PRIVATE_ATTEMPTS: privateAttemptsPath,
      CODESPACES: "true",
      CODESPACE_NAME: "drawing-board-test",
      ...changes,
    },
  });
}

function logLines() {
  if (!fs.existsSync(logPath)) return [];
  return fs.readFileSync(logPath, "utf8").trim().split("\n").filter(Boolean);
}

try {
  fs.mkdirSync(mockBin);
  writeExecutable(
    "gh",
    `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$*" >>"$PORT_REFRESH_LOG"
if [[ "$1 $2" == "codespace ports" && "\${3:-}" != "visibility" ]]; then
  state="$(<"$PORT_REFRESH_STATE")"
  [[ "$state" == "missing" ]] || printf '%s\\n' "$state"
  exit 0
fi
if [[ "$1 $2 $3" == "codespace ports visibility" ]]; then
  visibility="\${4#*:}"
  if [[ "$visibility" == "public" && "\${MOCK_PUBLIC_FAILURE:-false}" == "true" ]]; then
    exit 42
  fi
  if [[ "$visibility" == "private" && "\${MOCK_PRIVATE_FAILURES:-0}" != "0" ]]; then
    attempts=0
    [[ ! -f "$PORT_REFRESH_PRIVATE_ATTEMPTS" ]] || attempts="$(<"$PORT_REFRESH_PRIVATE_ATTEMPTS")"
    attempts="$((attempts + 1))"
    printf '%s' "$attempts" >"$PORT_REFRESH_PRIVATE_ATTEMPTS"
    if (( attempts <= MOCK_PRIVATE_FAILURES )); then
      exit 43
    fi
  fi
  printf '%s' "$visibility" >"$PORT_REFRESH_STATE"
  exit 0
fi
exit 64
`,
  );
  writeExecutable(
    "ss",
    `#!/usr/bin/env bash
case "\${MOCK_LISTENER:-false}" in
  true) printf '%s\\n' 'LISTEN 0 4096 0.0.0.0:3000 0.0.0.0:*'; exit 0 ;;
  false) exit 0 ;;
  error) exit 2 ;;
esac
`,
  );

  fs.writeFileSync(statePath, "private");
  const first = run();
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stdout, /Refreshing the unbound Codespaces port 3000 registration/);
  assert.match(first.stdout, /private visibility confirmed/);
  assert.equal(fs.readFileSync(statePath, "utf8"), "private");
  assert.deepEqual(logLines(), [
    "codespace ports --codespace drawing-board-test --json sourcePort,visibility --jq .[] | select(.sourcePort == 3000) | .visibility",
    "codespace ports visibility 3000:public --codespace drawing-board-test",
    "codespace ports visibility 3000:private --codespace drawing-board-test",
    "codespace ports --codespace drawing-board-test --json sourcePort,visibility --jq .[] | select(.sourcePort == 3000) | .visibility",
  ]);

  fs.writeFileSync(logPath, "");
  const repeated = run();
  assert.equal(repeated.status, 0, repeated.stderr);
  assert.equal(fs.readFileSync(statePath, "utf8"), "private");
  assert.equal(logLines().filter((line) => line.includes(" visibility ")).length, 2);

  fs.writeFileSync(logPath, "");
  const listener = run({MOCK_LISTENER: "true"});
  assert.notEqual(listener.status, 0);
  assert.match(listener.stderr, /Refusing to re-register port 3000 while a listener is active/);
  assert.equal(fs.readFileSync(statePath, "utf8"), "private");
  assert.equal(logLines().some((line) => line.includes(" visibility ")), false);

  fs.writeFileSync(logPath, "");
  const listenerProbeError = run({MOCK_LISTENER: "error"});
  assert.notEqual(listenerProbeError.status, 0);
  assert.match(listenerProbeError.stderr, /Could not determine whether port 3000 has a listener/);
  assert.equal(fs.readFileSync(statePath, "utf8"), "private");
  assert.equal(logLines().some((line) => line.includes(" visibility ")), false);

  fs.writeFileSync(statePath, "public");
  fs.writeFileSync(logPath, "");
  const exposedListener = run({MOCK_LISTENER: "true"});
  assert.notEqual(exposedListener.status, 0);
  assert.match(exposedListener.stderr, /Restoring forwarded port 3000 from public to private/);
  assert.match(exposedListener.stderr, /Refusing to re-register port 3000 while a listener is active/);
  assert.equal(fs.readFileSync(statePath, "utf8"), "private");
  assert.equal(logLines().filter((line) => line.includes(" visibility ")).length, 1);

  fs.writeFileSync(statePath, "private");
  fs.writeFileSync(logPath, "");
  const failedPublic = run({MOCK_PUBLIC_FAILURE: "true"});
  assert.notEqual(failedPublic.status, 0);
  assert.match(failedPublic.stderr, /Port refresh was interrupted; restoring private visibility/);
  assert.equal(fs.readFileSync(statePath, "utf8"), "private");
  assert.deepEqual(logLines().filter((line) => line.includes(" visibility ")), [
    "codespace ports visibility 3000:public --codespace drawing-board-test",
    "codespace ports visibility 3000:private --codespace drawing-board-test",
  ]);

  fs.writeFileSync(statePath, "private");
  fs.writeFileSync(logPath, "");
  fs.rmSync(privateAttemptsPath, {force: true});
  const transientPrivateFailure = run({MOCK_PRIVATE_FAILURES: "1"});
  assert.notEqual(transientPrivateFailure.status, 0);
  assert.match(transientPrivateFailure.stderr, /Port refresh was interrupted; restoring private visibility/);
  assert.doesNotMatch(transientPrivateFailure.stderr, /URGENT/);
  assert.equal(fs.readFileSync(statePath, "utf8"), "private");
  assert.equal(logLines().filter((line) => line.includes("visibility 3000:private")).length, 2);

  fs.writeFileSync(statePath, "private");
  fs.writeFileSync(logPath, "");
  fs.rmSync(privateAttemptsPath, {force: true});
  const permanentPrivateFailure = run({MOCK_PRIVATE_FAILURES: "2"});
  assert.notEqual(permanentPrivateFailure.status, 0);
  assert.match(permanentPrivateFailure.stderr, /URGENT: Codespaces did not restore private visibility/);
  assert.equal(fs.readFileSync(statePath, "utf8"), "public");

  fs.writeFileSync(statePath, "missing");
  fs.writeFileSync(logPath, "");
  const missing = run();
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /did not register forwarded port 3000/);
  assert.equal(logLines().some((line) => line.includes(" visibility ")), false);

  fs.writeFileSync(logPath, "");
  const outside = run({CODESPACES: "false", CODESPACE_NAME: ""});
  assert.equal(outside.status, 0, outside.stderr);
  assert.match(outside.stdout, /skipped outside GitHub Codespaces/);
  assert.deepEqual(logLines(), []);

  const missingName = run({CODESPACE_NAME: ""});
  assert.notEqual(missingName.status, 0);
  assert.match(missingName.stderr, /CODESPACE_NAME is required/);

  const realSs = spawnSync("ss", ["--version"], {encoding: "utf8"});
  if (realSs.status === 0) {
    const realBin = path.join(temporaryRoot, "real-bin");
    fs.mkdirSync(realBin);
    fs.copyFileSync(path.join(mockBin, "gh"), path.join(realBin, "gh"));
    fs.chmodSync(path.join(realBin, "gh"), 0o755);
    const realPath = `${realBin}:${process.env.PATH}`;
    const server = net.createServer();
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(3000, "127.0.0.1", resolve);
    });
    fs.writeFileSync(statePath, "private");
    fs.writeFileSync(logPath, "");
    const realListener = run({}, realPath);
    assert.notEqual(realListener.status, 0);
    assert.match(realListener.stderr, /Refusing to re-register port 3000 while a listener is active/);
    assert.equal(logLines().some((line) => line.includes(" visibility ")), false);
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));

    fs.writeFileSync(logPath, "");
    const realNoListener = run({}, realPath);
    assert.equal(realNoListener.status, 0, realNoListener.stderr);
    assert.equal(fs.readFileSync(statePath, "utf8"), "private");
  }
} finally {
  fs.rmSync(temporaryRoot, {recursive: true, force: true});
}
