docker build -t pyinstaller-app .

# Create a local directory to store the output
mkdir -p ./output

# Run the container
docker run --name temp-container pyinstaller-app

# Copy the entire output folder and its contents to the specified local directory
docker cp temp-container:/app/dist/cli ./output

# Clean up the container
docker rm temp-container

chmod +x ./output/cli
cp ./output/cli ../defaults/
