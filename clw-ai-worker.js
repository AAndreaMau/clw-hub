// CLW Hub — Anthropic API Proxy
// Deploy to Cloudflare Workers (free tier)

export default {
  async fetch(request, env) {

    // ── Test endpoint — visit Worker URL in browser to confirm it's working ──
    if (request.method === 'GET') {
      return new Response(JSON.stringify({
        status: 'CLW AI Worker is running',
        hasKey: !!(env.ANTHROPIC_API_KEY)
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // ── CORS preflight ──────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin':  '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age':       '86400',
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // ── Forward to Anthropic ────────────────────────────────────
    try {
      const body = await request.json();

      const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type':      'application/json',
          'x-api-key':         env.ANTHROPIC_API_KEY,
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
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: { message: err.message } }), {
        status: 500,
        headers: {
          'Content-Type':                'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  }
};
