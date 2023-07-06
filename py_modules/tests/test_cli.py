import json
import subprocess
from os.path import expanduser

HOME = expanduser("~")
VENV_PYTHON = f"{HOME}/.pyenv/versions/decky-spy/bin/python"


def test_cli():
    cmd = subprocess.run(
        [VENV_PYTHON, "deckyspy/cli.py", "get-memory"], capture_output=True
    )
    stdout = cmd.stdout.decode()
    print(json.loads(stdout))
