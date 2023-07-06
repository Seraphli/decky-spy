#!/usr/bin/env bash

export PYENV_VERSION=3.10.10

pyenv virtualenv 3.10.10 decky-spy
curl https://github.com/Seraphli/decky-spy/raw/main/requirements.txt | pip install -r /dev/stdin

unset PYENV_VERSION
