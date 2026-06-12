# FASE 6.1/6.2/6.5 - Build de produccion del frontend y deploy a S3
#
# Requisitos: Node.js/npm instalados, AWS CLI v2 configurado y bucket ya
# creado (ver 01-create-bucket.ps1).
#
# IMPORTANTE: el build necesita la URL real del Load Balancer del backend.
# Definila de una de estas dos formas antes de correr el script:
#   a) variable de entorno:  $env:VITE_BACKEND_URL = "http://<LOAD_BALANCER_URL>"
#   b) archivo .env.production en la raiz del proyecto (no esta versionado):
#        VITE_BACKEND_URL=http://<LOAD_BALANCER_URL>
#
# Uso (desde cualquier ubicacion, el script resuelve la raiz del proyecto solo):
#   ./infra/s3/02-build-and-deploy.ps1

$ErrorActionPreference = "Stop"

$REGION      = "us-east-1"
$BUCKET_NAME = "innovatech-frontend"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")

# Sin VITE_BACKEND_URL el bundle queda con API_BASE_URL='' y el sitio en S3
# llamaria a la API contra si mismo. Cortar aca antes de publicar algo roto.
$envProdFile = Join-Path $projectRoot ".env.production"
if (-not $env:VITE_BACKEND_URL -and -not (Test-Path $envProdFile)) {
    throw ("Falta VITE_BACKEND_URL. Defini la variable de entorno o crea " +
           "$envProdFile con: VITE_BACKEND_URL=http://<LOAD_BALANCER_URL>")
}

Push-Location $projectRoot
try {
    Write-Host "== Build de produccion (npm run build) =="
    npm run build

    Write-Host "`n== Sincronizando dist/ -> s3://$BUCKET_NAME =="
    aws s3 sync dist/ "s3://$BUCKET_NAME" --delete --region $REGION
} finally {
    Pop-Location
}

Write-Host "`nListo. Sitio disponible en:"
Write-Host "  http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
Write-Host "`nRecorda actualizar CORS_ALLOWED_ORIGINS en infra/k8s/01-configmap.yaml del"
Write-Host "backend con esta URL y reiniciar el gateway:"
Write-Host "  kubectl rollout restart deployment ms-api-gateway -n innovatech"
