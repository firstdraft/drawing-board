#!/usr/bin/env node

import childProcess from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";

const receiptPath = ".devcontainer/image/receipt.json";
const receipt = JSON.parse(fs.readFileSync(receiptPath, "utf8"));
const requireSourceCommit = process.env.FIRSTDRAFT_REQUIRE_IMAGE_SOURCE_COMMIT;
const sha256Pattern = /^sha256:[0-9a-f]{64}$/;
const gitObjectPattern = /^[0-9a-f]{40}$/;
const required = (condition, message) => {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
};

required(receipt.format === "firstdraft.drawing-board-development-image/1", "The development-image receipt format changed.");
required([undefined, "0", "1"].includes(requireSourceCommit), "FIRSTDRAFT_REQUIRE_IMAGE_SOURCE_COMMIT must be 0, 1, or unset.");
required(receipt.source?.repository === "firstdraft/drawing-board", "The development-image receipt must name its source repository.");
required(gitObjectPattern.test(receipt.source?.commit ?? ""), "The development-image receipt must name one exact source commit.");
required(gitObjectPattern.test(receipt.source?.tree ?? ""), "The development-image receipt must name one exact source tree.");
required(receipt.source?.tag === `devcontainer-image-candidate-safe-${receipt.source.commit.slice(0, 7)}`, "The development-image tag must identify its exact source commit.");

const expectedInputPaths = [
  ".devcontainer/Dockerfile",
  ".devcontainer/image/devcontainer.json",
  ".devcontainer/image/devcontainer-lock.json",
  ".devcontainer/workspace-init",
  ".github/workflows/devcontainer-image.yml",
  "script/devcontainer-image-smoke",
].sort();
required(JSON.stringify(Object.keys(receipt.inputs ?? {}).sort()) === JSON.stringify(expectedInputPaths), "The development-image receipt must bind the exact reviewed source inputs.");
for (const path of expectedInputPaths) {
  const actual = crypto.createHash("sha256").update(fs.readFileSync(path)).digest("hex");
  required(actual === receipt.inputs[path], `The development-image receipt does not match ${path}.`);
}

required(receipt.publication?.package === "ghcr.io/firstdraft/drawing-board-workspace", "The receipt must use the corrected workspace-image package.");
required(Number.isSafeInteger(receipt.publication?.workflow_run) && receipt.publication.workflow_run > 0, "The receipt must bind one workflow run.");
required(Number.isSafeInteger(receipt.publication?.build_job) && receipt.publication.build_job > 0, "The receipt must bind one build job.");
required(Number.isSafeInteger(receipt.publication?.verify_job) && receipt.publication.verify_job > 0, "The receipt must bind one verification job.");
required(sha256Pattern.test(receipt.publication?.manifest ?? ""), "The receipt must bind one immutable image index.");
const platformDigests = receipt.publication?.platforms ?? {};
required(JSON.stringify(Object.keys(platformDigests).sort()) === JSON.stringify(["linux/amd64", "linux/arm64"]), "The receipt must bind exactly the supported image platforms.");
for (const digest of Object.values(platformDigests)) required(sha256Pattern.test(digest), "Every platform must use an immutable image digest.");
required(new Set([receipt.publication.manifest, ...Object.values(platformDigests)]).size === 3, "The image index and platform manifests must be distinct.");
required(["private", "public"].includes(receipt.publication?.visibility), "The receipt must name the observed package visibility.");
required(["not_yet_observed", "passed"].includes(receipt.publication?.anonymous_pull), "The receipt must name the anonymous-pull observation state.");
required(["not_yet_observed", "passed"].includes(receipt.publication?.comparison_codespace), "The receipt must name the comparison-Codespace observation state.");

const platforms = receipt.verification?.platforms ?? {};
required(platforms["linux/amd64"]?.layers_contain_no_ssh_host_keys === true, "The amd64 layer census must be retained.");
required(platforms["linux/amd64"]?.locked_feature_ids_present_once_in_metadata === true, "The amd64 locked-Feature-ID metadata check must be retained.");
required(platforms["linux/amd64"]?.image_rest_contains_no_ssh_host_keys === true, "The amd64 image-rest check must be retained.");
required(platforms["linux/amd64"]?.no_command_stays_running === true, "The amd64 no-command entrypoint check must be retained.");
required(platforms["linux/amd64"]?.two_started_containers_have_distinct_ed25519_host_keys === true, "The amd64 per-container host-key check must be retained.");
required(/^18\.\d+$/.test(platforms["linux/amd64"]?.postgresql_client ?? ""), "The amd64 PostgreSQL client receipt must retain the observed 18.x release.");
required(platforms["linux/amd64"]?.psql_major === 18 && platforms["linux/amd64"]?.pg_dump_major === 18, "The amd64 PostgreSQL client tools must use major 18.");
required(platforms["linux/arm64"]?.layers_contain_no_ssh_host_keys === true, "The arm64 layer census must be retained.");
required(platforms["linux/arm64"]?.locked_feature_ids_present_once_in_metadata === true, "The arm64 locked-Feature-ID metadata check must be retained.");
required(["not_observed", "passed"].includes(platforms["linux/arm64"]?.runtime), "The receipt must name the arm64 runtime-observation state.");
required(/^[0-9a-f]{64}$/.test(receipt.verification?.workflow_log_sha256 ?? ""), "The receipt must bind the exact workflow log.");

required(receipt.rejected_predecessor?.required_visibility === "private_forever", "The rejected package must remain permanently private.");
const rejectedPackage = receipt.rejected_predecessor?.package;
const expectedRejectedPackage = ["ghcr.io/firstdraft", "drawing-board-devcontainer"].join("/");
required(rejectedPackage === expectedRejectedPackage, "The receipt must name the exact rejected package.");
const trackedPaths = childProcess.execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
for (const path of trackedPaths) {
  if (path === receiptPath || !fs.statSync(path).isFile()) continue;
  required(!fs.readFileSync(path).includes(rejectedPackage), `The rejected package must not be consumed from ${path}.`);
}

const sourceObject = childProcess.spawnSync("git", ["cat-file", "-e", `${receipt.source.commit}^{commit}`], { encoding: "utf8" });
if (sourceObject.status === 0) {
  const actualTree = childProcess.execFileSync("git", ["show", "-s", "--format=%T", receipt.source.commit], { encoding: "utf8" }).trim();
  required(actualTree === receipt.source.tree, "The development-image source tree does not match its commit.");
  for (const path of expectedInputPaths) {
    const sourcePath = `${receipt.source.commit}:${path}`;
    const sourceEntry = childProcess.spawnSync("git", ["cat-file", "-e", sourcePath]);
    required(sourceEntry.status === 0, `The development-image source commit does not contain ${path}.`);
    const sourceBytes = childProcess.execFileSync("git", ["show", sourcePath]);
    const sourceSha256 = crypto.createHash("sha256").update(sourceBytes).digest("hex");
    required(sourceSha256 === receipt.inputs[path], `The development-image receipt does not match ${path} at its source commit.`);
  }
} else {
  required(requireSourceCommit !== "1", "The development-image source commit is required but absent from this checkout.");
}

console.log("Development image receipt contract passed.");
