# Direct Compilation in the Drawing Board workspace

## Goal

Let an agent author a Foundation Plan in a Drawing Board Codespace, compile it into `./application`, and continue
developing and testing the generated Rails Foundation in that same Codespace. This is an additive path. GitHub
remains the authentication provider, and the existing GitHub Publication flow remains available for callers that
want a separate repository.

The first useful slice is `./application`. Compiling into the Drawing Board repository root is a later packet after
the nested flow has been used and evaluated.

## Packet 1: direct artifact output in the CLI

Exact implementation candidate before this document:

- repository: `firstdraft/cli`;
- base: `a251df7870491d5b9bdc390c27373933563f99fd`;
- reviewed head: `89ca49b3046ae86e540886868887eb0e60970ad5`;
- integrated main: `d38ef3e54a6476b3a91f22a17fe7bd47aa6d6d68`; and
- tree-identical result: `e62ee3ff1fb6d188c5d2c5a6e5e0efd50b40245f`.

`firstdraft plan compile --output <absent-directory>` is a distinct execution mode:

1. Preflight the explicit output path before any network mutation. The target must be absent beneath an existing,
   real parent directory.
2. Push the exact Plan and wait for the matching valid Analysis using the current Plan flow.
3. Re-read local state and exact Plan bytes before starting Compilation.
4. Send one conditional, bodyless `POST` to the existing Service Compilation endpoint. Do not retry an ambiguous
   start.
5. Poll only the returned retained Compilation identity.
6. Fetch and verify the existing Compilation artifact contract.
7. Materialize exact files and modes into a sibling temporary directory, verify the tree, recheck that the target
   remains absent, and atomically rename it into place. Remove the task-owned staging directory on every
   pre-rename failure.

Artifact extraction accepts only relative ASCII path components and regular files with canonical `0644` or `0755`
modes. It rejects `.`, `..`, `.git`, symlinks, special files, duplicate paths, digest mismatches, and any file not
declared by the verified manifest. Verification re-reads the staged tree before the rename.

Once the Service has returned a validated Compilation identity, every later status, artifact, or local
materialization failure must retain that identity in its structured error. An ambiguous start (including a
validated timeout or server problem response) reports that the outcome is unknown and never sends a second start;
the current Service has no collection read or idempotency key that can recover a Compilation whose response was
lost before its identity reached the client. The first packet therefore stops explicitly and does not claim
automated recovery for that rare path. A future Service packet may add a client-generated idempotency key or an
equivalent exact lookup; until then, neither an agent nor the CLI may turn an unknown outcome into another Compile.

This mode performs no GitHub Publication, formatter, repair, merge, or Git initialization. It creates no Service
API or artifact format. Without `--output`, `firstdraft plan compile` retains its current GitHub Publication
behavior and URL-only success output. CLI tests exercise that zero-flag route, and its exact-head hosted matrix owns
the regression proof; packet 3 does not create a throwaway Publication merely to repeat that unit of evidence.

The direct mode is noninteractive. Structured failures tell an agent whether the path, Plan, Analysis, Compilation,
artifact, or materialization failed.

## Packet 2: one Drawing Board Dev Container for both phases

Exact implementation candidate before this document:

- repository: `firstdraft/drawing-board`;
- base: `0434aa330c51e1771c24b61a22dd8096c614e1d7`;
- head: `5788de045d2f39842b7b3d692620aa00d2efe32b`; and
- tree: `9a0c52d2ed8bcbe5c13bc22245ffb85c0aca0f11`.

Drawing Board uses Compose and reuses the generated Foundation runtime instead of maintaining a second Rails
environment:

- the active Rails Ruby 4.0.5 image and Dockerfile shape;
- Node 24.18.0;
- PostgreSQL 18 with the generated parent-volume topology and health gate;
- Selenium and the generated DB/Capybara environment;
- ports 3000 and 5432; and
- the same noninteractive toolchain PATH.

Drawing Board-specific state remains its workspace root, persistent agent homes, and agent installation. The parent
repository ignores `/application/`.

The artifact intentionally contains no `.git`. A nested app would otherwise let Git-sensitive generated checks
discover the parent Drawing Board repository. Drawing Board therefore owns `script/initialize-application`, which
accepts a safe application path (default `application`), requires a directly materialized application, creates a
nested `main` repository and parentless initial commit, and proves that the committed path/blob/mode inventory equals
the on-disk application tree at initialization time. It does not re-verify that tree against a retained Service
manifest. Running it before application setup or user edits is a workflow rule; its ignored-state hard stop catches
setup byproducts but cannot detect an arbitrary edit to a tracked generated file. It honors the generated
`.gitignore` and force-stages only the two exact current artifact-owned files under `.firstdraft`. Any other ignored,
derived, or local path is a safe hard stop rather than an invitation to commit `.env`, keys, dependency trees, or an
unknown future artifact file. It does not lint or normalize the generated bytes. The CLI remains transport-pure.

`script/application-smoke` verifies the real nested repository before dependency, database, or server work, then
runs generated setup, PostgreSQL readiness, and the complete generated `CI=1 bin/ci`. It does not patch generated
bytes. Drawing Board's ordinary hosted contract executes a hermetic initializer fixture, including ignored
`.firstdraft` bytes, executable modes, trailing whitespace, safe-path rejection, and hostile ambient Git state.

## Packet 2.5: release and authoring bridge

Packets 1 and 2 cannot form a fresh user journey merely as source branches. The coherent delivery tuple is:

1. Integrate the direct-output CLI as backward-compatible `0.2.1`, retaining zero-flag Publication.
2. Update the authoring Skill to `0.2.1`, require exact CLI `0.2.1`, and teach two separate completion modes:
   direct `firstdraft plan compile --output ./application` in a shared workspace, or zero-flag GitHub Publication.
   For Drawing Board direct output, the Skill issues the relative path only from the physical workspace root. The
   agent selects and states the mode before the final Plan/GapSet approval, so approval covers the intended local or
   external effect; it never switches modes to recover from an ambiguous start.
3. After explicit release authorization, publish the exact reviewed CLI `0.2.1` package under the `next` dist-tag
   and verify the immutable registry artifact and Git provenance.
4. Confirm that staging advertises the API contract required by the pinned CLI. Update Drawing Board's exact CLI
   version and Skills revision together, then run its real Dev Container contract. In that same packet, update
   Drawing Board's README, `AGENTS.md`, `CONTRIBUTING.md`, setup banner, and this plan's status lines. The README needs
   two explicit completion branches, including `script/initialize-application` for direct output, rather than a
   wording-only change; zero-flag Publication remains the separate-repository branch.

The Skill preserves exact Plan and GapSet review, conditional state, credentials, retained-identity recovery, and
the explicit stop on an ambiguous start with no retained identity; it routes transport and container details to
their owning tools rather than copying them. Drawing Board continues to install Skills from an exact Git revision,
so plugin publication or catalog promotion is not required for this packet. CLI `latest`, plugin publication, and
catalog promotion remain separate release choices.

## Packet 3: one real non-prebuilt Codespace journey

After packets 1 and 2 are integrated into a coherent candidate tuple, confirm that staging serves the API contract
required by that tuple, then exercise a newly created Drawing Board Codespace without relying on a prebuild:

1. Confirm the Drawing Board authoring/agent setup still works, the pinned Skill advertises both completion modes,
   and the active agent can locate the retained design context without being retaught it in the test prompt.
2. Author or load one reviewed Foundation Plan and configure an approved staging API token.
3. From the physical Drawing Board workspace root, record the current directory and run
   `firstdraft plan compile --output ./application`. The Skill must not issue that relative path from inside the
   generated application or another directory.
4. Prove that no GitHub Publication or generated-repository creation occurred by retaining the CLI request sequence,
   the Project's Publication route before and after, and the GitHub repository inventory before and after.
5. Run `script/initialize-application application`.
6. From the Drawing Board root, run `script/application-smoke` to prove nested-Git isolation, exact Ruby/Node pins,
   PostgreSQL compatibility, readiness, and the complete generated CI. Then enter `application`, boot `bin/dev`,
   and verify the app through the forwarded web port in a real browser.
7. Ask the same agent to explain one Plan decision from the retained design context and make one bounded application
   change that follows it, then run a focused generated-app check.

Retain exact Service, CLI, Drawing Board, Plan, GapSet, artifact, generated tree, nested initial commit, container,
database, smoke output, and browser coordinates. If the Compilation start has an unknown outcome without a retained
identity, abort the qualification, preserve its Project/request/response/timing evidence, and ask a Service operator
to reconcile it; do not retry, switch modes, or create a replacement Project as an improvised recovery. Stop the
Codespace after proof or a recorded abort. Do not treat a local Docker rehearsal as the Codespace observation.

## Later packet: compile into an existing root

`firstdraft plan compile --output .` is deliberately not part of the first slice. It should work in an arbitrary
directory rather than recognize Drawing Board specially. Because `.` already exists, the later noninteractive
contract needs an explicit relocation option, provisionally:

```sh
firstdraft plan compile --output . --move-existing-to design
```

The intended result is the generated Foundation at the working root and preexisting non-secret design materials
under `./design`. If the root is already a Git repository, its history is retained. If it is not, the later packet
must explicitly choose and document whether root initialization belongs in the command; the implementation may not
silently assume that `.git/info/exclude` exists or manufacture a parentless repository without that decision.

Before moving anything, the transaction inventories every existing path's physical location and
tracked/staged/untracked/ignored state, including the applicable repository `.gitignore` files,
`.git/info/exclude`, and configured global excludes. It carries forward every exclusion that protects a moved path
before relocation and never automatically stages a path that was previously untracked. In the Drawing Board
instance, `.env`, `.firstdraft/state.json`, and other credential or concurrency state must remain ignored and must
never be staged or committed. The private candidate at `design/.firstdraft/foundation-plan.json` also remains
deliberately untracked; the generated root `.firstdraft/submitted-foundation-plan.json` is the tracked exact Plan
record. The generated root `.gitignore` and both generated artifact-owned `.firstdraft` files remain exact.

Any later root-mode write to `.git/info/exclude` or other existing Git metadata is an explicit, journaled part of
the relocation transaction. A failure that leaves any relocated bytes on disk retains the protective exclusions;
the transaction may remove them only after a full rollback restores both the original bytes and their original
ignore sources. A recoverable partial result reports which protections remain. The command must also define
collisions for `.firstdraft`, `.gitignore`, `AGENTS.md`, and other artifact paths; reject nested or linked paths, an
existing `design` destination, and an unsafe partial relocation; and preserve both original design bytes and exact
generated bytes.

Qualification must prove that root Git sees previously tracked non-secret design paths at their moved names and the
generated Foundation paths, that previously untracked paths were not swept into the index, and that every
credential/private-state path remains ignored and untracked with a clean credential scan. There is no interactive
prompt in this agent-first phase.

This later packet replaces neither `--output ./application` nor GitHub Publication. Its detailed filesystem
transaction should be designed only after the nested flow is exercised.

## Ownership and sequencing

- Service owns Compilation lifecycle and artifact bytes; no Service change is needed for packets 1 or 2.
- That does not remove release coupling: a generated artifact file-set, ignore-rule, or mode change, or a generated
  Ruby/Node/PostgreSQL bump, requires a coordinated Drawing Board update to its `.firstdraft` allowlist, exact-byte
  fixture, container pins, and smoke assertions in the same candidate.
- CLI owns the direct mode, output-path validation, polling, artifact verification, and exact materialization. The
  later root mode deliberately widens that owner into relocation and existing Git metadata; its transaction and
  rollback contract require a separate review after packet 3 rather than inheriting packet 1's approval.
- Drawing Board owns its combined Dev Container and nested-repository initialization.
- The authoring Skill teaches the coherent command sequence only after the CLI contract lands; it does not duplicate
  detailed transport or container contracts.
- GitHub authentication and the existing Publication path stay intact.
- Broad Foundation Plan realization gaps and the documentation/website audit are separate work lanes.

Land packet 1 and packet 2 independently after their repository checks and reviews. Complete packet 2.5 and prove
its exact released/pinned tuple before packet 3. Use packet 3 to decide whether the root-output packet is still
valuable and to refine its relocation contract.

## Review questions

1. Does the mode split preserve the no-flag Publication contract while making direct Compilation genuinely
   publication-free?
2. Is Drawing Board the correct owner for nested Git initialization, or should another integration layer own it?
3. Does reusing the generated runtime create any hidden coupling or omit a requirement needed by either authoring
   or generated development?
4. Are the absent-directory and later root-relocation boundaries safe, understandable, and proportional for an
   agent-first pre-alpha workflow?
5. Is the three-packet landing order sufficient to prevent a false end-to-end claim or incompatible candidate
   tuple?
