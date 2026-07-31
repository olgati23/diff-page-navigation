import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'node:path'

import { defineConfig } from 'vite'
import VueRouter from 'unplugin-vue-router/vite'
import vue from '@vitejs/plugin-vue'

// GitHub Pages project sites need an absolute path prefix. Do not use './' here:
// Vue Router's normalizeBase turns './' into '/.', so the current path never
// matches your routes (blank app). CI sets PROTOWIKI_BASE from the repo name.
// Override locally, e.g. PROTOWIKI_BASE='/ProtoWiki/' npm run build
const buildBase = process.env.PROTOWIKI_BASE ?? '/protowiki/'

const ghPagesRestoreScript = readFileSync(
  new URL('./public/gh-pages-restore.js', import.meta.url),
  'utf8',
)
const ghPagesPreview404Script = readFileSync(
  new URL('./public/gh-pages-preview-404.js', import.meta.url),
  'utf8',
)

export default defineConfig(({ command }) => ({
  base: command === 'build' ? buildBase : '/',
  plugins: [
    // Plugin order matters: VueRouter must come before vue() so the routes
    // virtual module is generated first.
    VueRouter({
      routesFolder: [
        {
          src: 'src/prototypes',
          // Only `index.vue` files are routes; co-located modules (e.g. HelpModule.vue) are imports.
          filePatterns: ['**/index'],
        },
      ],
      dts: 'src/typed-router.d.ts',
    }),
    vue(),
    {
      name: 'protowiki-gh-pages-restore',
      apply: 'build',
      transformIndexHtml: {
        order: 'pre',
        handler() {
          return [
            {
              tag: 'script',
              children: ghPagesRestoreScript,
              injectTo: 'head-prepend',
            },
          ]
        },
      },
    },
    // GitHub Pages serves a static 404.html for unknown paths. Copy index.html,
    // then prepend a script so pr-preview deep links redirect into the preview
    // base (sessionStorage + restore in index). Production deep links unchanged.
    {
      name: 'protowiki-spa-404',
      apply: 'build',
      closeBundle() {
        const dist = resolve(__dirname, 'dist')
        const index = resolve(dist, 'index.html')
        const fallback = resolve(dist, '404.html')
        if (!existsSync(index)) {
          return
        }
        copyFileSync(index, fallback)
        const html = readFileSync(fallback, 'utf8')
        const preamble = `<script>${ghPagesPreview404Script}</script>`
        writeFileSync(
          fallback,
          html.includes('<head>')
            ? html.replace('<head>', `<head>${preamble}`)
            : preamble + html,
        )
      },
    },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    allowedHosts: ['.lhr.life', '.loca.lt'],
    proxy: {
      '/wikipedia-proxy': {
        target: 'https://en.wikipedia.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/wikipedia-proxy/, ''),
        selfHandleResponse: true,
        configure(proxy) {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('accept-encoding')
          })
          proxy.on('proxyRes', (proxyRes, _req, res) => {
            const chunks: Buffer[] = []
            proxyRes.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
            proxyRes.on('end', () => {
              const contentType = String(proxyRes.headers['content-type'] ?? '')
              if (!contentType.includes('text/html')) {
                res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers)
                res.end(Buffer.concat(chunks))
                return
              }

              const injected = `
                <style id="review-changes-wikipedia-overrides">
                  .header-container, .minerva-header, .mw-header,
                  .mw-page-container-inner > header, .page-heading,
                  .mw-first-heading,
                  .mw-body-subheader, .page-actions-menu,
                  .minerva__tab-container, .mw-revslider-container,
                  .mw-diff-revision-history-links, .mw-diff-mobile-footer,
                  .mw-diff-new-mobile-footer-accordion,
                  .mw-diff-table-prefix, .mw-diff-inline-legend,
                  .ve-init-mw-diffPage-diffMode, .diff-title,
                  #firstHeading, #siteSub { display: none !important; }
                </style>
                <script>
                  (() => {
                    const section = new URLSearchParams(location.search).get('reviewsection');
                    let isolated = false;
                    const clean = () => {
                      document.querySelectorAll(
                        '.mw-diff-mobile-footer, .mw-diff-new-mobile-footer-accordion'
                      ).forEach((element) => element.remove());
                      const visualDiff = document.querySelector('.ve-ui-diffElement');
                      if (visualDiff && !isolated) {
                        isolated = true;
                        document.body.replaceChildren(visualDiff);
                        document.body.style.margin = '0';
                        document.body.style.padding = '0';
                      }
                      const heading = section
                        ? document.querySelector(
                            '.ve-ui-diffElement #' + CSS.escape(section)
                          ) || document.getElementById(section)
                        : document.querySelector(
                            '.ve-ui-diffElement h2[id], .ve-ui-diffElement h3[id], .ve-ui-diffElement h4[id]'
                          );
                      if (heading) heading.scrollIntoView({ block: 'start' });
                    };
                    addEventListener('DOMContentLoaded', () => {
                      clean();
                      new MutationObserver(clean).observe(document.body, {
                        childList: true,
                        subtree: true
                      });
                      setTimeout(clean, 0);
                    });
                  })();
                </script>
              `
              const html = Buffer.concat(chunks).toString('utf8')
              const body = html.replace('</head>', `${injected}</head>`)
              const headers = { ...proxyRes.headers }
              delete headers['content-length']
              delete headers['content-encoding']
              res.writeHead(proxyRes.statusCode ?? 200, headers)
              res.end(body)
            })
          })
        },
      },
      '/w': {
        target: 'https://en.wikipedia.org',
        changeOrigin: true,
      },
      '/wiki': {
        target: 'https://en.wikipedia.org',
        changeOrigin: true,
      },
    },
  },
}))
