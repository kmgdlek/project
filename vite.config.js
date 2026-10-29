import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import pixabayHandler from './api/pixabay.js'

// 로컬 개발(npm run dev)에서도 Vercel 서버리스 함수(/api/pixabay)와 동일하게 동작하도록 하는 미들웨어
function pixabayDevApi(env) {
  return {
    name: 'pixabay-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/pixabay', async (req, res) => {
        process.env.PIXABAY_API_KEY = env.PIXABAY_API_KEY
        const url = new URL(req.url, 'http://localhost')
        const query = Object.fromEntries(url.searchParams)
        const shim = {
          status(code) { res.statusCode = code; return shim },
          setHeader(k, v) { res.setHeader(k, v); return shim },
          json(body) {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(body))
          },
        }
        await pixabayHandler({ query }, shim)
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return { plugins: [react(), pixabayDevApi(env)] }
})
