// Decap CMS GitHub OAuth Proxy for Cloudflare Workers
// Deploy this to Cloudflare Workers to enable admin authentication
// 
// Setup Instructions:
// 1. Install Wrangler: npm install -g wrangler
// 2. Login: wrangler login
// 3. Update CLIENT_ID and CLIENT_SECRET below
// 4. Deploy: wrangler publish
//
// Based on: https://github.com/vencax/netlify-cms-github-oauth-provider

// TODO: Replace these with your GitHub OAuth App credentials
const CLIENT_ID = 'YOUR_GITHUB_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_GITHUB_CLIENT_SECRET';

async function handleRequest(request) {
  const url = new URL(request.url);

  // CORS headers - allows requests from any origin
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  // OAuth callback - exchanges authorization code for access token
  if (url.pathname === '/callback') {
    const code = url.searchParams.get('code');
    
    if (!code) {
      return new Response('Error: Missing authorization code', { 
        status: 400,
        headers: corsHeaders
      });
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code: code,
        }),
      });

      const data = await tokenResponse.json();

      if (data.error) {
        throw new Error(data.error_description || data.error);
      }

      // Return HTML that posts message back to opener window
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Authorization Complete</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 1rem;
              backdrop-filter: blur(10px);
            }
            .spinner {
              border: 4px solid rgba(255, 255, 255, 0.3);
              border-radius: 50%;
              border-top: 4px solid white;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 1rem;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
          <script>
            (function() {
              try {
                const data = ${JSON.stringify(data)};
                const message = 'authorization:github:success:' + JSON.stringify(data);
                
                if (window.opener) {
                  window.opener.postMessage(message, '*');
                  setTimeout(() => window.close(), 1000);
                } else {
                  document.getElementById('status').innerText = 'Please close this window and return to the admin panel.';
                }
              } catch (error) {
                console.error('Error posting message:', error);
                document.getElementById('status').innerText = 'Error completing authentication. Please try again.';
              }
            })();
          </script>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <h2>Authorization Successful!</h2>
            <p id="status">Redirecting back to admin panel...</p>
          </div>
        </body>
        </html>
      `;

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
          ...corsHeaders,
        },
      });

    } catch (error) {
      console.error('OAuth error:', error);
      
      const errorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Authorization Error</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #dc2626;
              color: white;
            }
            .container {
              text-align: center;
              padding: 2rem;
              background: rgba(0, 0, 0, 0.2);
              border-radius: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>❌ Authorization Failed</h2>
            <p>${error.message}</p>
            <p>Please close this window and try again.</p>
          </div>
        </body>
        </html>
      `;

      return new Response(errorHtml, { 
        status: 500,
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
          ...corsHeaders,
        },
      });
    }
  }

  // Auth endpoint - redirects to GitHub OAuth
  if (url.pathname === '/auth') {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo,user`;
    return Response.redirect(githubAuthUrl, 302);
  }

  // Root endpoint - provide information
  const infoHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Decap CMS OAuth Proxy</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          line-height: 1.6;
        }
        h1 { color: #2563eb; }
        code {
          background: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-family: monospace;
        }
        .status {
          background: #10b981;
          color: white;
          padding: 1rem;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
      </style>
    </head>
    <body>
      <h1>🔐 Decap CMS OAuth Proxy</h1>
      <div class="status">✅ Proxy is running successfully!</div>
      <h2>Endpoints</h2>
      <ul>
        <li><code>/auth</code> - Initiates GitHub OAuth flow</li>
        <li><code>/callback</code> - OAuth callback handler</li>
      </ul>
      <h2>Setup</h2>
      <p>Add this proxy URL to your <code>admin/config.yml</code>:</p>
      <pre><code>backend:
  name: github
  repo: YOUR_USERNAME/YOUR_REPO
  branch: main
  base_url: ${url.origin}</code></pre>
      <p>For more information, see the <a href="https://decapcms.org/docs/authentication-backends/">Decap CMS documentation</a>.</p>
    </body>
    </html>
  `;

  return new Response(infoHtml, {
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
      ...corsHeaders,
    },
  });
}

// Main event listener
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
