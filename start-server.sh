#!/bin/bash

# Load NVM if it exists
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
fi

# Capture the calling directory before changing to the one-ring directory
export MCP_CALLING_DIR="$(pwd)"

# Get the absolute path to the one-ring directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to the one-ring directory
cd "$SCRIPT_DIR"

# Use the current Node version
exec node ./dist/server.js
