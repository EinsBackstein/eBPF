#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
platform=$(uname -s | tr '[:upper:]' '[:lower:]')
arch=$(uname -m)
case "$arch" in arm64|aarch64) arch=arm64;; x86_64) arch=amd64;; *) echo "Unsupported architecture: $arch" >&2; exit 1;; esac
case "$platform" in darwin|linux) ;; *) echo 'Linux or macOS required' >&2; exit 1;; esac
mkdir -p .lab/bin
archive="hubble-${platform}-${arch}.tar.gz"
url="https://github.com/cilium/hubble/releases/download/v1.20.2/$archive"
curl -fsSL "$url" -o ".lab/$archive"
curl -fsSL "$url.sha256sum" -o ".lab/$archive.sha256sum"
cd .lab
if command -v sha256sum >/dev/null; then sha256sum -c "$archive.sha256sum"; else shasum -a 256 -c "$archive.sha256sum"; fi
tar xzf "$archive" -C bin hubble
bin/hubble version
