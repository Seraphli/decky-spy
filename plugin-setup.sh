#!/usr/bin/env bash

pyenv install 3.10.10 && pyenv virtualenv 3.10.10 decky-spy && pyenv activate decky-spy && curl https://github.com/Seraphli/decky-spy/raw/main/requirements.txt | pip install -r /dev/stdin
