// Simple Admin Authentication Worker for Cloudflare
// Handles password authentication and product management via GitHub API

// === CONFIGURATION ===
const ADMIN_PASSWORD = 'admin123';  // CHANGE THIS PASSWORD!
const GITHUB_TOKEN = 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN';  // Create at: https://github.com/settings/tokens
const GITHUB_REPO = 'NizarSH98/shopping';
const GITHUB_BRANCH = 'main';
const PRODUCTS_FILE_PATH = 'data/products.json';

// Simple token generation (in production, use proper JWT)
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

async function handleRequest(request) {
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

  // Get products endpoint
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
      // Fetch products from GitHub
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${PRODUCTS_FILE_PATH}?ref=${GITHUB_BRANCH}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'User-Agent': 'Cloudflare-Worker',
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      const data = await response.json();
      const content = atob(data.content);
      const products = JSON.parse(content);

      return new Response(JSON.stringify({ 
        success: true, 
        products,
        sha: data.sha  // Need this for updating
      }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
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

  // Update products endpoint
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

      // First, get the current file SHA
      const fileResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${PRODUCTS_FILE_PATH}?ref=${GITHUB_BRANCH}`,
        {
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'User-Agent': 'Cloudflare-Worker',
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      const fileData = await fileResponse.json();
      const currentSha = fileData.sha;

      // Update the file on GitHub
      const content = btoa(JSON.stringify(products, null, 2));
      
      const updateResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${PRODUCTS_FILE_PATH}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'User-Agent': 'Cloudflare-Worker',
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            message: 'Update products via admin panel',
            content: content,
            sha: currentSha,
            branch: GITHUB_BRANCH
          })
        }
      );

      const updateData = await updateResponse.json();

      if (updateResponse.ok) {
        return new Response(JSON.stringify({ 
          success: true,
          message: 'Products updated successfully'
        }), {
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          }
        });
      } else {
        throw new Error(updateData.message || 'Failed to update GitHub');
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

  // Root endpoint - info page
  const infoHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Admin API</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 800px;
          margin: 2rem auto;
          padding: 0 2rem;
          line-height: 1.6;
        }
        h1 { color: #1E40AF; }
        code {
          background: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-family: monospace;
        }
        .endpoint {
          background: #f9fafb;
          padding: 1rem;
          margin: 1rem 0;
          border-left: 4px solid #1E40AF;
        }
      </style>
    </head>
    <body>
      <h1>🔐 Admin API</h1>
      <p>Simple authentication and product management API</p>
      
      <div class="endpoint">
        <h3>POST /admin/login</h3>
        <p>Authenticate with password</p>
      </div>
      
      <div class="endpoint">
        <h3>GET /admin/check</h3>
        <p>Verify authentication token</p>
      </div>
      
      <div class="endpoint">
        <h3>GET /admin/products</h3>
        <p>Get current products</p>
      </div>
      
      <div class="endpoint">
        <h3>POST /admin/products</h3>
        <p>Update products</p>
      </div>
      
      <p><strong>Admin Page:</strong> <a href="/admin/simple-admin.html">/admin/simple-admin.html</a></p>
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

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
