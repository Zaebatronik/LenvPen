# Скрипт для замены градиентов на солидные цвета

# Основная кнопка
(Get-Content "D:\MyAPP\LenvPen\frontend\src\pages\*.jsx") | 
  ForEach-Object { 
    $_ -replace 'bg-gradient-to-r from-lenvpen-orange to-lenvpen-red', 'bg-lenvpen-accent' `
       -replace 'bg-gradient-to-br from-lenvpen-orange.*?to-lenvpen-red', 'bg-lenvpen-accent' `
       -replace 'from-lenvpen-orange via-lenvpen-red to-lenvpen-orange', 'bg-lenvpen-accent' `
       -replace 'bg-gradient-to-r from-lenvpen-green to-lenvpen-orange', 'bg-lenvpen-accent' `
       -replace 'hover:from-lenvpen-orange hover:to-lenvpen-red', 'hover:bg-lenvpen-accent/90' `
       -replace 'hover:from-lenvpen-orange hover:to-lenvpen-green', 'hover:bg-lenvpen-accent/90' `
       -replace 'bg-gradient-to-br from-lenvpen-card.*?to-lenvpen-bg', 'bg-lenvpen-card' `
       -replace 'bg-gradient-to-t from-lenvpen-orange to-lenvpen-red', 'bg-lenvpen-accent' `
       -replace 'bg-gradient-to-r from-lenvpen-red via-lenvpen-orange to-lenvpen-green', 'bg-lenvpen-accent' `
       -replace 'bg-gradient-to-br from-lenvpen-orange/10 to-lenvpen-red/10', 'bg-lenvpen-accent/10' `
       -replace 'bg-gradient-to-br from-lenvpen-orange/5 to-lenvpen-red/5', 'bg-lenvpen-accent/5' `
       -replace 'bg-gradient-to-r from-lenvpen-orange/10 to-lenvpen-red/10', 'bg-lenvpen-accent/10' `
       -replace 'bg-gradient-to-br from-lenvpen-orange/15.*?to-lenvpen-red/15', 'bg-lenvpen-card border border-lenvpen-accent/20' `
       -replace 'bg-gradient-to-br from-lenvpen-orange/20.*?to-lenvpen-red/20', 'bg-lenvpen-card border border-lenvpen-accent/30' `
       -replace 'bg-clip-text text-transparent bg-gradient-to-r from-lenvpen-orange to-lenvpen-red', 'text-lenvpen-accent' `
       -replace 'shadow-lenvpen-red/30', 'shadow-lenvpen-accent/30' `
       -replace 'shadow-lenvpen-orange/40', 'shadow-lenvpen-accent/20' `
       -replace 'shadow-lenvpen-orange/50', 'shadow-lenvpen-accent/30' `
       -replace 'border-lenvpen-orange/50', 'border-lenvpen-accent/50' `
       -replace 'border-lenvpen-orange/30', 'border-lenvpen-accent/30' `
       -replace 'border-lenvpen-orange/20', 'border-lenvpen-accent/20'
  }

Write-Host "Замена завершена"
