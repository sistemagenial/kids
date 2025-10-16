Write-Host "============================="
Write-Host " LIMPEZA COMPLETA DE CACHE "
Write-Host "============================="

# Fecha o Vite dev se estiver aberto
Write-Host "`nVerificando se há servidor Vite em execução..."
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -match "vite" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Remove build anterior
if (Test-Path .\dist) {
    Write-Host "`nRemovendo pasta dist..."
    Remove-Item -Recurse -Force .\dist -ErrorAction SilentlyContinue
}

# Remove cache do Vite
if (Test-Path .\node_modules\.vite) {
    Write-Host "Removendo cache do Vite..."
    Remove-Item -Recurse -Force .\node_modules\.vite -ErrorAction SilentlyContinue
}

# Remove cache do TypeScript
if (Test-Path .\.tsbuildinfo) {
    Write-Host "Removendo cache do TypeScript..."
    Remove-Item -Recurse -Force .\.tsbuildinfo -ErrorAction SilentlyContinue
}

# Remove node_modules
if (Test-Path .\node_modules) {
    Write-Host "Removendo node_modules..."
    Remove-Item -Recurse -Force .\node_modules -ErrorAction SilentlyContinue
}

Write-Host "`n============================="
Write-Host " INSTALANDO DEPENDÊNCIAS "
Write-Host "============================="

npm install

# Reinstala bibliotecas essenciais do projeto
Write-Host "`nGarantindo dependências adicionais..."
npm install lucide-react

Write-Host "`n============================="
Write-Host " INICIANDO BUILD FINAL LIMPA "
Write-Host "============================="

npm install axios

npm run build

Write-Host "`nBuild finalizado com sucesso!"
Write-Host "Verifique a pasta dist e envie seu conteúdo para a hospedagem em /kids/"