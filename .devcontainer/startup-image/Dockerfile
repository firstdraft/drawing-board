FROM ghcr.io/firstdraft/drawing-board-workspace@sha256:06602be5cc829d5142c12b06c505dbf8353a3ade6751ca4bf01a785ea2c3e6e3

USER vscode
COPY --chown=vscode:vscode .devcontainer/agent-versions.env .devcontainer/prepare-agents /tmp/firstdraft-startup-image/
RUN NPM_CONFIG_CACHE=/tmp/firstdraft-startup-image/npm bash /tmp/firstdraft-startup-image/prepare-agents && \
    rm -rf /tmp/firstdraft-startup-image
