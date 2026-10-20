"""Python controls the map; the attached XDP program makes packet decisions."""
import json
import subprocess
import sys
from maps import counters, program, read, write

ACTIONS = {"status", "block", "clear", "test8080", "test9090"}
action = sys.argv[1]
if action not in ACTIONS:
    raise SystemExit("Unknown action")
before = counters()
if action == "block":
    write("blocked_port", 0, 9090)
elif action == "clear":
    write("blocked_port", 0, 0)
request, exit_code = None, 0
if action.startswith("test"):
    result = subprocess.run(["ip", "netns", "exec", "talk-client", "python3",
                             "/opt/xdp/request.py", action[4:]],
                            capture_output=True, text=True, timeout=6)
    request = json.loads(result.stdout)
    exit_code = result.returncode
    if result.stderr:
        print(result.stderr, file=sys.stderr)
after = counters()
print(json.dumps({
    "experiment": "xdp", "action": action,
    "blocked_port": read("blocked_port", 0),
    "before": before, "after": after,
    "delta": {key: after[key] - before[key] for key in before},
    "request": request,
    "program": program(),
    "attachment": json.loads(subprocess.check_output(
        ["ip", "-n", "talk-server", "-j", "-d", "link", "show", "dev", "eth0"], text=True))[0],
}))
raise SystemExit(exit_code)
