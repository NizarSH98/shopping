// Simple Admin with Cloudflare KV Storage
// No GitHub tokens needed - products stored directly in Cloudflare

const ADMIN_PASSWORD = 'admin123';  // CHANGE THIS PASSWORD!

// Simple token generation
function generateToken() {
  return btoa(`admin:${Date.now()}:${Math.random()}`);
}

function verifyToken(token) {
  if (!token) return false;
  try {
    const decoded = atob(token);
    return decoded.startsWith('admin:');
  } catch {
    return false;
  }
}

async function handleRequest(request, env) {
  const url = new URL(request.url);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  // Login endpoint
  if (url.pathname === '/admin/login' && request.method === 'POST') {
    try {
      const { password } = await request.json();
      
      if (password === ADMIN_PASSWORD) {
        const token = generateToken();
        return new Response(JSON.stringify({ 
          success: true, 
          token 
        }), {
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          }
        });
      } else {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Invalid password' 
        }), {
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          }
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message 
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }
  }

  // Check auth endpoint
  if (url.pathname === '/admin/check') {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (verifyToken(token)) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    } else {
      return new Response(JSON.stringify({ success: false }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }
  }

  // PUBLIC API: Get products (no auth required)
  if (url.pathname === '/api/products' && request.method === 'GET') {
    try {
      let products = await env.PRODUCTS_KV.get('products', { type: 'json' });
      
      // If no products in KV, return default products
      if (!products) {
        products = DEFAULT_PRODUCTS;
      }

      return new Response(JSON.stringify(products), {
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
          ...corsHeaders 
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: error.message 
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }
  }

  // ADMIN: Get products endpoint
  if (url.pathname === '/admin/products' && request.method === 'GET') {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!verifyToken(token)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized' 
      }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }

    try {
      let products = null;
      
      // Try to get from KV
      try {
        if (env.PRODUCTS_KV) {
          products = await env.PRODUCTS_KV.get('products', { type: 'json' });
        }
      } catch (kvError) {
        console.error('KV Error:', kvError);
      }
      
      // If no products in KV, use default empty structure
      if (!products) {
        products = { products: [] };
        // Try to save default to KV
        try {
          if (env.PRODUCTS_KV) {
            await env.PRODUCTS_KV.put('products', JSON.stringify(products));
          }
        } catch (saveError) {
          console.error('Failed to save default products:', saveError);
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        products
      }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    } catch (error) {
      console.error('Error in /admin/products GET:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to load products'
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }
  }

  // ADMIN: Update products endpoint
  if (url.pathname === '/admin/products' && request.method === 'POST') {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!verifyToken(token)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Unauthorized' 
      }), {
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }

    try {
      const { products } = await request.json();
      
      if (!products) {
        throw new Error('No products data provided');
      }
      
      // Save to Cloudflare KV
      if (env.PRODUCTS_KV) {
        await env.PRODUCTS_KV.put('products', JSON.stringify(products));
      } else {
        throw new Error('KV storage not configured');
      }

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Products updated successfully'
      }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    } catch (error) {
      console.error('Error in /admin/products POST:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to save products'
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }
  }

  // Root endpoint - info page
  const infoHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Shopping API</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 800px;
          margin: 2rem auto;
          padding: 0 2rem;
          line-height: 1.6;
        }
        h1 { color: #1E40AF; }
        .endpoint {
          background: #f9fafb;
          padding: 1rem;
          margin: 1rem 0;
          border-left: 4px solid #1E40AF;
          border-radius: 4px;
        }
        .public { border-left-color: #22C55E; }
        .admin { border-left-color: #F59E0B; }
      </style>
    </head>
    <body>
      <h1>🛍️ Shopping API</h1>
      
      <h2>Public Endpoints</h2>
      <div class="endpoint public">
        <h3>GET /api/products</h3>
        <p>Get all products (public, no auth required)</p>
      </div>
      
      <h2>Admin Endpoints</h2>
      <div class="endpoint admin">
        <h3>POST /admin/login</h3>
        <p>Authenticate with password</p>
      </div>
      
      <div class="endpoint admin">
        <h3>GET /admin/products</h3>
        <p>Get products (requires auth)</p>
      </div>
      
      <div class="endpoint admin">
        <h3>POST /admin/products</h3>
        <p>Update products (requires auth)</p>
      </div>
      
      <p><strong>✅ API is running</strong></p>
    </body>
    </html>
  `;

  return new Response(infoHtml, {
    headers: { 
      'Content-Type': 'text/html',
      ...corsHeaders 
    }
  });
}

// Default products (will be used if KV is empty)
const DEFAULT_PRODUCTS = {
  "products": []
};

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  },
};
