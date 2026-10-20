FROM debian:bookworm-slim@sha256:7c7b2c966bc9ee8cedfeef67e0e279108992c77681fa595db4a9d65c06ccc587 AS build
RUN apt-get update && apt-get install -y --no-install-recommends clang libbpf-dev linux-libc-dev gcc && rm -rf /var/lib/apt/lists/*
WORKDIR /build
COPY filter.bpf.c .
RUN clang -O2 -g -target bpf -I/usr/include/$(gcc -dumpmachine) -c filter.bpf.c -o filter.bpf.o

FROM debian:bookworm-slim@sha256:7c7b2c966bc9ee8cedfeef67e0e279108992c77681fa595db4a9d65c06ccc587
RUN apt-get update && apt-get install -y --no-install-recommends bpftool iproute2 python3 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/xdp
COPY --from=build /build/filter.bpf.o .
COPY *.py entrypoint.sh LICENSE ./
ENTRYPOINT ["bash", "/opt/xdp/entrypoint.sh"]
