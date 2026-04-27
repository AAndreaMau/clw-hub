// CLW Hub — Anthropic API Proxy
// Deploy to Cloudflare Workers (free tier)
// Relays requests from github.io to Anthropic, adding the API key server-side

export default {
  async fetch(request, env) {

    // ── CORS preflight ──────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin':  'https://aandreamau.github.io',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age':       '86400',
        }
      });
    }

    // ── Only allow POST from our GitHub Pages domain ────────────
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const origin = request.headers.get('Origin') || '';
    if (!origin.includes('aandreamau.github.io') && !origin.includes('localhost')) {
      return new Response('Forbidden', { status: 403 });
    }

    // ── Forward to Anthropic ────────────────────────────────────
    try {
      const body = await request.json();

      const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type':      'application/json',
          'x-api-key':         env.ANTHROPIC_API_KEY,   // set in Worker env vars
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model:      body.model      || 'claude-haiku-4-5-20251001',
          max_tokens: body.max_tokens || 600,
          system:     body.system     || '',
          messages:   body.messages   || [],
        }),
      });

      const data = await anthropicResp.json();

      return new Response(JSON.stringify(data), {
        status: anthropicResp.status,
        headers: {
          'Content-Type':                'application/json',
          'Access-Control-Allow-Origin': origin,
        },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: { message: err.message } }), {
        status: 500,
        headers: {
          'Content-Type':                'application/json',
          'Access-Control-Allow-Origin': origin,
        },
      });
    }
  }
};
