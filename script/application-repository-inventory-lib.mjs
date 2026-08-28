import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";

function sha256(contents) {
  return crypto.createHash("sha256").update(contents).digest("hex");
}

function comparePaths(left, right) {
  return left.path < right.path ? -1 : left.path > right.path ? 1 : 0;
}

export function readNulPaths(sourcePath) {
  const source = fs.readFileSync(sourcePath);
  if (source.length === 0 || source.at(-1) !== 0) {
    throw new Error("Application path inventory was not NUL terminated.");
  }

  const paths = source.subarray(0, -1).toString("utf8").split("\0");
  if (paths.some((relativePath) => !isRelativePath(relativePath)) ||
      new Set(paths).size !== paths.length) {
    throw new Error("Application path inventory is invalid.");
  }

  return paths.sort();
}

export function filesystemInventory(root, relativePaths) {
  const physicalRoot = fs.realpathSync(root);
  return relativePaths.map((relativePath) => {
    const absolutePath = path.join(physicalRoot, ...relativePath.split("/"));
    let physicalPath;
    let statistics;

    try {
      physicalPath = fs.realpathSync(absolutePath);
      statistics = fs.lstatSync(absolutePath);
    } catch (error) {
      throw new Error(`Generated application file is unavailable: ${relativePath}`, {cause: error});
    }

    if (physicalPath !== absolutePath || !statistics.isFile() || statistics.isSymbolicLink()) {
      throw new Error(`Unsupported generated application entry: ${relativePath}`);
    }

    const permissions = statistics.mode & 0o777;
    if (![0o644, 0o755].includes(permissions)) {
      throw new Error(`Unsupported generated application mode at ${relativePath}: ${permissions.toString(8)}`);
    }

    return {
      path: relativePath,
      mode: permissions === 0o755 ? "100755" : "100644",
      sha256: sha256(fs.readFileSync(absolutePath)),
    };
  }).sort(comparePaths);
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

export function captureInventory(root, inventoryPath, pathsPath) {
  const relativePaths = readNulPaths(pathsPath);
  const inventory = filesystemInventory(root, relativePaths);
  fs.writeFileSync(inventoryPath, `${JSON.stringify(inventory)}\n`, {mode: 0o600});
}

export function verifyInventory(root, inventoryPath, gitDirectory) {
  const expected = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
  if (!Array.isArray(expected) || expected.some((record) => !isInventoryRecord(record))) {
    throw new Error("Application source inventory is invalid.");
  }

  const relativePaths = expected.map((record) => record.path);
  assertSameInventory(expected, filesystemInventory(root, relativePaths), "Application source inventory");
  assertSameInventory(expected, committedInventory(root, gitDirectory), "Application commit inventory");
}

function isRelativePath(value) {
  return typeof value === "string" && value.length > 0 && !value.includes("\0") &&
    !path.posix.isAbsolute(value) && path.posix.normalize(value) === value &&
    !value.split("/").includes("..");
}

function isInventoryRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).join(",") === "path,mode,sha256" && isRelativePath(value.path) &&
    ["100644", "100755"].includes(value.mode) && /^[0-9a-f]{64}$/.test(value.sha256);
}
