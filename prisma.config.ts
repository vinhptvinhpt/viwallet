import { defineConfig } from 'prisma/config'
import * as fs from 'fs'
import * as path from 'path'

// Load .env or .env.local manually so prisma generate works without a live DB
function loadEnv() {
  const files = ['.env', '.env.local']
  for (const file of files) {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx === -1) continue
        const key = trimmed.slice(0, eqIdx).trim()
        const val = trimmed.slice(eqIdx + 1).trim()
        if (key && !(key in process.env)) {
          process.env[key] = val
        }
      }
    }
  }
}

loadEnv()

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:placeholder@db.placeholder.supabase.co:5432/postgres',
  },
})
