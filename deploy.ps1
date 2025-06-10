Write-Host "Building the frontend..." -ForegroundColor Green
Set-Location frontend
npm run build

Write-Host "Deploying to GitHub Pages..." -ForegroundColor Green
npm run deploy

Write-Host "Deployment complete! Your site should be available at:" -ForegroundColor Yellow
Write-Host "https://yourusername.github.io/GiupViecVat/" -ForegroundColor Cyan

Set-Location ..
