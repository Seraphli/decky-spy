import json
import subprocess
from os.path import expanduser

HOME = expanduser("~")
VENV_PYTHON = f"{HOME}/.pyenv/versions/decky-spy/bin/python"


def test_cli1():
    stdout = subprocess.run(
        [VENV_PYTHON, "deckyspy/cli.py", "get-memory"], capture_output=True
    ).stdout
    print(json.loads(stdout))


def test_cli2():
    stdout = subprocess.check_output(
        f"{VENV_PYTHON} deckyspy/cli.py get-memory",
        stderr=subprocess.STDOUT,
        shell=True,
    )
    print(json.loads(stdout))
