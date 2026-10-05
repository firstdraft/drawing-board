import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

// Writes the workshop's app-session notes into user-level agent instructions between these
// markers, replacing an earlier copy and leaving everything else in each file alone.
const start = "<!-- drawing-board-workshop: start -->";
const end = "<!-- drawing-board-workshop: end -->";

const [source, ...targets] = process.argv.slice(2);
if (!source || targets.length === 0) {
  throw new Error("usage: workshop-notes.mjs NOTES TARGET...");
}
const notes = readFileSync(source, "utf8").trimEnd();

for (const target of targets) {
  let existing = "";
  try {
    existing = readFileSync(target, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const lines = existing.split("\n");
  const first = lines.indexOf(start);
  const last = lines.indexOf(end);
  if ((first === -1) !== (last === -1) || last < first) {
    throw new Error(`${target} has an incomplete Drawing Board workshop block; repair or remove it.`);
  }
  const kept = first === -1 ? existing : [...lines.slice(0, first), ...lines.slice(last + 1)].join("\n");
  const prefix = kept.trimEnd();
  const content = `${prefix}${prefix ? "\n\n" : ""}${start}\n${notes}\n${end}\n`;
  mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.workshop-${process.pid}`;
  writeFileSync(temporary, content, { mode: 0o644 });
  renameSync(temporary, target);
}
