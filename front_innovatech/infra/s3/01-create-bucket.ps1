# FASE 6.3/6.4 - Crear el bucket S3 para el frontend (sitio estatico)
#
# Requisitos: AWS CLI v2 configurado.
# Uso:
#   cd infra/s3
#   ./01-create-bucket.ps1

$ErrorActionPreference = "Stop"

$REGION      = "us-east-1"
$BUCKET_NAME = "innovatech-frontend"

# 1. Crear el bucket (si no existe)
try {
    aws s3api head-bucket --bucket $BUCKET_NAME --region $REGION | Out-Null
    Write-Host "Bucket '$BUCKET_NAME' ya existe, se omite la creacion."
} catch {
    aws s3 mb "s3://$BUCKET_NAME" --region $REGION | Out-Null
    Write-Host "Bucket '$BUCKET_NAME' creado."
}

# 2. Habilitar hosting de sitio estatico. index.html como error-document
#    permite que las rutas de React Router (BrowserRouter) no den 404.
aws s3 website "s3://$BUCKET_NAME" --index-document index.html --error-document index.html

# 3. Permitir politica publica en el bucket (esta bloqueada por defecto)
aws s3api put-public-access-block `
    --bucket $BUCKET_NAME `
    --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false `
    --region $REGION

# 4. Politica de bucket: lectura publica de todos los objetos
$policy = @"
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicRead",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
  }]
}
"@

$policyFile = Join-Path $env:TEMP "innovatech-frontend-policy.json"
$policy | Out-File -FilePath $policyFile -Encoding utf8 -NoNewline
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy "file://$policyFile" --region $REGION
Remove-Item $policyFile

Write-Host "`nListo. URL del sitio (hosting estatico S3, HTTP):"
Write-Host "  http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
Write-Host "`nSiguiente paso:"
Write-Host "  1. Definir VITE_BACKEND_URL (variable de entorno o .env.production local)"
Write-Host "     con la URL del Load Balancer (kubectl get svc ms-api-gateway -n innovatech)"
Write-Host "  2. Correr ./02-build-and-deploy.ps1"
