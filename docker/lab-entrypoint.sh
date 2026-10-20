#!/bin/sh
set -eu
# Reuse only the pre-existing lab. Never create or delete an unrelated cluster.
[ "$(docker inspect --format '{{index .Config.Labels "k3d.cluster"}}' k3d-ebpf-talk-server-0)" = ebpf-talk ] || {
  echo 'Expected k3d cluster ebpf-talk. Run npm run lab:setup once on the host.' >&2; exit 1;
}
[ "$(docker inspect --format '{{index .Config.Labels "org.ebpf-talk.lab"}}' ebpf-talk-xdp)" = xdp ] || {
  echo 'Expected the dedicated ebpf-talk-xdp container.' >&2; exit 1;
}
docker start k3d-ebpf-talk-server-0 ebpf-talk-xdp >/dev/null
mkdir -p /run/ebpf-talk
cp /input/kubeconfig "$KUBECONFIG"
chmod 600 "$KUBECONFIG"
# Use Docker DNS for transport, but retain CA and certificate verification.
kubectl config set-cluster k3d-ebpf-talk \
  --server=https://k3d-ebpf-talk-server-0:6443 --tls-server-name=127.0.0.1 >/dev/null
attempt=0
until kubectl get --raw=/readyz >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  [ "$attempt" -lt 60 ] || { echo 'The eBPF Kubernetes API is not ready.' >&2; exit 1; }
  sleep 2
done
kubectl wait --for=condition=Ready pods --all -n ebpf-talk --timeout=180s
kubectl rollout status deployment/hubble-relay -n kube-system --timeout=180s
kubectl rollout status deployment/hubble-ui -n kube-system --timeout=180s
exec node server/lab.mjs
