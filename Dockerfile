# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS web
COPY index.html vite.config.ts tsconfig.json ./
COPY src ./src
COPY public ./public
COPY scripts ./scripts
COPY server/presenter-notes.mjs ./server/presenter-notes.mjs
COPY lab/app ./lab/app
COPY lab/manifests ./lab/manifests
COPY lab/xdp ./lab/xdp
RUN npm run build
EXPOSE 5173
CMD ["node", "node_modules/vite/bin/vite.js", "preview", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]

FROM docker:29-cli AS docker-cli
FROM node:24-bookworm-slim AS lab
ARG TARGETARCH
ARG KUBECTL_VERSION=v1.35.5
ARG HUBBLE_VERSION=v1.20.2
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl jq gzip \
    && rm -rf /var/lib/apt/lists/*
COPY --from=docker-cli /usr/local/bin/docker /usr/local/bin/docker
RUN set -eu; \
    curl -fsSLo /tmp/kubectl "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/${TARGETARCH}/kubectl"; \
    curl -fsSLo /tmp/kubectl.sha256 "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/${TARGETARCH}/kubectl.sha256"; \
    cd /tmp; echo "$(cat kubectl.sha256)  kubectl" | sha256sum -c -; \
    install -m 0755 kubectl /usr/local/bin/kubectl; \
    archive="hubble-linux-${TARGETARCH}.tar.gz"; \
    curl -fsSLO "https://github.com/cilium/hubble/releases/download/${HUBBLE_VERSION}/${archive}"; \
    curl -fsSLO "https://github.com/cilium/hubble/releases/download/${HUBBLE_VERSION}/${archive}.sha256sum"; \
    sha256sum -c "${archive}.sha256sum"; \
    tar xzf "${archive}" -C /usr/local/bin hubble; \
    rm -f /tmp/kubectl /tmp/kubectl.sha256 /tmp/hubble-*
WORKDIR /app
COPY server ./server
COPY lab/manifests ./lab/manifests
COPY docker/lab-entrypoint.sh /usr/local/bin/lab-entrypoint
ENV KUBECONFIG=/run/ebpf-talk/kubeconfig HUBBLE_BIN=/usr/local/bin/hubble \
    LAB_BIND_ADDRESS=0.0.0.0 LAB_ALLOWED_HOSTS=127.0.0.1:4174,localhost:4174,lab:4174
EXPOSE 4174 12000
ENTRYPOINT ["sh", "/usr/local/bin/lab-entrypoint"]
