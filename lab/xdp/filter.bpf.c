// SPDX-License-Identifier: GPL-2.0-only
// Own teaching filter; C is build input, not part of the talk's code walkthrough.
#include <linux/bpf.h>
#include <linux/if_ether.h>
#include <linux/ip.h>
#include <linux/tcp.h>
#include <bpf/bpf_helpers.h>
#include <bpf/bpf_endian.h>
struct {
    __uint(type, BPF_MAP_TYPE_ARRAY);
    __uint(max_entries, 1);
    __type(key, __u32);
    __type(value, __u32);
} blocked_port SEC(".maps");
struct {
    __uint(type, BPF_MAP_TYPE_ARRAY);
    __uint(max_entries, 2);
    __type(key, __u32);
    __type(value, __u64);
} stats SEC(".maps");
SEC("xdp")
int port_filter(struct xdp_md *ctx) {
    void *end = (void *)(long)ctx->data_end;
    struct ethhdr *eth = (void *)(long)ctx->data;
    if ((void *)(eth + 1) > end || eth->h_proto != bpf_htons(ETH_P_IP))
        return XDP_PASS;
    struct iphdr *ip = (void *)(eth + 1);
    if ((void *)(ip + 1) > end || ip->version != 4 || ip->ihl < 5 ||
        ip->protocol != 6 || (bpf_ntohs(ip->frag_off) & 0x3fff))
        return XDP_PASS;
    struct tcphdr *tcp = (void *)ip + ip->ihl * 4;
    if ((void *)(tcp + 1) > end) return XDP_PASS;
    __u32 zero = 0, decision = 0;
    __u32 *port = bpf_map_lookup_elem(&blocked_port, &zero);
    if (port && *port != 0 && bpf_ntohs(tcp->dest) == *port) decision = 1;
    __u64 *count = bpf_map_lookup_elem(&stats, &decision);
    if (count) __sync_fetch_and_add(count, 1);
    return decision ? XDP_DROP : XDP_PASS;
}
char LICENSE[] SEC("license") = "GPL";
