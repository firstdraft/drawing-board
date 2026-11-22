#!/usr/bin/env bash
# firstdraft.sh
#
# Runs the CLI inside the First Draft plugin from a plain shell, such as the Codespace's terminal
# or these helpers. The plugin is the only First Draft install, and its directory changes with each
# plugin update, so this asks Claude Code where the plugin is installed now. In an agent session,
# the First Draft Skill runs the same CLI through its own helper.
# Installed to ~/.workshop/firstdraft.sh by .devcontainer/setup-agents.
#
#   bash firstdraft.sh <arguments>    for example: bash firstdraft.sh start

set -euo pipefail

export PATH="$HOME/.local/bin:$PATH"

# A plugin from a local catalog, which maintainers use to try a plugin, loads in place from
# readFromFolder rather than from its installPath.
plugin_root=$(claude plugin list --json |
    jq -r 'first(.[] | select(.id == "firstdraft@firstdraft-skills") | .readFromFolder // .installPath) // empty')
if [ -z "$plugin_root" ] || [ ! -x "$plugin_root/bin/firstdraft" ]; then
    echo "First Draft CLI is unavailable: Claude Code has no First Draft plugin installed. Rerun .devcontainer/setup-agents." >&2
    exit 127
fi
exec "$plugin_root/bin/firstdraft" "$@"
