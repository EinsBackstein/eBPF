"""Kernel BPF_PROG_TEST_RUN fixtures, separate from live network measurements."""
import json
from pathlib import Path
import struct
import subprocess
from maps import ROOT, write


def packet(port, fragment=0):
    eth = b'\x00' * 12 + b'\x08\x00'
    ip = struct.pack('!BBHHHBBH4s4s', 0x45, 0, 40, 0, fragment, 64, 6, 0,
                     b'\xc0\x00\x02\x01', b'\xc0\x00\x02\x02')
    tcp = struct.pack('!HHIIHHHH', 40000, port, 0, 0, 0x5002, 1024, 0, 0)
    return eth + ip + tcp


write('blocked_port', 0, 9090)
try:
    fixtures = [('blocked9090', packet(9090), 1), ('allowed8080', packet(8080), 2),
                ('truncated-ip', packet(9090)[:25], 2),
                ('truncated-tcp', packet(9090)[:44], 2),
                ('fragment-pass', packet(9090, 0x2000), 2),
                ('arp-pass', b'\x00' * 12 + b'\x08\x06' + b'\x00' * 28, 2)]
    for name, data, expected in fixtures:
        path = Path('/tmp/xdp-packet')
        path.write_bytes(data)
        result = json.loads(subprocess.check_output(
            ['bpftool', '-j', 'prog', 'run', 'pinned', f'{ROOT}/filter',
             'data_in', str(path), 'repeat', '1'], text=True))
        assert result['retval'] == expected, (name, result)
        print(name, result['retval'])
finally:
    write('blocked_port', 0, 0)
