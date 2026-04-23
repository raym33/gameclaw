#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
preset_dir="${script_dir}/../assets/presets"

list_presets() {
  for file in "${preset_dir}"/*.json; do
    basename "${file}" .json
  done
}

if [[ $# -eq 0 ]]; then
  list_presets
  exit 0
fi

preset_name="$1"
preset_file="${preset_dir}/${preset_name}.json"

if [[ ! -f "${preset_file}" ]]; then
  echo "Unknown preset: ${preset_name}" >&2
  echo "Available presets:" >&2
  list_presets >&2
  exit 1
fi

cat "${preset_file}"
