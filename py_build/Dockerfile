# Use the official Python 3.10.10 image
FROM --platform=linux/amd64 python:3.10.10

# Set the working directory
WORKDIR /app

# Install PyInstaller
RUN pip install pyinstaller psutil click

# Copy your local script or folder to the working directory
COPY ./deckyspy/ /app/

# Bundle the script using PyInstaller
RUN pyinstaller --onefile /app/cli.py
