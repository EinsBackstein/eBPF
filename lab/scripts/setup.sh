#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
for tool in docker k3d kubectl helm python3; do
  command -v "$tool" >/dev/null || { echo "Missing prerequisite: $tool" >&2; exit 1; }
done
docker info >/dev/null
mkdir -p .lab
# Never switch the user's current Kubernetes context.
if ! k3d cluster list -o json | python3 -c 'import json,sys; sys.exit(not any(c["name"] == "ebpf-talk" for c in json.load(sys.stdin)))'; then
  k3d cluster create ebpf-talk --image rancher/k3s:v1.35.5-k3s1 \
    --servers 1 --agents 0 --no-lb --api-port 127.0.0.1:6550 \
    --k3s-arg '--flannel-backend=none@server:*' \
    --k3s-arg '--disable-network-policy@server:*' \
    --k3s-arg '--disable-kube-proxy@server:*' \
    --k3s-arg '--disable=traefik,servicelb@server:*' \
    --kubeconfig-update-default=false --kubeconfig-switch-context=false
fi
k3d kubeconfig get ebpf-talk > .lab/kubeconfig
chmod 600 .lab/kubeconfig
export KUBECONFIG="$PWD/.lab/kubeconfig"
export HELM_REPOSITORY_CONFIG="$PWD/.lab/helm-repositories.yaml"
export HELM_REPOSITORY_CACHE="$PWD/.lab/helm-cache"
printf 'repositories: []\n' > "$HELM_REPOSITORY_CONFIG"
curl -fsSL https://helm.cilium.io/cilium-1.20.3.tgz -o .lab/cilium-1.20.3.tgz
helm upgrade --install cilium .lab/cilium-1.20.3.tgz \
  --namespace kube-system -f lab/cilium-values.yaml
kubectl rollout status daemonset/cilium -n kube-system --timeout=900s
# A retry after a slow image pull must also clear a prior progress deadline.
kubectl rollout restart deployment/hubble-relay deployment/hubble-ui -n kube-system
kubectl rollout status deployment/hubble-relay -n kube-system --timeout=600s
kubectl rollout status deployment/hubble-ui -n kube-system --timeout=600s
kubectl apply -f lab/manifests/workloads.yaml
kubectl create configmap python-app -n ebpf-talk --from-file=lab/app/server.py --from-file=lab/app/client.py --dry-run=client -o yaml | kubectl apply -f -
kubectl rollout status deployment/web -n ebpf-talk --timeout=180s
kubectl wait --for=condition=Ready pod/client-a pod/client-b -n ebpf-talk --timeout=180s
kubectl apply -f lab/manifests/policy-open.yaml
bash lab/scripts/install-hubble.sh
echo 'Lab ready. Start the bridge with: npm run lab'
