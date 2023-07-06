#!/usr/bin/env bash

rsync -av --progress $(pwd)/py_modules/deckyspy $(pwd)/defaults --exclude __pycache__