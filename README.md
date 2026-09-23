# NanzMusify — Vercel Edition

Web music player backed by YouTube Music search/streaming, packaged for
one-click deployment on **Vercel**.

## Project structure

```
public/            -> static site (served as-is, Vercel output directory)
api/*.js           -> Node.js Serverless Functions (auto-detected by Vercel)
api/_cors.js       -> shared same-origin CORS helper used by every route
api/proxy-audio.js -> Edge Function, streams audio with Range/206 support
api/proxy-image.js -> Edge Function, same-origin image proxy (canvas CORS)
middleware.js      -> Edge Middleware, injects per-track/artist/album OG
                       meta tags for link previews on /play/*, /artist/*,
                       /album/*
vercel.json        -> SPA fallback rewrite (everything except /api/* -> index.html)
```

No build step is required — the site is plain HTML/CSS/JS, and every route
under `/api` is picked up automatically by Vercel's zero-config detection.

## Deploy to Vercel

### Option A — Vercel CLI
```bash
npm install -g vercel
vercel --prod
```

### Option B — Git integration
1. Push this repository to GitHub/GitLab/Bitbucket.
2. In Vercel: **Add New → Project → Import** the repo.
3. Framework preset: "Other" (auto-detected). No build command needed.
4. Deploy.

No environment variables are required.

> **Note on function timeout:** `/api/ytplay` and `/api/transcribe` can take
> a few seconds (they race multiple upstream CDNs / fetch external audio).
> Vercel's Hobby plan caps Serverless Functions at 10s; if you're on Pro or
> above and hit timeouts, raise it per-route in `vercel.json`:
> ```json
> "functions": { "api/ytplay.js": { "maxDuration": 30 } }
> ```

## API routes

| Route                | Backend                                    |
|-----------------------|---------------------------------------------|
| `/api/search`         | Node Serverless Function                    |
| `/api/lyrics`         | Node Serverless Function                    |
| `/api/artist`         | Node Serverless Function                    |
| `/api/album`          | Node Serverless Function                    |
| `/api/suggest`        | Node Serverless Function                    |
| `/api/ytplay`         | Node Serverless Function                    |
| `/api/translate`      | Node Serverless Function                    |
| `/api/transcribe`     | Node Serverless Function (used by `/api/lyrics`) |
| `/api/proxy-audio`    | **Edge Function** (streams audio bytes, Range/206) |
| `/api/proxy-image`    | **Edge Function** (same-origin image proxy) |

`proxy-audio` and `proxy-image` run on the Edge Runtime instead of as
regular Node functions: Node serverless functions buffer the whole response
in memory with a payload limit, which breaks long-track playback / seeking
and canvas-based cover color extraction.

Share-link previews for `/play/:id`, `/artist/:id`, `/album/:id` are
rewritten on the fly by `middleware.js` (Vercel Edge Middleware), the
equivalent of the original Netlify Edge Function `og-meta.js`.

## Local development
```bash
npm install
vercel dev
```
`vercel dev` runs the static site, the Node functions, the Edge Functions
and the Edge Middleware locally, matching production behavior.
