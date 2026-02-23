import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync, exec } from 'child_process'
import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join } from 'path'
import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'

const PYTHON = '/Library/Frameworks/Python.framework/Versions/3.12/bin/python3'

// Load .env for admin API usage
const env = loadEnv('development', process.cwd(), '')
const GEMINI_API_KEY = env.GEMINI_API_KEY || ''

/** Send a JSON response */
function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

/** Read the full request body */
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk: Buffer) => { body += chunk.toString() })
    req.on('end', () => resolve(body))
  })
}

function adminApiPlugin(): Plugin {
  return {
    name: 'admin-api',
    configureServer(server) {
      // Use a NON-async middleware. For endpoints that need async work,
      // handle the promise chain internally without returning a promise
      // to Connect (which ignores it and falls through to Vite's SPA handler).
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url || '', 'http://localhost')

        // Generate puzzle for a ticker
        if (url.pathname === '/api/admin/generate' && req.method === 'GET') {
          const ticker = url.searchParams.get('ticker')
          if (!ticker) { json(res, 400, { error: 'Missing ticker param' }); return }
          try {
            const result = execSync(
              `${PYTHON} scripts/generate_puzzles.py ${ticker.replace(/[^a-zA-Z0-9.]/g, '')}`,
              { cwd: process.cwd(), timeout: 45000, encoding: 'utf-8', env: { ...process.env, GEMINI_API_KEY } }
            )
            json(res, 200, { ok: true, ticker, output: result })
          } catch (e: unknown) {
            json(res, 500, { error: e instanceof Error ? e.message : String(e) })
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
            json(res, 200, {})
          }
          return
        }

        // Save schedule (async — body read)
        if (url.pathname === '/api/admin/schedule' && req.method === 'POST') {
          readBody(req).then((body) => {
            const schedule = JSON.parse(body)
            writeFileSync(join(process.cwd(), 'public/schedule.json'), JSON.stringify(schedule, null, 2))
            json(res, 200, { ok: true })
          }).catch((e: unknown) => {
            json(res, 500, { error: e instanceof Error ? e.message : String(e) })
          })
          return
        }

        // List available puzzle tickers (with description + difficulty)
        if (url.pathname === '/api/admin/puzzles' && req.method === 'GET') {
          try {
            const dir = join(process.cwd(), 'public/puzzles')
            const files = readdirSync(dir).filter(f => f.endsWith('.json'))
            const tickers = files.map(f => {
              try {
                const data = JSON.parse(readFileSync(join(dir, f), 'utf-8'))
                return {
                  file: f,
                  ticker: data.answer?.ticker || f.replace('.json', '').toUpperCase(),
                  name: data.answer?.name || '',
                  description: data.hints?.description || '',
                  funFact1: data.hints?.funFact1 || '',
                  funFact2: data.hints?.funFact2 || '',
                  difficulty: data.difficulty ?? null,
                }
              } catch {
                return { file: f, ticker: f.replace('.json', '').toUpperCase(), name: '', description: '', funFact1: '', funFact2: '', difficulty: null }
              }
            })
            json(res, 200, tickers)
          } catch (e: unknown) {
            json(res, 500, { error: e instanceof Error ? e.message : String(e) })
          }
          return
        }

        // Regenerate description for a ticker (async — exec)
        if (url.pathname === '/api/admin/regen-description' && req.method === 'GET') {
          const ticker = url.searchParams.get('ticker')
          if (!ticker) { json(res, 400, { error: 'Missing ticker param' }); return }
          const sanitized = ticker.replace(/[^a-zA-Z0-9.]/g, '')
          exec(
            `${PYTHON} scripts/regen_description.py ${sanitized}`,
            { cwd: process.cwd(), timeout: 120000, encoding: 'utf-8', env: { ...process.env, GEMINI_API_KEY } },
            (err, stdout, stderr) => {
              if (err) {
                json(res, 500, { error: stderr || err.message })
              } else {
                json(res, 200, { ok: true, ticker: sanitized, output: stdout })
              }
            }
          )
          return
        }

        // Save manually edited description for a ticker (async — body read)
        if (url.pathname === '/api/admin/save-description' && req.method === 'POST') {
          readBody(req).then((body) => {
            const { ticker, description } = JSON.parse(body)
            if (!ticker || typeof description !== 'string') {
              json(res, 400, { error: 'Missing ticker or description' })
              return
            }
            const sanitized = ticker.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase()
            const filePath = join(process.cwd(), 'public/puzzles', `${sanitized}.json`)
            const puzzle = JSON.parse(readFileSync(filePath, 'utf-8'))
            puzzle.hints.description = description
            writeFileSync(filePath, JSON.stringify(puzzle, null, 2))
            json(res, 200, { ok: true })
          }).catch((e: unknown) => {
            json(res, 500, { error: e instanceof Error ? e.message : String(e) })
          })
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
