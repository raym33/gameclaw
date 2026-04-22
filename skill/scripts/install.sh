#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
skill_dir="$(cd "$script_dir/.." && pwd)"
codex_home="${CODEX_HOME:-$HOME/.codex}"
target_dir="$codex_home/skills/gameclaw"

mkdir -p "$target_dir"
cp -R "$skill_dir"/. "$target_dir"/

echo "Installed Gameclaw skill to $target_dir"
echo "Invoke it in Codex with: \$gameclaw"
