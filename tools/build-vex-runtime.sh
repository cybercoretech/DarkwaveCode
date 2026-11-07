#!/usr/bin/env sh
# Rebuilds vex-runtime/ (the Vex Lab's in-browser interpreter) from a
# vexlang checkout with wasm-pack, and records which commit it came from.
#
#   tools/build-vex-runtime.sh [PATH_TO_VEXLANG]   (default ../../tooling/vexlang)
set -eu
here=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
vexlang=$(CDPATH= cd -- "${1:-$here/../../tooling/vexlang}" && pwd)
out="$here/vex-runtime"
(cd "$vexlang" && wasm-pack build --target web --release --no-pack \
    --out-dir "$out" --out-name vexlang)
rm -f "$out/.gitignore"
commit=$(git -C "$vexlang" rev-parse HEAD)
version=$(sed -n 's/^version = "\([^"]*\)"/\1/p' "$vexlang/Cargo.toml" | head -n 1)
dirty=$(git -C "$vexlang" status --porcelain --untracked-files=no | head -n 1)
printf 'vexlang %s\ncommit %s%s\n' "$version" "$commit" "${dirty:+ (dirty)}" > "$out/SOURCE"
echo "vex-runtime rebuilt from vexlang $version @ $commit"
