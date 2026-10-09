import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { canonicalDevUrl } from './devOrigin.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('../', import.meta.url)), '');
  const origin = new URL(env.APP_ORIGIN || 'http://127.0.0.1:5173');
  return {
    plugins: [
      react(), tailwindcss(),
      { name: 'canonical-development-origin', configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const destination = canonicalDevUrl(req, origin.origin);
          if (!destination) return next();
          res.writeHead(307, { Location: destination });
          res.end();
        });
      } },
    ],
    server: {
      host: origin.hostname,
      port: Number(origin.port || (origin.protocol === 'https:' ? 443 : 80)),
      strictPort: true,
      proxy: { '/api': { target: `http://127.0.0.1:${env.PORT || 3000}` } },
    },
  };
});
