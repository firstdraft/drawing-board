#!/usr/bin/env bash
# open.sh
#
# Opens a link in the attendee's browser from the Codespace. VS Code's $BROWSER helper asks the
# browser tab (or VS Code Desktop) connected to this Codespace to open it; VS Code may first ask
# "Do you want Code to open the external website?", and the attendee chooses Open.
# Installed to ~/.workshop/open.sh by .devcontainer/setup-agents; used by the sign-in skill,
# login.sh and the app-session notes.
#
#   bash open.sh <link>     prints OPENED or NOT OPENED

set -uo pipefail

link=${1:?usage: open.sh <link>}
# login.sh hides $BROWSER from the sign-in commands and passes the real one here.
browser=${WORKSHOP_BROWSER-${BROWSER:-}}

if [ -n "$browser" ] && [ "$browser" != /bin/false ] && "$browser" "$link" >/dev/null 2>&1; then
    echo "OPENED: $link (in a new browser tab; if VS Code asks to open the external website, choose Open)"
else
    echo "NOT OPENED: the attendee must click this link: $link"
fi
