# AGENTS.md — First Draft Drawing Board

This repository root is a pre-compilation workspace. Help the user describe one application and maintain its current
Foundation Plan through the installed `create-full-stack-app` Skill. A generated Rails Foundation may later appear
under the ignored `application/` directory; keep its source and commands within that directory rather than mixing
them into the Drawing Board root.
A plain request such as "Make me an app that tracks my inventory" is enough to begin; do not require the user to
name the Skill or translate the request into a command.

## Working boundary

- Follow the installed Skill for interviewing, Plan structure, validation, submission, Compilation, and recovery.
- The current candidate is `.firstdraft/foundation-plan.json`. Its sibling `state.json` is private CLI concurrency
  state: never print, paste, commit, edit as Plan content, or expose it to another service.
- `.firstdraft/` is deliberately ignored by Git. Review the current Plan directly; do not infer its state from a
  Git diff.
- `application/` is deliberately ignored by the Drawing Board. When present, it is the generated Rails Foundation;
  run `bin/setup`, `bin/dev`, Rails, and application tests from there. The root `bin/` remains Drawing Board tooling.
  Direct-download output has no nested Git repository; run root `script/initialize-application` once before entering
  it so Git-sensitive application checks cannot resolve to the enclosing Drawing Board repository.
- Use `bin/firstdraft` for every First Draft command. When the installed Skill shows `firstdraft ...`, pass those
  same arguments to this repository wrapper. It loads the ignored `.env`, requires staging, and launches the exact
  pinned standalone CLI for both Claude and Codex. Do not bypass it, call the service with improvised HTTP, or
  install another CLI version. If Codex's sandbox blocks the expected staging request, request approval for that
  exact wrapper command; do not work around the sandbox or broaden network access.
- Setup creates `.env` from `.env.example` without overwriting it. The user pastes the staging First Draft token
  there once. Never read, print, edit, or commit `.env`; do not ask for `/plugin` configuration, Codespaces secrets,
  shell exports, or a GitHub PAT. Use `bin/agent-doctor --installation-only` for installation diagnostics and the
  full `bin/agent-doctor` to add validation of the shared wrapper and `.env` without printing the token.

## Collaboration and credentials

- Keep one agent as the Plan writer at a time. The other agent may perform a read-only review with
  `bin/review-plan-with-claude` or `bin/review-plan-with-codex`.
- Never print, log, commit, or request a First Draft token in chat. The local `.env` is agent-readable development
  credential delivery, not isolation from either agent; `bin/agent-doctor` reports presence only.
- Never request a GitHub personal access token. Publication uses the GitHub account already connected to First Draft
  and creates a fresh private repository, not a branch or pull request in this Drawing Board.
- Do not publish or release packages from this repository.
- After Compile succeeds, report the validated private GitHub URL and route the user to the generated repository's
  `.firstdraft/submitted-foundation-plan.json` and `.firstdraft/gaps.json`. Continue only in a separate checkout when
  the user asks.

When changing the Drawing Board template itself, read `CONTRIBUTING.md` and run `script/check`.
