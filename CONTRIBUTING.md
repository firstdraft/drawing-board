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
- the same container carries the current generated Foundation's Ruby and Node toolchain plus healthy PostgreSQL and
  Selenium services, so an ignored application under `./application` can be developed without a second Codespace.

The template does not commit generated application source. `application/` is ignored local output; its Rails source
remains distinct from the Drawing Board even though both use one container. The pinned CLI and Skill select direct
materialization into the absent `application/` directory as this template's default completion mode. Zero-flag
GitHub Publication remains a separate explicit mode. The accepted cross-repository sequence and its safety
boundaries live in
[DIRECT_COMPILATION_PLAN.md](DIRECT_COMPILATION_PLAN.md).

## Repository map

| Path | Responsibility |
|---|---|
| `.devcontainer/Dockerfile` | Ruby runtime shared with the current generated Foundation |
| `.devcontainer/compose.yaml` | Drawing Board, PostgreSQL, and Selenium service lifecycle |
| `.devcontainer/devcontainer.json` | Codespace Features, lifecycle, volumes, ports, and workspace environment |
| `.devcontainer/agent-versions.env` | Exact Claude, Codex, CLI, and Skills pins |
| `.devcontainer/setup-agents` | Idempotent installation and Skill linking |
| `.env.example` | Non-secret staging configuration copied to ignored `.env` |
| `bin/firstdraft` | Shared credential-loading and origin-pinning CLI wrapper |
| `bin/agent-doctor` | Installation and credential diagnostics without token disclosure |
| `bin/review-plan-with-*` | Optional read-only review by the other installed agent |
| `script/check` | Fast source, pin, wrapper, and credential contracts |
| `script/devcontainer-smoke` | Runtime smoke executed inside the built Dev Container |
| `script/initialize-application` | Parentless nested Git initialization for direct-download output |
| `script/application-smoke` | Setup, PostgreSQL, readiness, and full CI proof for a generated `./application` |

The initializer follows the generated application's own ignore rules. The only artifact-owned paths allowed to
bypass those rules are `.firstdraft/submitted-foundation-plan.json` and `.firstdraft/gaps.json`. Any other ignored
path is preserved and stops initialization; a future generated ignored file must update this narrow allowlist and
its exact-byte fixture in the same coordinated release. Canonical `0644` and `0755` modes are part of the generated
artifact contract; a mismatch requires a fresh compile into an absent directory rather than local mode repair.

## Work on the template

Create a branch from current `main`, make the smallest coherent change, and run:

```sh
script/check
```

Run the check through the pinned toolchain or inside the Dev Container; it requires the pinned Ruby and Node on
`PATH`.

Changes to Dev Container setup, Features, agent installation, pins, or lifecycle also require the smoke inside the
built container. The simplest manual route is to open a Codespace on the branch and run:

```sh
script/devcontainer-smoke
```

GitHub Actions builds the Dev Container and runs both checks there for every pull request. A change to an exact pin
should name the compatible upstream revision or package and preserve the same version in every checked consumer.

When changing a Dev Container Feature, let the current Dev Container CLI regenerate
`.devcontainer/devcontainer-lock.json`. Review the resolved version and digest rather than editing the lock by hand.

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
the README and verify the complete template-to-generated-repository journey before landing it.
