#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
template_dir="${script_dir}/../assets/templates"

list_templates() {
  for file in "${template_dir}"/*.json; do
    basename "${file}" .json
  done
}

if [[ $# -eq 0 ]]; then
  list_templates
  exit 0
fi

template_name="$1"
template_file="${template_dir}/${template_name}.json"

if [[ ! -f "${template_file}" ]]; then
  echo "Unknown template: ${template_name}" >&2
  echo "Available templates:" >&2
  list_templates >&2
  exit 1
fi

cat "${template_file}"
