# Actually the project is already linked in .vercel folder.

# SPOTIFY_CLIENT_ID
Write-Output "5bc03df885ec4130b1f01dfc14f62b32" | npx vercel env add SPOTIFY_CLIENT_ID production
Write-Output "5bc03df885ec4130b1f01dfc14f62b32" | npx vercel env add SPOTIFY_CLIENT_ID preview
Write-Output "5bc03df885ec4130b1f01dfc14f62b32" | npx vercel env add SPOTIFY_CLIENT_ID development

# SPOTIFY_CLIENT_SECRET
Write-Output "4121f97213664dc7b3403247c3786ba3" | npx vercel env add SPOTIFY_CLIENT_SECRET production
Write-Output "4121f97213664dc7b3403247c3786ba3" | npx vercel env add SPOTIFY_CLIENT_SECRET preview
Write-Output "4121f97213664dc7b3403247c3786ba3" | npx vercel env add SPOTIFY_CLIENT_SECRET development

# NEXTAUTH_SECRET
Write-Output "SavioSuperGizliSifre123" | npx vercel env add NEXTAUTH_SECRET production
Write-Output "SavioSuperGizliSifre123" | npx vercel env add NEXTAUTH_SECRET preview
Write-Output "SavioSuperGizliSifre123" | npx vercel env add NEXTAUTH_SECRET development

# NEXTAUTH_URL
Write-Output "https://ottiktok.vercel.app" | npx vercel env add NEXTAUTH_URL production
Write-Output "https://ottiktok.vercel.app" | npx vercel env add NEXTAUTH_URL preview
Write-Output "https://ottiktok.vercel.app" | npx vercel env add NEXTAUTH_URL development
