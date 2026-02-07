import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'
import type { Plugin } from 'vite'

const PYTHON = '/Library/Frameworks/Python.framework/Versions/3.12/bin/python3'

function adminApiPlugin(): Plugin {
  return {
    name: 'admin-api',
    configureServer(server) {
      // Parse JSON body helper
      const readBody = (req: import('http').IncomingMessage): Promise<string> =>
        new Promise((resolve) => {
          let body = ''
          req.on('data', (chunk: Buffer) => { body += chunk.toString() })
          req.on('end', () => resolve(body))
        })

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '', 'http://localhost')

        // Generate puzzle for a ticker
        if (url.pathname === '/api/admin/generate' && req.method === 'GET') {
          const ticker = url.searchParams.get('ticker')
          if (!ticker) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Missing ticker param' }))
            return
          }
          try {
            const result = execSync(
              `${PYTHON} scripts/generate_puzzles.py ${ticker.replace(/[^a-zA-Z0-9.]/g, '')}`,
              { cwd: process.cwd(), timeout: 30000, encoding: 'utf-8' }
            )
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: true, ticker, output: result }))
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: msg }))
          }
          return
        }

        // Get schedule
        if (url.pathname === '/api/admin/schedule' && req.method === 'GET') {
          try {
            const data = readFileSync(join(process.cwd(), 'public/schedule.json'), 'utf-8')
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(data)
          } catch {
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end('{}')
          }
          return
        }

        // Save schedule
        if (url.pathname === '/api/admin/schedule' && req.method === 'POST') {
          try {
            const body = await readBody(req)
            const schedule = JSON.parse(body)
            writeFileSync(
              join(process.cwd(), 'public/schedule.json'),
              JSON.stringify(schedule, null, 2)
            )
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: true }))
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: msg }))
          }
          return
        }

        // List available puzzle tickers
        if (url.pathname === '/api/admin/puzzles' && req.method === 'GET') {
          try {
            const dir = join(process.cwd(), 'public/puzzles')
            const files = readdirSync(dir).filter(f => f.endsWith('.json'))
            const tickers = files.map(f => {
              try {
                const data = JSON.parse(readFileSync(join(dir, f), 'utf-8'))
                return { file: f, ticker: data.answer?.ticker || f.replace('.json', '').toUpperCase(), name: data.answer?.name || '' }
              } catch {
                return { file: f, ticker: f.replace('.json', '').toUpperCase(), name: '' }
              }
            })
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify(tickers))
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: msg }))
          }
          return
        }

        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), adminApiPlugin()],
})
