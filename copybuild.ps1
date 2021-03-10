param (
  [string]$target
)

$target = $target + "\node_modules\enterprise-fetch"

npm run build
Copy-Item -Path .\package.json -Destination $target
Copy-Item -Path .\package-lock.json -Destination $target
Copy-Item -Path .\dist -Filter *.* -Destination $target -Recurse -Force
