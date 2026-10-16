# ReliefWeb's 30th Anniversary

A scrolling data story about thirty years of ReliefWeb: what organizations published, how disasters are covered, which countries the documents are about and where the readers are, and who reads ReliefWeb now. Built with SvelteKit as a static site and published on GitHub Pages.

## Run it

Requires Node 22 (see `.nvmrc`).

```
npm install
npm run dev        # local server with live reload, http://localhost:5173
npm run build      # static site in build/
npm run preview    # serve build/ at http://localhost:4173
npm test           # unit tests (vitest)
```

## Data

Every number comes from the JSON files in `src/lib/data/`. They were produced by the ReliefWeb at 30 data pipelines (ReliefWeb API, the full document export, Google Analytics 4, OCHA TSS firewall reports), which are kept outside this repository. The files here are the finished outputs: to update a figure, replace its JSON file and rebuild. The story computes every number in its text from these files, so the text follows the data.

The layouts of the disaster dot charts are computed once at build time (`src/routes/+page.server.js`), not in the reader's browser.

## Deploy

`.github/workflows/deploy.yml` builds the site on every push to `main` and publishes it to GitHub Pages. In the repository settings, set **Pages → Source** to **GitHub Actions**.

The site is served at `https://<owner>.github.io/reliefweb-at-30/`. Asset paths are relative (`paths.relative` in `svelte.config.js`), so the build works under that subpath, or any other, without configuration. A redirect from ReliefWeb points readers here.

## Checks

Beyond `npm test`, three scripts check the built page in a headless Chrome. Start Chrome with `--headless=new --remote-debugging-port=9222`, run `npm run build && npm run preview`, then:

```
AUDIT_URL=http://localhost:4173/ SHOTS=/tmp/shots npm run shoot -- 1280 800   # every step syncs with its chart; screenshots
AUDIT_URL=http://localhost:4173/ npm run audit                                # no chart rises above its top gridline; every figure has a source
```
