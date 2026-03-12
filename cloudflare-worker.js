/**
 * GlowHaven — Unified Cloudflare Worker
 * Handles: Authentication, Products CRUD, Site Content Management
 * Storage: Cloudflare KV (SITE_KV namespace)
 *
 * KV Keys:
 *   products        — { products: [...] }
 *   hero            — { badge, title, titleAccent, subtitle, trustItems, brands, ctaPrimary, ctaSecondary }
 *   announcements   — { items: [...] }
 *   promoBanners    — { banners: [...] }
 *   whySection      — { title, cards: [...] }
 *   testimonials    — { title, subtitle, items: [...] }
 *   newsletter      — { title, subtitle }
 *   siteSettings    — { name, description, whatsapp, currency, social, footerDescription }
 *   announcement    — { enabled, label, ctaText, ctaHref, endAt }
 */

// ═══════════════════════════════════════════════
//  CONFIGURATION
// ═══════════════════════════════════════════════
const ADMIN_PASSWORD = 'GlowAdmin2026!'; // Fallback — prefer env.ADMIN_PASSWORD

// ═══════════════════════════════════════════════
//  AUTH HELPERS (HMAC-signed tokens)
// ═══════════════════════════════════════════════
async function getSigningKey(password) {
  const enc = new TextEncoder().encode(password);
  return crypto.subtle.importKey('raw', enc, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function generateToken(password) {
  const payload = JSON.stringify({ t: Date.now(), r: Math.random() });
  const key = await getSigningKey(password);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return btoa(JSON.stringify({ p: payload, s: sigB64 }));
}

async function verifyToken(token, password) {
  try {
    const decoded = JSON.parse(atob(token));
    const key = await getSigningKey(password);
    const sigBytes = Uint8Array.from(atob(decoded.s), c => c.charCodeAt(0));
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(decoded.p));
    if (!valid) return false;
    // Token expires after 24 hours
    const data = JSON.parse(decoded.p);
    return (Date.now() - data.t) < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function unauthorized(corsHeaders) {
  return json({ success: false, error: 'Unauthorized' }, 401, corsHeaders);
}

function json(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

// ═══════════════════════════════════════════════
//  VALID KV KEYS (content sections)
// ═══════════════════════════════════════════════
const VALID_KEYS = [
  'products',
  'hero',
  'announcements',
  'promoBanners',
  'whySection',
  'testimonials',
  'newsletter',
  'siteSettings',
  'announcement',
];

// ═══════════════════════════════════════════════
//  DEFAULT CONTENT — used when KV is empty
// ═══════════════════════════════════════════════
const DEFAULTS = {
  hero: {
    badge: 'Premium Beauty Destination',
    badgeIcon: 'fas fa-gem',
    title: 'Elevate Your',
    titleAccent: 'Beauty Ritual',
    subtitle: 'Curated skincare, luxury makeup & fragrances from the world\'s most coveted brands.',
    trustItems: [
      { icon: 'fas fa-shield-halved', text: '100% Authentic' },
      { icon: 'fas fa-truck-fast', text: 'Free Delivery $100+' },
      { icon: 'fas fa-star', text: '4.9★ Rated' },
    ],
    brands: [
      { name: 'CeraVe', href: './index.html?brand=CeraVe' },
      { name: 'The Ordinary', href: './index.html?brand=The+Ordinary' },
      { name: 'La Roche-Posay', href: './index.html?brand=La+Roche-Posay' },
      { name: 'MAC', href: './index.html?brand=MAC' },
      { name: 'NARS', href: './index.html?brand=NARS' },
      { name: 'Olaplex', href: './index.html?brand=Olaplex' },
    ],
    ctaPrimary: { text: 'Shop the Collection', href: '#productsGrid', icon: 'fas fa-arrow-right' },
    ctaSecondary: { text: 'Explore Brands', href: './brands.html', icon: 'fas fa-heart' },
  },
  announcements: {
    items: [
      { icon: 'fas fa-tags', text: 'WEEKLY OFFERS & BUNDLES!' },
      { icon: 'fas fa-truck', text: 'FREE DELIVERY ON $100+' },
      { icon: 'fas fa-gift', text: 'FREE SAMPLES WITH EVERY ORDER' },
      { icon: 'fas fa-shield-alt', text: '100% AUTHENTIC PRODUCTS' },
    ],
  },
  promoBanners: {
    banners: [
      {
        href: './index.html?category=Skincare',
        cssClass: 'promo-card-skincare',
        tag: 'New Arrivals',
        title: 'Glow-Up Skincare',
        description: 'Serums, moisturizers & treatments from dermatologist-loved brands.',
        ctaText: 'Shop Skincare',
        icon: 'fas fa-droplet',
      },
      {
        href: './index.html?category=Makeup',
        cssClass: 'promo-card-makeup',
        tag: 'Best Sellers',
        title: 'Luxury Makeup Edit',
        description: 'Foundation, lips & complexion from MAC, NARS, Maybelline & more.',
        ctaText: 'Shop Makeup',
        icon: 'fas fa-palette',
      },
    ],
  },
  whySection: {
    title: 'Why Shop with GlowHaven?',
    cards: [
      { icon: 'fas fa-shield-halved', title: 'Guaranteed Authentic', description: 'Every product sourced directly from authorized distributors. No fakes, ever.' },
      { icon: 'fas fa-leaf', title: 'Clean & Cruelty-Free', description: 'We prioritize brands committed to ethical and cruelty-free beauty standards.' },
      { icon: 'fas fa-comments', title: 'Expert Guidance', description: 'Chat with us on WhatsApp for personalized product recommendations anytime.' },
    ],
  },
  testimonials: {
    sectionTag: 'Reviews',
    title: 'What Our Customers Say',
    subtitle: 'Trusted by thousands of beauty enthusiasts',
    items: [
      { stars: 5, text: '"Finally found a store that carries all my favorite skincare brands! The CeraVe moisturizer arrived quickly and the packaging was perfect. Will definitely order again."', authorName: 'Sarah M.', authorLabel: 'Verified Buyer' },
      { stars: 5, text: '"Love the free samples with every order! Got to try The Ordinary serum before buying the full size. The prices are amazing compared to other stores."', authorName: 'Rania K.', authorLabel: 'Verified Buyer' },
      { stars: 5, text: '"Best beauty shopping experience! WhatsApp ordering is so convenient, and I got my MAC lipstick the next day. 100% authentic products every time."', authorName: 'Lina A.', authorLabel: 'Verified Buyer' },
    ],
  },
  newsletter: {
    title: 'Join the Glow Club ✨',
    subtitle: 'Get beauty tips, exclusive deals, and new arrival alerts straight to your inbox.',
  },
  siteSettings: {
    name: 'GlowHaven',
    description: 'Your Beauty Destination — Skincare, Makeup & More',
    footerDescription: 'Your trusted beauty destination. Authentic skincare, makeup, haircare & fragrances from the world\'s best brands.',
    whatsappNumber: '1234567890',
    currencyCode: 'USD',
    currencySymbol: '$',
    social: [
      { platform: 'Instagram', href: '#', icon: 'fab fa-instagram' },
      { platform: 'TikTok', href: '#', icon: 'fab fa-tiktok' },
      { platform: 'Facebook', href: '#', icon: 'fab fa-facebook-f' },
      { platform: 'YouTube', href: '#', icon: 'fab fa-youtube' },
    ],
  },
  announcement: {
    enabled: true,
    label: 'Beauty Sale Ends In',
    ctaText: 'Shop Deals',
    ctaHref: '#productsGrid',
    endAt: '2026-12-31T23:59:59Z',
  },
  products: { products: [] },
};

// ═══════════════════════════════════════════════
//  MAIN HANDLER
// ═══════════════════════════════════════════════
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  const KV = env.SITE_KV;
  const password = env.ADMIN_PASSWORD || ADMIN_PASSWORD;

  // ─── AUTH: Login ───
  if (path === '/admin/login' && method === 'POST') {
    try {
      const { password: inputPw } = await request.json();
      if (inputPw === password) {
        const token = await generateToken(password);
        return json({ success: true, token }, 200, corsHeaders);
      }
      return json({ success: false, error: 'Invalid password' }, 401, corsHeaders);
    } catch (e) {
      return json({ success: false, error: e.message }, 500, corsHeaders);
    }
  }

  // ─── AUTH: Check ───
  if (path === '/admin/check') {
    const token = (request.headers.get('Authorization') || '').replace('Bearer ', '');
    const valid = await verifyToken(token, password);
    return json({ success: valid }, valid ? 200 : 401, corsHeaders);
  }

  // ─── PUBLIC: Get products ───
  if (path === '/api/products' && method === 'GET') {
    try {
      let data = await KV.get('products', { type: 'json' });
      if (!data) data = DEFAULTS.products;
      return json(data, 200, { ...corsHeaders, 'Cache-Control': 'public, max-age=30' });
    } catch (e) {
      return json({ error: e.message }, 500, corsHeaders);
    }
  }

  // ─── PUBLIC: Get any content section ───
  if (path.startsWith('/api/content/') && method === 'GET') {
    const key = path.replace('/api/content/', '');
    if (!VALID_KEYS.includes(key)) {
      return json({ error: 'Invalid content key' }, 400, corsHeaders);
    }
    try {
      let data = await KV.get(key, { type: 'json' });
      if (!data) data = DEFAULTS[key] || {};
      return json(data, 200, { ...corsHeaders, 'Cache-Control': 'public, max-age=30' });
    } catch (e) {
      return json({ error: e.message }, 500, corsHeaders);
    }
  }

  // ─── PUBLIC: Get all content at once (for frontend init) ───
  if (path === '/api/content' && method === 'GET') {
    try {
      const all = {};
      for (const key of VALID_KEYS) {
        let data = await KV.get(key, { type: 'json' });
        all[key] = data || DEFAULTS[key] || {};
      }
      return json(all, 200, { ...corsHeaders, 'Cache-Control': 'public, max-age=30' });
    } catch (e) {
      return json({ error: e.message }, 500, corsHeaders);
    }
  }

  // ─── ADMIN: Get content (any key) ───
  if (path.startsWith('/admin/content/') && method === 'GET') {
    const token = (request.headers.get('Authorization') || '').replace('Bearer ', '');
    if (!(await verifyToken(token, password))) return unauthorized(corsHeaders);

    const key = path.replace('/admin/content/', '');
    if (!VALID_KEYS.includes(key)) {
      return json({ success: false, error: 'Invalid key' }, 400, corsHeaders);
    }
    try {
      let data = await KV.get(key, { type: 'json' });
      if (!data) data = DEFAULTS[key] || {};
      return json({ success: true, data }, 200, corsHeaders);
    } catch (e) {
      return json({ success: false, error: e.message }, 500, corsHeaders);
    }
  }

  // ─── ADMIN: Save content (any key) ───
  if (path.startsWith('/admin/content/') && method === 'POST') {
    const token = (request.headers.get('Authorization') || '').replace('Bearer ', '');
    if (!(await verifyToken(token, password))) return unauthorized(corsHeaders);

    const key = path.replace('/admin/content/', '');
    if (!VALID_KEYS.includes(key)) {
      return json({ success: false, error: 'Invalid key' }, 400, corsHeaders);
    }
    try {
      const data = await request.json();
      await KV.put(key, JSON.stringify(data));
      return json({ success: true, message: `${key} updated successfully` }, 200, corsHeaders);
    } catch (e) {
      return json({ success: false, error: e.message }, 500, corsHeaders);
    }
  }

  // ─── ADMIN: Get all content at once ───
  if (path === '/admin/content' && method === 'GET') {
    const token = (request.headers.get('Authorization') || '').replace('Bearer ', '');
    if (!(await verifyToken(token, password))) return unauthorized(corsHeaders);

    try {
      const all = {};
      for (const key of VALID_KEYS) {
        let data = await KV.get(key, { type: 'json' });
        all[key] = data || DEFAULTS[key] || {};
      }
      return json({ success: true, data: all }, 200, corsHeaders);
    } catch (e) {
      return json({ success: false, error: e.message }, 500, corsHeaders);
    }
  }

  // ─── ADMIN: Bulk save all content ───
  if (path === '/admin/content' && method === 'POST') {
    const token = (request.headers.get('Authorization') || '').replace('Bearer ', '');
    if (!(await verifyToken(token, password))) return unauthorized(corsHeaders);

    try {
      const body = await request.json();
      const saved = [];
      for (const [key, value] of Object.entries(body)) {
        if (VALID_KEYS.includes(key)) {
          await KV.put(key, JSON.stringify(value));
          saved.push(key);
        }
      }
      return json({ success: true, saved }, 200, corsHeaders);
    } catch (e) {
      return json({ success: false, error: e.message }, 500, corsHeaders);
    }
  }

  // ─── ADMIN: Reset a section to defaults ───
  if (path.startsWith('/admin/reset/') && method === 'POST') {
    const token = (request.headers.get('Authorization') || '').replace('Bearer ', '');
    if (!(await verifyToken(token, password))) return unauthorized(corsHeaders);

    const key = path.replace('/admin/reset/', '');
    if (!VALID_KEYS.includes(key) || !DEFAULTS[key]) {
      return json({ success: false, error: 'Invalid key' }, 400, corsHeaders);
    }
    try {
      await KV.put(key, JSON.stringify(DEFAULTS[key]));
      return json({ success: true, data: DEFAULTS[key] }, 200, corsHeaders);
    } catch (e) {
      return json({ success: false, error: e.message }, 500, corsHeaders);
    }
  }

  // ─── Root info ───
  return new Response(`
    <!DOCTYPE html><html><head><meta charset="UTF-8"><title>GlowHaven API</title>
    <style>body{font-family:system-ui;max-width:700px;margin:2rem auto;padding:0 2rem;line-height:1.6}
    h1{color:#c9a96e}code{background:#f3f4f6;padding:2px 6px;border-radius:4px}
    .ep{background:#f9fafb;padding:1rem;margin:.5rem 0;border-left:4px solid #c9a96e;border-radius:4px}</style>
    </head><body>
    <h1>✨ GlowHaven API</h1>
    <h3>Public</h3>
    <div class="ep"><code>GET /api/products</code> — All products</div>
    <div class="ep"><code>GET /api/content</code> — All site content</div>
    <div class="ep"><code>GET /api/content/{key}</code> — Single content section</div>
    <h3>Admin (requires auth)</h3>
    <div class="ep"><code>POST /admin/login</code> — Authenticate</div>
    <div class="ep"><code>GET /admin/content</code> — Get all content</div>
    <div class="ep"><code>POST /admin/content/{key}</code> — Update section</div>
    <div class="ep"><code>POST /admin/reset/{key}</code> — Reset to defaults</div>
    <p>Keys: <code>${VALID_KEYS.join('</code>, <code>')}</code></p>
    <p><strong>✅ API is running</strong></p>
    </body></html>
  `, { headers: { 'Content-Type': 'text/html', ...corsHeaders } });
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  },
};
