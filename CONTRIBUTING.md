# Contributing to First Draft Drawing Board

Drawing Board is the template repository for the First Draft tester journey. Its README is deliberately written for
someone trying the product for the first time. This document owns the maintainer workflow and implementation map.

Agents changing the template should also read [AGENTS.md](AGENTS.md).

## Repository contract

A repository created from this template must provide one ready-to-use workspace for Claude or Codex:

- the Dev Container installs exact reviewed versions of both agents and the First Draft CLI;
- one exact Skills revision is linked into both agents;
- `.env` supplies the shared staging origin and token without entering Git;
- bare `firstdraft` on the Codespace PATH resolves to `bin/firstdraft`, and AGENTS.md routes Skill-issued commands
  through that wrapper; and
- the same container carries the current generated Foundation's Ruby and Node toolchain plus healthy PostgreSQL;
  generated browser tests start the pinned Selenium service on demand, so an ignored application under
  `./application` can be developed without a second Codespace.

The template does not commit generated application source. `application/` is ignored local output; its Rails source
remains distinct from the Drawing Board even though both use one container. The pinned CLI and Skill make direct
materialization available, and Drawing Board's `AGENTS.md` selects the absent `application/` directory as this
template's default completion mode. Zero-flag GitHub Publication remains a separate explicit mode. The accepted
cross-repository sequence and its safety boundaries live in
[DIRECT_COMPILATION_PLAN.md](DIRECT_COMPILATION_PLAN.md).

## Repository map

| Path | Responsibility |
|---|---|
| `.devcontainer/Dockerfile` | Source for the published development image shared with generated Foundations |
| `.devcontainer/image/` | Image-only Features, lockfile, and exact published-image receipt |
| `.devcontainer/compose.yaml` | Drawing Board, default PostgreSQL, and on-demand Selenium lifecycle |
| `.devcontainer/devcontainer.json` | Codespace services, lifecycle, volumes, ports, and workspace environment |
| `.devcontainer/agent-versions.env` | Exact Claude, Codex, CLI, and Skills pins |
| `.devcontainer/setup-agents` | Idempotent installation and Skill linking |
| `.env.example` | Non-secret staging configuration copied to ignored `.env` |
| `bin/firstdraft` | Shared credential-loading and origin-pinning CLI wrapper |
| `bin/agent-doctor` | Installation and credential diagnostics without token disclosure |
| `bin/review-plan-with-*` | Optional read-only review by the other installed agent |
| `script/check` | Fast source, pin, wrapper, and credential contracts |
| `script/check-depth-one` | Receipt validation in a real one-commit checkout without image-source history |
| `script/check-image-receipt.mjs` | Exact source, publication, platform, and rejected-package receipt contract |
| `script/devcontainer-image-smoke` | Locked Feature-ID, maintained SSH lifecycle, and PostgreSQL checks |
| `script/devcontainer-smoke` | Runtime smoke executed inside the built Dev Container |
| `script/initialize-application` | Parentless nested Git initialization for direct-download output |
| `script/selenium` | On-demand Selenium start, status, and stop inside the Dev Container |
| `script/application-smoke` | Setup, PostgreSQL, readiness, and full CI proof for a generated `./application` |

The initializer follows the generated application's own ignore rules. The only artifact-owned paths allowed to
bypass those rules are `.firstdraft/submitted-foundation-plan.json` and `.firstdraft/gaps.json`. Any other ignored
path is preserved and stops initialization; a future generated ignored file must update this narrow allowlist and
its exact-byte fixture in the same coordinated release. Canonical `0644` and `0755` modes are part of the generated
artifact contract; a mismatch requires a fresh compile into an absent directory rather than local mode repair.
A mode mismatch aborts initialization before the nested repository exists. Preserve that directory under the
Drawing Board's ignored, bind-mounted `tmp/` before recompiling; never use `/tmp` or the container home, and never
delete or overwrite it to manufacture an absent destination.

## Work on the template

Create a branch from current `main`, make the smallest coherent change, and run:

```sh
script/check
```

Run the check through the pinned toolchain or inside the Dev Container; it requires the pinned Ruby and Node on
`PATH`.

Changes to Dev Container setup, image source, agent installation, pins, or lifecycle also require the smoke inside
the built container. The simplest manual route is to open a Codespace on the branch and run:

```sh
script/devcontainer-smoke
```

GitHub Actions authenticates to GHCR, starts the pinned Dev Container, runs the source and depth-one contracts, and
runs the template-root runtime smoke twice for every pull request. The generated-application branch of that smoke is
a separate qualification input because `./application` is absent from the template checkout. A change to an exact
pin should name the compatible upstream revision or package and preserve the same version in every checked consumer.

The current template consumes a public development image by immutable manifest digest. A credential-free manifest
request reproduced that exact multi-platform index, so ordinary template-derived Codespaces can pull it without
access to the First Draft organization. CI still authenticates with its job token, but that is not an availability
requirement. To update the image:

1. change `.devcontainer/Dockerfile` or `.devcontainer/image/devcontainer.json`;
2. let the current Dev Container CLI regenerate `.devcontainer/image/devcontainer-lock.json`, then review every
   resolved Feature version and digest rather than editing the lock by hand;
3. push one `devcontainer-image-candidate-safe-<short-sha>` tag to run the candidate-only image workflow;
4. verify both image platforms, then record the reviewed receipt and immutable digest;
5. prove a credential-free manifest read by immutable digest and update the receipt's observation; and
6. run the contracts, the built-container smoke twice, and one fresh non-prebuilt Codespace comparison before
   calling the successor digest qualified for the ordinary template.

The image uses the maintained `ghcr.io/devcontainers/features/sshd:1` Feature for the SSH server lifecycle expected
by Codespaces and keeps only the key-only, non-root policy in the Dockerfile. Do not replace the Feature entrypoint
with a custom OpenSSH startup script; the ordinary local image smoke is not proof that a different entrypoint will
be started by Codespaces.

The candidate workflow does not move a stable or `latest` tag. The image receipt binds the source revision, source
tree, workflow run, platforms, and manifest digest consumed by the template. The current receipt records anonymous
access as passed and leaves the comparison Codespace unobserved until it actually runs. The Docker-outside-of-Docker
Feature reaches the host daemon: that host is a disposable VM in Codespaces, but it is the developer's own machine
on the supported local path. Do not run an untrusted workspace or agent with that socket mounted. The workspace
starts only its exact Compose-owned Selenium service when `script/application-smoke` or `script/selenium start`
requests browser proof.
The comparison Codespace must also prove that `script/selenium` can resolve the Compose project from that runtime's
container identity; the current public-image receipt does not claim that observation or a speculative fallback.

## Credentials and external systems

Never commit a First Draft API token, GitHub token, agent credential, or generated `.env`. `script/check` scans the
repository for common credential shapes and verifies that `.env` remains ignored.

The shared ignored `.env` is the credential path for both agents; do not add agent-specific token configuration.
The template wrapper intentionally selects staging. Production defaults, GitHub Publication, and Service deployment
are owned by [firstdraft/firstdraft](https://github.com/firstdraft/firstdraft); Skill and plugin delivery are owned by
[firstdraft/skills](https://github.com/firstdraft/skills).

## Documentation

Keep [README.md](README.md) focused on the beginner journey. Put maintainer commands and implementation details here,
and keep agent-only guardrails in [AGENTS.md](AGENTS.md). If a workflow change affects what a tester must do, update
the README and verify the affected journey before landing it: template-to-`application/` for direct mode, or the
separate-repository journey for Publication. [DIRECT_COMPILATION_PLAN.md](DIRECT_COMPILATION_PLAN.md) owns the
current direct-journey acceptance steps and every explicitly unfinished step; do not call that journey complete
until those steps are observed.
