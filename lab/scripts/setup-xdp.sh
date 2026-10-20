#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
name=ebpf-talk-xdp
docker build -t ebpf-talk-xdp:local lab/xdp
if docker container inspect "$name" >/dev/null 2>&1; then
  owner=$(docker inspect --format '{{index .Config.Labels "org.ebpf-talk.lab"}}' "$name")
  [[ "$owner" == "xdp" ]] || { echo 'Container name already used outside this lab' >&2; exit 1; }
  docker rm -f "$name" >/dev/null
fi
# Privilege is required to create netns and load BPF inside the Docker Linux VM.
# No host network, host PID namespace, bind mounts or published ports.
docker run -d --name "$name" --label org.ebpf-talk.lab=xdp \
  --network none --privileged --cgroupns private ebpf-talk-xdp:local
for attempt in {1..60}; do
  if docker exec "$name" test -f /run/xdp-ready; then
    docker exec "$name" python3 /opt/xdp/control.py status
    exit 0
  fi
  [[ "$(docker inspect --format '{{.State.Running}}' "$name")" == true ]] || break
  sleep 1
done
docker logs "$name"
exit 1
