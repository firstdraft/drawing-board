import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  symlinkSync,
  unlinkSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

export function readAgentSkills(checkout, authoringNames) {
  const root = realpathSync(checkout);
  const manifest = JSON.parse(readFileSync(path.join(root, ".claude-plugin", "plugin.json"), "utf8"));
  assert.equal(manifest.name, "firstdraft", "the pinned source must be the First Draft plugin");
  assert(Array.isArray(manifest.skills) && manifest.skills.length > 0, "the pinned plugin must declare its Skills");
  const names = new Set();
  const skills = manifest.skills.map((relative) => {
    assert.equal(typeof relative, "string", "Skill paths must be strings");
    const match = relative.match(/^\.\/skills\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
    assert(match, "unsupported Skill path in the pinned manifest: " + relative);
    const name = match[1];
    assert(!names.has(name), "duplicate Skill in the pinned manifest: " + name);
    names.add(name);
    const source = realpathSync(path.join(root, relative));
    assert.equal(source, path.join(root, "skills", name), "Skill source must not escape its canonical directory");
    const entrypoint = path.join(source, "SKILL.md");
    assert(lstatSync(entrypoint).isFile(), "Skill entrypoint must be a regular file: " + name);
    const frontmatter = readFileSync(entrypoint, "utf8").match(/^---\n([\s\S]*?)\n---\n/);
    const declared = frontmatter?.[1].match(/^name: (?:"([^"]+)"|'([^']+)'|([^\n]+))$/m);
    assert.equal(declared?.[1] ?? declared?.[2] ?? declared?.[3], name, "Skill name differs from its directory");
    return { name, source, codexName: manifest.name + ":" + name };
  });
  const authoring = skills.find(({ name }) => name === authoringNames.claude);
  assert(authoring, "the pinned plugin is missing the configured authoring Skill");
  assert.equal(authoring.codexName, authoringNames.codex, "the configured Codex authoring name differs from the plugin");
  return skills;
}

function linksFor(skills, roots) {
  return Object.values(roots).flatMap((root) =>
    skills.map((skill) => ({ ...skill, link: path.join(root, skill.name) })),
  );
}

function isManagedLink(link, cacheRoot) {
  if (!lstatSync(link, { throwIfNoEntry: false })?.isSymbolicLink()) return false;
  const target = path.resolve(path.dirname(link), readlinkSync(link));
  return path.basename(target) === path.basename(link) &&
    [path.resolve(cacheRoot), realpathSync(cacheRoot)].some((root) =>
      /^[a-f0-9]{40}\/skills\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path.relative(root, target)),
    );
}

export function linkAgentSkills(skills, roots, cacheRoot) {
  const links = linksFor(skills, roots);
  for (const { link, source } of links) {
    const entry = lstatSync(link, { throwIfNoEntry: false });
    if (!entry) continue;
    assert(entry.isSymbolicLink(), link + " already exists and is not a managed symlink; preserving it");
    const target = path.resolve(path.dirname(link), readlinkSync(link));
    assert(target === source || isManagedLink(link, cacheRoot), link + " is an unmanaged symlink; preserving it");
  }
  for (const root of Object.values(roots)) mkdirSync(root, { recursive: true });
  for (const { link, source } of links) {
    if (lstatSync(link, { throwIfNoEntry: false })) {
      if (path.resolve(path.dirname(link), readlinkSync(link)) === source) continue;
      unlinkSync(link);
    }
    symlinkSync(source, link, "dir");
  }
  const names = new Set(skills.map(({ name }) => name));
  for (const root of Object.values(roots)) {
    for (const name of readdirSync(root)) {
      const link = path.join(root, name);
      if (!names.has(name) && isManagedLink(link, cacheRoot)) unlinkSync(link);
    }
  }
}

export function verifyAgentSkills(skills, roots, cacheRoot) {
  for (const { link, source } of linksFor(skills, roots)) {
    assert(lstatSync(link, { throwIfNoEntry: false })?.isSymbolicLink(), "missing managed Skill link: " + link);
    assert.equal(realpathSync(link), source, "Skill link differs from the pinned source: " + link);
  }
  const names = new Set(skills.map(({ name }) => name));
  for (const root of Object.values(roots)) {
    for (const name of readdirSync(root)) {
      assert(names.has(name) || !isManagedLink(path.join(root, name), cacheRoot), "obsolete First Draft Skill link: " + name);
    }
  }
}

export function verifyCodexSkills(skills, codexRoot, input) {
  const text = input.flatMap((item) => item.content ?? [])
    .map((content) => content.text ?? "")
    .filter((block) => block.includes("<skills_instructions>"))
    .join("\n");
  const roots = new Map([...text.matchAll(/^- `(r\d+)` = `([^`]+)`$/gm)]
    .map((match) => [match[1], match[2]]));
  for (const { name, source, codexName } of skills) {
    const lines = text.split("\n").filter((line) => line.startsWith("- " + codexName + ":"));
    assert.equal(lines.length, 1, "Codex must discover exactly one " + codexName);
    const locator = lines[0].match(/\(file: (.+)\)$/)?.[1];
    const alias = locator?.match(/^(r\d+)\/(.+)$/);
    const aliasRoot = alias && roots.get(alias[1]);
    const resolved = alias ? aliasRoot && path.join(aliasRoot, alias[2]) : locator;
    const expected = [
      path.join(codexRoot, name, "SKILL.md"),
      path.join(realpathSync(codexRoot), name, "SKILL.md"),
      path.join(source, "SKILL.md"),
    ];
    assert(expected.includes(resolved), "Codex loaded an unexpected path for " + codexName);
  }
}

function main() {
  const { values, positionals } = parseArgs({
    options: {
      checkout: { type: "string" },
      revision: { type: "string" },
      "claude-root": { type: "string" },
      "codex-root": { type: "string" },
      "claude-authoring-name": { type: "string" },
      "codex-authoring-name": { type: "string" },
    },
    allowPositionals: true,
  });
  assert(positionals.length === 1 && ["link", "check", "codex"].includes(positionals[0]), "use link, check, or codex");
  for (const option of ["checkout", "revision", "claude-root", "codex-root", "claude-authoring-name", "codex-authoring-name"]) {
    assert(values[option], "missing value for --" + option);
  }
  assert(values.revision?.match(/^[a-f0-9]{40}$/), "one exact Skills revision is required");
  const revision = spawnSync("git", ["-C", values.checkout, "rev-parse", "HEAD"], { encoding: "utf8" });
  assert(revision.status === 0 && revision.stdout.trim() === values.revision, "Skill checkout revision differs from the pin");
  const skills = readAgentSkills(values.checkout, {
    claude: values["claude-authoring-name"],
    codex: values["codex-authoring-name"],
  });
  const roots = { claude: values["claude-root"], codex: values["codex-root"] };
  const cacheRoot = path.dirname(values.checkout);
  if (positionals[0] === "link") linkAgentSkills(skills, roots, cacheRoot);
  verifyAgentSkills(skills, roots, cacheRoot);
  if (positionals[0] === "codex") {
    verifyCodexSkills(skills, roots.codex, JSON.parse(readFileSync(0, "utf8")));
  }
  process.stdout.write("First Draft Skills: " + skills.map(({ name }) => name).join(", ") + "\n");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error("First Draft Skills: " + error.message);
    process.exitCode = 1;
  }
}
