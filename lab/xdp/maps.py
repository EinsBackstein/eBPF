"""Read and update actual pinned BPF maps via bpftool; no Python BPF binding needed."""
import json
import subprocess
import sys

ROOT = "/run/ebpf-talk-bpf"


def bpf(*args):
    return json.loads(subprocess.check_output(["bpftool", "-j", *args], text=True))


def write(name, key, value, size=4):
    key_bytes = key.to_bytes(4, sys.byteorder)
    val_bytes = value.to_bytes(size, sys.byteorder)
    subprocess.run(["bpftool", "map", "update", "pinned", f"{ROOT}/maps/{name}",
                    "key", "hex", *[f"{b:02x}" for b in key_bytes],
                    "value", "hex", *[f"{b:02x}" for b in val_bytes]], check=True)


def read(name, key):
    data = bpf("map", "lookup", "pinned", f"{ROOT}/maps/{name}",
               "key", "hex", *[f"{b:02x}" for b in key.to_bytes(4, sys.byteorder)])
    value = data.get("formatted", data)["value"]
    return value if isinstance(value, int) else int.from_bytes(bytes(int(b, 16) for b in value), sys.byteorder)


def program():
    result = bpf("prog", "show", "pinned", f"{ROOT}/filter")
    return result[0] if isinstance(result, list) else result


def counters():
    return {"PASS": read("stats", 0), "DROP": read("stats", 1)}
