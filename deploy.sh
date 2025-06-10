#!/bin/bash

echo "Building the frontend..."
cd frontend
npm run build

echo "Deploying to GitHub Pages..."
npm run deploy

echo "Deployment complete! Your site should be available at:"
echo "https://yourusername.github.io/GiupViecVat/"
