#!/usr/bin/env bash
set -euo pipefail
# All mounts, interfaces and namespaces belong to this network-isolated container.
rm -f /run/xdp-ready
# Remove namespace handles left in the container filesystem after a Docker restart.
for ns in talk-client talk-server; do ip netns del "$ns" 2>/dev/null || true; done
mkdir -p /run/ebpf-talk-bpf
mount -t bpf bpf /run/ebpf-talk-bpf
mkdir -p /run/ebpf-talk-bpf/maps
ip netns add talk-client
ip netns add talk-server
ip link add client-veth type veth peer name server-veth
ip link set client-veth netns talk-client
ip link set server-veth netns talk-server
ip -n talk-client link set client-veth name eth0
ip -n talk-server link set server-veth name eth0
ip -n talk-client addr add 192.0.2.1/30 dev eth0
ip -n talk-server addr add 192.0.2.2/30 dev eth0
for ns in talk-client talk-server; do
  ip -n "$ns" link set lo up
  ip -n "$ns" link set eth0 up
done
bpftool prog load /opt/xdp/filter.bpf.o /run/ebpf-talk-bpf/filter type xdp pinmaps /run/ebpf-talk-bpf/maps
ip -n talk-server link set dev eth0 xdpgeneric pinned /run/ebpf-talk-bpf/filter
ip netns exec talk-server python3 /opt/xdp/service.py 8080 &
server_a=$!
ip netns exec talk-server python3 /opt/xdp/service.py 9090 &
server_b=$!
trap 'rm -f /run/xdp-ready; kill "$server_a" "$server_b" 2>/dev/null || true; exit' TERM INT
for attempt in {1..30}; do
  if python3 /opt/xdp/control.py test8080 >/dev/null && python3 /opt/xdp/control.py test9090 >/dev/null; then
    touch /run/xdp-ready
    echo 'XDP ready: Generic/SKB on talk-server/eth0; 8080 and 9090 reachable'
    wait
    exit
  fi
  sleep 1
done
exit 1
