import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))

const MIME = {
  '.urdf': 'application/xml',
  '.xacro': 'application/xml',
  '.stl': 'application/octet-stream',
  '.STL': 'application/octet-stream',
  '.dae': 'model/vnd.collada+xml',
  '.obj': 'text/plain',
  '.mtl': 'text/plain',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
}

/* Serve gitignored models-raw/ to the local dev server so the site can load
   raw URDFs at runtime (local-only workflow; never part of the build output). */
function serveModelsRaw() {
  return {
    name: 'serve-models-raw',
    configureServer(server) {
      server.middlewares.use('/models-raw', (req, res, next) => {
        const rel = decodeURIComponent((req.url || '').split('?')[0])
        let file = path.join(root, 'models-raw', rel)
        // images/OBJs: prefer the slimmed copies in models-raw-lite/
        // (tools/texlite.py, tools/objlite.py) — the raw PBR maps decode to
        // ~0.76 GB GPU and the 153 MB chassis OBJ kills WebGL otherwise
        if (/\.(png|jpe?g|obj|mtl)$/i.test(rel)) {
          const lite = path.join(root, 'models-raw-lite', rel)
          if (fs.existsSync(lite) && fs.statSync(lite).isFile()) file = lite
        }
        if (!file.startsWith(path.join(root, 'models-raw')) && !file.startsWith(path.join(root, 'models-raw-lite'))) {
          return next()
        }
        if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
          return next()
        }
        res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream')
        fs.createReadStream(file).pipe(res)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serveModelsRaw()],
})
