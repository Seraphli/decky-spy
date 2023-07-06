#!/usr/bin/env bash

curl https://pyenv.run | bash

pyenv install 3.10.10
pyenv virtualenv 3.10.10 decky-spy
pyenv activate decky-spy


curl https://github.com/Seraphli/decky-spy/blob/main/requirements.txt | pip install -r /dev/stdin
