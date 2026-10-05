#!/usr/bin/env bash
# neon-key.sh
#
# Signs neonctl in with a Neon API key instead of its browser sign-in, without ever printing the
# key. neonctl's browser sign-in returns to 127.0.0.1 inside the Codespace, which a browser tab of
# VS Code for the Web cannot reach. The attendee creates a personal API key in the Neon console
# and pastes it into a private file in the editor; 'save' hands it to neonctl on stdin, and
# neonctl checks it and keeps it in ~/.config/neon/credentials.json (mode 600), the same file its
# browser sign-in uses.
# Installed to ~/.workshop/neon-key.sh by .devcontainer/setup-agents; used by the sign-in skill.
#
#   bash neon-key.sh open      create the private form and open it in the editor
#   bash neon-key.sh save      read the form; prints SAVED, NEXT or INVALID

set -uo pipefail

export PATH="$HOME/.local/bin:$PATH"
export BROWSER=/bin/false

WORKSHOP_DIR="$HOME/.workshop"
FORM_FILE="$WORKSHOP_DIR/neon-key.txt"
AGAIN='then run: bash ~/.workshop/neon-key.sh save'

open_form() {
    mkdir -p "$WORKSHOP_DIR" && chmod 700 "$WORKSHOP_DIR"
    if [ ! -f "$FORM_FILE" ]; then
        (umask 077 && printf '%s\n' \
            "# Paste your Neon API key after the = sign, then save this file (Ctrl+S, or Cmd+S on a Mac)." \
            "# Do not paste it into the chat. Your agent saves it for neonctl without showing it, then deletes this file." \
            "# Create the key in the Neon console: Account settings (in your account menu), API keys, Create new API key." \
            "# Neon shows the key only once." \
            "NEON_API_KEY=" > "$FORM_FILE") || { echo "[FAIL] could not write $FORM_FILE"; return 1; }
    fi
    if command -v code >/dev/null 2>&1 && code --reuse-window "$FORM_FILE" >/dev/null 2>&1; then
        echo "OPENED: $FORM_FILE is open in the editor. The attendee pastes the key after NEON_API_KEY= and saves the file, $AGAIN"
    else
        echo "NOT OPENED: the attendee opens it with File > Open File... and the path $FORM_FILE, pastes the key after NEON_API_KEY= and saves it, $AGAIN"
    fi
}

save() {
    local line key="" output
    [ -f "$FORM_FILE" ] || { echo "INVALID: there is no form to read. Run: bash ~/.workshop/neon-key.sh open"; return 1; }
    while IFS= read -r line || [ -n "$line" ]; do
        [[ $line =~ ^[[:space:]]*(export[[:space:]]+)?NEON_API_KEY[[:space:]]*=[[:space:]]*[\"\']?([^\"\'[:space:]]*) ]] || continue
        key=${BASH_REMATCH[2]}
    done < "$FORM_FILE"

    if [ -z "$key" ]; then
        echo "NEXT: the file has no key after NEON_API_KEY= yet. Ask the attendee to paste it and save the file, $AGAIN"
        return 1
    fi
    if ! [[ $key =~ ^[A-Za-z0-9_-]{20,}$ ]]; then
        echo "INVALID: that does not look like a whole Neon API key. Ask the attendee to copy it again (Neon shows it only once; if it is gone, create another) and save the file, $AGAIN"
        return 1
    fi
    # neonctl reads the key from stdin, never from a command line, and checks it with Neon first.
    if ! output=$(printf '%s\n' "$key" | timeout 60 neonctl profile create DEFAULT --api-key - 2>&1); then
        echo "INVALID: neonctl did not accept the key. Ask the attendee to create a new key and paste it into the same file, $AGAIN. neonctl said:"
        printf '%s\n' "$output" | tail -n 5
        return 1
    fi
    rm -f "$FORM_FILE"
    echo "SAVED: neonctl is signed in with the API key (in ~/.config/neon/credentials.json, readable only by this user). The form was deleted; the attendee can close its editor tab. Run: bash ~/.workshop/auth.sh check neon"
}

case "${1:-}" in
    open) open_form ;;
    save) save ;;
    *)
        echo "usage: neon-key.sh open | save"
        exit 2
        ;;
esac
