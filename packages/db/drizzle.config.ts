import { defineConfig } from 'drizzle-kit'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../../apps/web/.env.local') })

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './migrations',
  dbCredentials: {
    url: process.env.DATABASE_MIGRATION_URL!,
  },
})
