#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";

function sha256(contents) {
  return crypto.createHash("sha256").update(contents).digest("hex");
}

function comparePaths(left, right) {
  return left.path < right.path ? -1 : left.path > right.path ? 1 : 0;
}

export function filesystemInventory(root) {
  const records = [];

  function visit(directory, relativeDirectory = "") {
    const entries = fs.readdirSync(directory, {withFileTypes: true})
      .sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0);

    for (const entry of entries) {
      if (!relativeDirectory && entry.name === ".git") continue;

      const absolutePath = path.join(directory, entry.name);
      const relativePath = path.posix.join(relativeDirectory, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath, relativePath);
        continue;
      }
      if (!entry.isFile()) {
        throw new Error(`Unsupported generated application entry: ${relativePath}`);
      }

      const statistics = fs.statSync(absolutePath);
      records.push({
        path: relativePath,
        mode: statistics.mode & 0o111 ? "100755" : "100644",
        sha256: sha256(fs.readFileSync(absolutePath)),
      });
    }
  }

  visit(root);
  return records.sort(comparePaths);
}

export function committedInventory(root, gitDirectory) {
  const tree = execFileSync(
    "git",
    ["--git-dir", gitDirectory, "--work-tree", root, "ls-tree", "-rz", "--full-tree", "HEAD"],
    {maxBuffer: 16 * 1024 * 1024},
  );
  const records = [];

  for (let start = 0; start < tree.length;) {
    const end = tree.indexOf(0, start);
    if (end === -1) throw new Error("Git tree output was not NUL terminated.");

    const record = tree.subarray(start, end);
    const tab = record.indexOf(9);
    if (tab === -1) throw new Error("Git tree output omitted its path separator.");

    const [mode, type, object] = record.subarray(0, tab).toString("ascii").split(" ");
    const relativePath = record.subarray(tab + 1).toString("utf8");
    if (type !== "blob" || !["100644", "100755"].includes(mode)) {
      throw new Error(`Unsupported committed application entry: ${relativePath} (${mode} ${type})`);
    }

    const contents = execFileSync("git", ["--git-dir", gitDirectory, "cat-file", "blob", object], {
      maxBuffer: 16 * 1024 * 1024,
    });
    records.push({path: relativePath, mode, sha256: sha256(contents)});
    start = end + 1;
  }

  return records.sort(comparePaths);
}

export function assertSameInventory(expected, actual, label) {
  if (JSON.stringify(expected) === JSON.stringify(actual)) return;

  const expectedByPath = new Map(expected.map((record) => [record.path, record]));
  const actualByPath = new Map(actual.map((record) => [record.path, record]));
  const paths = [...new Set([...expectedByPath.keys(), ...actualByPath.keys()])].sort();
  const mismatch = paths.find((entryPath) =>
    JSON.stringify(expectedByPath.get(entryPath)) !== JSON.stringify(actualByPath.get(entryPath)),
  );
  throw new Error(`${label} differs at ${mismatch ?? "an unknown path"}.`);
}

function main() {
  const [operation, rootArgument, inventoryPath, gitDirectory] = process.argv.slice(2);
  if (!operation || !rootArgument || !inventoryPath || !["capture", "verify"].includes(operation)) {
    throw new Error("Usage: application-repository-inventory.mjs capture|verify ROOT INVENTORY [GIT_DIR]");
  }

  const root = fs.realpathSync(rootArgument);
  if (operation === "capture") {
    fs.writeFileSync(inventoryPath, `${JSON.stringify(filesystemInventory(root))}\n`, {mode: 0o600});
    return;
  }
  if (!gitDirectory) throw new Error("verify requires GIT_DIR.");

  const expected = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
  assertSameInventory(expected, filesystemInventory(root), "Application source inventory");
  assertSameInventory(expected, committedInventory(root, gitDirectory), "Application commit inventory");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
