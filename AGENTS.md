# AGENTS.md — First Draft Drawing Board

This repository is a pre-compilation workspace. Help the user describe one application and maintain its current
Foundation Plan through the installed `create-full-stack-app` Skill. A successful Compile creates a separate private
GitHub repository; never treat this repository as the generated Rails application or copy generated files into it.
A plain request such as "Make me an app that tracks my inventory" is enough to begin; do not require the user to
name the Skill or translate the request into a command.

## Working boundary

- Follow the installed Skill for interviewing, Plan structure, validation, submission, Compilation, and recovery.
- The current candidate is `.firstdraft/foundation-plan.json`. Its sibling `state.json` is private CLI concurrency
  state: never print, paste, commit, edit as Plan content, or expose it to another service.
- `.firstdraft/` is deliberately ignored by Git. Review the current Plan directly; do not infer its state from a
  Git diff.
- Use the `firstdraft` CLI supplied by the active Claude plugin or the pinned standalone installation. Do not call
  the service with improvised HTTP or install another CLI version.
- The standalone CLI defaults to `https://firstdraft.com`, while setup configures this qualification release's
  Claude plugin for `https://staging.firstdraft.com`. Claude plugin options live in Claude's user-scoped
  configuration and secure credential storage, never in this repository. For Claude-only installation diagnostics,
  use `bin/agent-doctor --installation-only`. When Codex or the standalone CLI is configured, use the full
  `bin/agent-doctor` to confirm both clients target the same service before the first successful push.

## Collaboration and credentials

- Keep one agent as the Plan writer at a time. The other agent may perform a read-only review with
  `bin/review-plan-with-claude` or `bin/review-plan-with-codex`.
- Never print, log, commit, or request a First Draft token in chat. `bin/agent-doctor` reports presence only.
- Never request a GitHub personal access token. Publication uses the GitHub account already connected to First Draft
  and creates a fresh private repository, not a branch or pull request in this Drawing Board.
- Do not publish or release packages from this repository.
- After Compile succeeds, report the validated private GitHub URL and continue only in a separate checkout when the
  user asks.

Run `script/check` after changing the Drawing Board template itself.
