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
| `script/devcontainer-image-smoke` | Default command, locked Feature-ID, maintained SSH lifecycle, and PostgreSQL checks |
| `script/devcontainer-smoke` | Runtime smoke executed inside the built Dev Container |
| `script/refresh-codespaces-private-port` | Safe post-attach refresh for the private Rails forwarded-port registration |
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
be started by Codespaces. Image-layer host keys supplied by the maintained Feature are accepted for this disposable,
GitHub-tunneled development environment; client authentication remains key-only and root login remains denied. This
supersedes the per-container-host-key experiment, but does not approve consumption of its quarantined package.

The candidate workflow does not move a stable or `latest` tag. The image receipt binds the source revision, source
tree, workflow run, platforms, and manifest digest consumed by the template. The current receipt records anonymous
access as passed and leaves the comparison Codespace unobserved until it actually runs. The Docker-outside-of-Docker
Feature reaches the host daemon: that host is a disposable VM in Codespaces, but it is the developer's own machine
on the supported local path. Do not run an untrusted workspace or agent with that socket mounted. The workspace
starts only its exact Compose-owned Selenium service when `script/application-smoke` or `script/selenium start`
requests browser proof.
The comparison Codespace must also prove that `script/selenium` can resolve the Compose project from that runtime's
container identity; the current public-image receipt does not claim that observation or a speculative fallback.

The runtime Dev Container opts the remote extension host into Node's supported `navigator` global through
`extensions.supportNodeGlobalNavigator`. A 2026-09-01 browser-Codespaces observation found VS Code 1.133.0 and the
GitHub Codespaces extension 1.18.16 loading Axios and Microsoft Dev Tunnels while VS Code's migration guard still
replaced that global with a throwing getter and raised `PendingMigrationError`. The private forwarded URL then
returned 502 before a healthy Rails server received the request. This is the conventional VS Code migration setting
documented in the
[VS Code 1.101 release notes](https://code.visualstudio.com/updates/v1_101). The exact VS Code 1.133.0 source
[registers it at the default window scope](https://github.com/microsoft/vscode/blob/a5b500951314efd502d07465bd138dfbd714a960/src/vs/workbench/contrib/extensions/browser/extensions.contribution.ts#L363-L367),
which accepts remote settings, and the
[remote server turns it into the extension host's `--supportGlobalNavigator` argument](https://github.com/microsoft/vscode/blob/a5b500951314efd502d07465bd138dfbd714a960/src/vs/server/node/extensionHostConnection.ts#L283-L290).
Dev Container settings are applied to the remote Codespaces machine as described by
[GitHub's Dev Container documentation](https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration/introduction-to-dev-containers).
A fresh Codespace proved that the setting supplies `--supportGlobalNavigator` and removes the migration error, but
the unchanged private forwarded URL still returned a relay-level 502. The setting remains because it closes that
independently observed extension-host failure; it is not the tunnel repair.

The repository's long-running student Rails template supplied the missing control: at exact revision
[`7bfb0c17`](https://github.com/appdev-projects/rails-8-template/blob/7bfb0c173b13203dbbae612ea410b893d041d240/bin/fix-ports#L1-L9),
its post-attach hook changes port 3000 from public back to private specifically to repair Codespaces 502 responses.
Repeating that transition once in the fresh Drawing Board Codespace changed the unchanged request from relay 502
with no Rails log to Rails 403 with an exact `Blocked hosts` log. `script/refresh-codespaces-private-port` performs
the same registration refresh on every Codespaces attach, but only while port 3000 has no listener. Codespaces can
remove that unbound registration between the public and private commands; the script accepts only that exact
no-listener result, after which the next server started in the integrated terminal is forwarded privately by
default. It reports every other GitHub CLI error and fails instead of exposing an active application or hiding an
unexpected result. Lifecycle commands obtain the Codespace name and session-scoped `GITHUB_TOKEN` from Codespaces'
protected shared environment when they have not yet been exported into their process; they never print or persist
either value. GitHub documents
[`CODESPACES` and `CODESPACE_NAME`](https://docs.github.com/en/codespaces/developing-in-a-codespace/default-environment-variables-for-your-codespace)
as the runtime discriminator and
[private as the default forwarded-port visibility](https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace);
the current CLI's visibility command is the supported control surface. This is a containment for an observed
provider registration defect, not a custom tunnel or application workaround.

The repaired tunnel exposed the already-recorded generated Rails HostAuthorization boundary. Do not copy the
student template's broad `config.hosts.clear` or disabled origin check into Drawing Board. Generated-app host and
Origin handling remain target-owned follow-up work and require their own exact browser GET and state-changing POST
proof.

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
