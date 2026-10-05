#!/usr/bin/env bash
# cloudinary.sh
#
# Keeps the attendee's Cloudinary key (CLOUDINARY_URL) without ever printing it. Apps with photo
# or file uploads store them on Cloudinary and read CLOUDINARY_URL, in development and on Render.
# The Codespaces copy of the laptop kit's cloudinary.sh: a Codespace cannot read the attendee's
# clipboard, so the attendee pastes the three values into a private file in the editor instead.
# Installed to ~/.workshop/cloudinary.sh by .devcontainer/setup-agents. The sign-in skill runs
# 'open' and 'save', auth.sh runs 'check', and the app-session notes run 'install'.
#
#   bash cloudinary.sh open            create the private form and open it in the editor
#   bash cloudinary.sh save            read the form; prints SAVED, NEXT or INVALID
#   bash cloudinary.sh check           is a key saved in ~/.workshop/cloudinary.env?
#   bash cloudinary.sh install [app]   put it in the app's .env.development.local (default: .)
#
# Cloudinary's console shows the API environment variable only as a format,
# CLOUDINARY_URL=cloudinary://<your_api_key>:<your_api_secret>@<cloud_name>, so the form asks for
# the cloud name, the API Key and the API Secret separately.

set -uo pipefail

WORKSHOP_DIR="$HOME/.workshop"
ENV_FILE="$WORKSHOP_DIR/cloudinary.env"
FORM_FILE="$WORKSHOP_DIR/cloudinary-key.txt"
AGAIN='then run: bash ~/.workshop/cloudinary.sh save'


# Is this a cloud name, API key or API secret as Cloudinary issues them? Only these characters,
# which also keeps the saved line safe to source in a shell (the deploy recipe does); at least one
# letter or digit, since a hidden secret can show as dots; and not a placeholder from Cloudinary's
# docs.
#   valid_piece <minimum length> <text>
valid_piece() {
    local min=$1 piece=$2
    [[ $piece =~ ^[A-Za-z0-9._-]+$ && $piece =~ [A-Za-z0-9] && ${#piece} -ge $min ]] || return 1
    case "${piece,,}" in
        api_key | api_secret | my_key | my_secret | your_api_key | your_api_secret | cloud_name | my_cloud_name | your_cloud_name)
            return 1 ;;
    esac
    return 0
}

# Splits cloudinary://KEY:SECRET@CLOUD into url_key, url_secret and url_cloud, which the caller
# declares local, if every part is valid.
split_url() {
    [[ $1 =~ ^cloudinary://([^:@/]+):([^:@/]+)@([^:@/]+)$ ]] || return 1
    url_key=${BASH_REMATCH[1]}
    url_secret=${BASH_REMATCH[2]}
    url_cloud=${BASH_REMATCH[3]}
    valid_piece 6 "$url_key" && valid_piece 6 "$url_secret" && valid_piece 1 "$url_cloud"
}

# Prints its argument without surrounding spaces, one pair of quotes, or a leading
# "export CLOUDINARY_URL=".
clean_value() {
    local text=$1
    text=${text//$'\r'/}
    text=${text#"${text%%[![:space:]]*}"}
    text=${text%"${text##*[![:space:]]}"}
    case "$text" in
        \"*\" | \'*\') text=${text:1:${#text}-2} ;;
    esac
    text=${text#export }
    text=${text#CLOUDINARY_URL=}
    case "$text" in
        \"*\" | \'*\') text=${text:1:${#text}-2} ;;
    esac
    printf '%s' "$text"
}

# Writes a file only this user can read, replacing any earlier one in one step.
write_private() {
    local file=$1 tmp
    mkdir -p "$WORKSHOP_DIR" && chmod 700 "$WORKSHOP_DIR"
    tmp=$(mktemp "$file.XXXXXX") || return 1
    printf '%s\n' "$2" > "$tmp" && chmod 600 "$tmp" && mv -f "$tmp" "$file"
}

# Asks Cloudinary whether it accepts the key and secret. They reach curl on stdin, never on a
# command line, and -q (which must come first) ignores any ~/.curlrc that could turn on verbose or
# trace output. Returns 0 (accepted), 1 (rejected) or 2 (no answer, so it cannot tell).
verify() {
    local cloud=$1 key=$2 secret=$3 code
    code=$(printf 'user = "%s:%s"\n' "$key" "$secret" \
        | curl -q -s -o /dev/null -w '%{http_code}' --max-time 20 -K - "https://api.cloudinary.com/v1_1/$cloud/ping")
    case "$code" in
        200) return 0 ;;
        401) return 1 ;;
        *) return 2 ;;
    esac
}

# Prints the saved CLOUDINARY_URL line if it has the right shape.
saved_line() {
    local line="" url_key url_secret url_cloud
    IFS= read -r line 2>/dev/null < "$ENV_FILE"
    if [[ $line != CLOUDINARY_URL=* ]] || ! split_url "${line#CLOUDINARY_URL=}"; then
        return 1
    fi
    printf '%s' "$line"
}

open_form() {
    if [ ! -f "$FORM_FILE" ]; then
        write_private "$FORM_FILE" "# Paste your Cloudinary values after each = sign, then save this file (Ctrl+S, or Cmd+S on a Mac).
# Do not paste them into the chat. Your agent saves them without showing them, then deletes this file.
# All three are on Cloudinary's API Keys page (Settings, then API Keys):
#   CLOUD_NAME   your cloud name, shown at the top of the page (or copy the whole
#                \"API environment variable\": it ends with your cloud name)
#   API_KEY      the API Key in the list of keys
#   API_SECRET   the API Secret on the same row: click the eye to show it, then copy it
CLOUD_NAME=
API_KEY=
API_SECRET=" || { echo "[FAIL] could not write $FORM_FILE"; return 1; }
    fi
    if command -v code >/dev/null 2>&1 && code --reuse-window "$FORM_FILE" >/dev/null 2>&1; then
        echo "OPENED: $FORM_FILE is open in the editor. The attendee pastes the three values after the = signs and saves the file, $AGAIN"
    else
        echo "NOT OPENED: the attendee opens it with File > Open File... and the path $FORM_FILE, pastes the three values after the = signs and saves it, $AGAIN"
    fi
}

finish() {
    local cloud=$1 key=$2 secret=$3 confirmed
    verify "$cloud" "$key" "$secret"
    case $? in
        0) confirmed="Cloudinary accepted it." ;;
        1)
            echo "INVALID: Cloudinary did not accept this API Key and API Secret. Ask the attendee to copy both again into the same file (the API Secret from the same row as the API Key, shown with its eye button) and save it, $AGAIN"
            return 1 ;;
        *) confirmed="Cloudinary could not be reached to confirm it; the app's first upload will show whether it works." ;;
    esac
    write_private "$ENV_FILE" "CLOUDINARY_URL=cloudinary://$key:$secret@$cloud" \
        || { echo "[FAIL] could not write $ENV_FILE"; return 1; }
    rm -f "$FORM_FILE"
    echo "SAVED: the Cloudinary key is in ~/.workshop/cloudinary.env, readable only by this user. $confirmed The form was deleted; the attendee can close its editor tab."
}

save() {
    local line field value cloud="" key="" secret="" url_key url_secret url_cloud
    [ -f "$FORM_FILE" ] || { echo "INVALID: there is no form to read. Run: bash ~/.workshop/cloudinary.sh open"; return 1; }

    while IFS= read -r line || [ -n "$line" ]; do
        [[ $line =~ ^[[:space:]]*(CLOUD_NAME|API_KEY|API_SECRET)[[:space:]]*=(.*)$ ]] || continue
        field=${BASH_REMATCH[1]}
        value=$(clean_value "${BASH_REMATCH[2]}")
        [ -n "$value" ] || continue
        if [[ $value == cloudinary://* ]]; then
            # A whole API environment variable: complete, or the console's format with
            # placeholders for the key and secret, which still names the cloud.
            if split_url "$value"; then
                finish "$url_cloud" "$url_key" "$url_secret"
                return
            fi
            [[ $value =~ @([^@]+)$ ]] && cloud=${BASH_REMATCH[1]}
            continue
        fi
        case "$field" in
            CLOUD_NAME) cloud=$value ;;
            API_KEY) key=$value ;;
            API_SECRET) secret=$value ;;
        esac
    done < "$FORM_FILE"

    if [ -z "$cloud" ] || ! valid_piece 1 "$cloud"; then
        echo "NEXT: the file needs the cloud name after CLOUD_NAME= (shown at the top of Cloudinary's API Keys page). Ask the attendee to paste it and save the file, $AGAIN"
        return 1
    fi
    if [ -z "$key" ] || ! valid_piece 6 "$key" || [ "$key" = "$cloud" ]; then
        echo "NEXT: the file needs the API Key after API_KEY= (the copy button next to the API Key). Ask the attendee to paste it and save the file, $AGAIN"
        return 1
    fi
    if [ -z "$secret" ] || ! valid_piece 6 "$secret" || [ "$secret" = "$key" ] || [ "$secret" = "$cloud" ]; then
        echo "NEXT: the file needs the API Secret after API_SECRET= (click the eye button next to it to show it, then its copy button; dots or stars are not the secret). Cloudinary may ask the attendee to confirm it is them first. Ask them to paste it and save the file, $AGAIN"
        return 1
    fi
    finish "$cloud" "$key" "$secret"
}

check() {
    [ -f "$ENV_FILE" ] || { echo "not saved yet"; return 1; }
    saved_line >/dev/null || { echo "no valid CLOUDINARY_URL in ~/.workshop/cloudinary.env; save it again"; return 1; }
    echo "saved in ~/.workshop/cloudinary.env"
}

install_into_app() {
    local dir=$1 line target tmp status
    line=$(saved_line) || { echo "MISSING: no Cloudinary key is saved. Have the attendee run /workshop-signin (it redoes only what is missing), then run this again."; return 1; }
    [ -f "$dir/config/application.rb" ] || { echo "[FAIL] $dir is not a Rails app folder"; return 1; }
    # bin/lint-env rejects keys that the app's .env.example does not mention, and only apps with
    # uploads mention CLOUDINARY_URL.
    if [ ! -f "$dir/config/initializers/cloudinary.rb" ] && ! grep -qs 'service: *Cloudinary' "$dir/config/storage.yml"; then
        echo "NOT NEEDED: this app has no photo or file uploads, so it does not read CLOUDINARY_URL. Nothing was written."
        return 0
    fi
    if git -C "$dir" rev-parse --is-inside-work-tree >/dev/null 2>&1 \
        && ! git -C "$dir" check-ignore -q .env.development.local; then
        echo "[FAIL] Git does not ignore $dir/.env.development.local, so the key could be committed. Nothing was written."
        return 1
    fi

    target="$dir/.env.development.local"
    tmp=$(mktemp "$target.XXXXXX") || return 1
    if [ -f "$target" ]; then
        grep -vE '^[[:space:]]*(export[[:space:]]+)?CLOUDINARY_URL[[:space:]]*=' "$target" > "$tmp"
        status=$?
        [ "$status" -le 1 ] || { rm -f "$tmp"; echo "[FAIL] could not read $target"; return 1; }
    fi
    if ! { printf '%s\n' "$line" >> "$tmp" && chmod 600 "$tmp" && mv -f "$tmp" "$target"; }; then
        rm -f "$tmp"
        echo "[FAIL] could not write $target"
        return 1
    fi
    echo "INSTALLED: CLOUDINARY_URL is in $target, readable only by this user. Restart the web app so it reads it."
}


case "${1:-}" in
    open) open_form ;;
    save) save ;;
    check) check ;;
    install) install_into_app "${2:-.}" ;;
    *)
        echo "usage: cloudinary.sh open | save | check | install [app folder]"
        exit 2
        ;;
esac
