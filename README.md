# 🛒 Static Shopping Website

A complete, production-ready static shopping website that can be hosted on GitHub Pages. Features product catalog, search, cart functionality, and WhatsApp order integration. Admin powered by Decap CMS with GitHub authentication.

## 🌟 Features

### Public Shop
- **Responsive product grid** with card layout
- **Advanced search** using Fuse.js (fuzzy search across name, category, tags, description)
- **Filters**: Category, price range, in-stock status
- **Sorting**: Featured, price (low/high), newest
- **Shopping cart** with localStorage persistence
- **WhatsApp integration** for order placement (no payment processing)
- **Lazy-loaded images** for better performance
- **Mobile-friendly** responsive design

### Admin Panel
- **Decap CMS** (formerly Netlify CMS) for content management
- **GitHub OAuth** authentication
- Add, edit, delete products
- Upload and manage product images
- All changes committed directly to your GitHub repository

## 📁 Project Structure

```
shopping/
├── index.html              # Main shop page
├── admin/
│   ├── index.html         # Decap CMS admin interface
│   └── config.yml         # CMS configuration
├── css/
│   └── style.css          # Custom styles
├── js/
│   ├── config.js          # Site configuration (WhatsApp, currency, etc.)
│   ├── products.js        # Product data fetching and management
│   ├── search.js          # Fuse.js search implementation
│   ├── cart.js            # Shopping cart logic
│   ├── ui.js              # DOM manipulation and rendering
│   └── main.js            # Application bootstrap
├── data/
│   └── products.json      # Product data (single source of truth)
├── assets/
│   └── products/          # Product images
└── README.md              # This file
```

## 🚀 Quick Start

### 1. Fork and Clone

```bash
# Fork this repository on GitHub, then clone it
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### 2. Configure WhatsApp

Edit `js/config.js`:

```javascript
export const CONFIG = {
    whatsapp: {
        // Replace with your WhatsApp number (include country code, no + or spaces)
        // Example: For +1 (555) 123-4567, use '15551234567'
        phoneNumber: '1234567890',
    },
    // ... other settings
};
```

### 3. Update GitHub Pages Base Path

If you're using a project site (not a custom domain), update the `basePath` in `js/config.js`:

```javascript
site: {
    basePath: '/YOUR_REPO_NAME',  // e.g., '/shopping'
    // For custom domain, use: basePath: ''
}
```

### 4. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** > **Pages**
3. Under **Source**, select **main** branch
4. Click **Save**
5. Your site will be published at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### 5. Test the Public Shop

Visit your GitHub Pages URL. You should see:
- Product grid with 12 sample products
- Search, filter, and sort functionality
- Working shopping cart
- WhatsApp order button (opens WhatsApp with order details)

## 🔐 Admin Setup (Decap CMS)

The admin interface requires GitHub OAuth authentication. Since GitHub Pages has no backend, we need an OAuth proxy.

### Why GitHub OAuth?

- ✅ Secure, industry-standard authentication
- ✅ No custom password handling
- ✅ Git-based: all changes are commits
- ✅ Full version control and audit trail
- ✅ Free and reliable

### OAuth Proxy Setup (Cloudflare Workers)

We'll use Cloudflare Workers (free tier) as our OAuth proxy.

#### Step 1: Create GitHub OAuth App

1. Go to [GitHub Settings > Developer Settings > OAuth Apps](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: `My Shop Admin`
   - **Homepage URL**: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`
   - **Authorization callback URL**: `https://YOUR_OAUTH_PROXY.workers.dev/callback`
4. Click **Register application**
5. Copy your **Client ID** and **Client Secret** (keep these secure!)

#### Step 2: Deploy OAuth Proxy to Cloudflare Workers

1. Sign up for [Cloudflare](https://cloudflare.com) (free tier is sufficient)

2. Install Wrangler CLI:
```bash
npm install -g wrangler
wrangler login
```

3. Create a new Worker:
```bash
wrangler init decap-oauth-proxy
cd decap-oauth-proxy
```

4. Replace `src/index.js` with the following code:

```javascript
// Decap CMS GitHub OAuth Proxy for Cloudflare Workers
// Based on https://github.com/vencax/netlify-cms-github-oauth-provider

const CLIENT_ID = 'YOUR_GITHUB_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_GITHUB_CLIENT_SECRET';

async function handleRequest(request) {
  const url = new URL(request.url);

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // OAuth callback
  if (url.pathname === '/callback') {
    const code = url.searchParams.get('code');
    
    if (!code) {
      return new Response('Missing code parameter', { status: 400 });
    }

    try {
      // Exchange code for token
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

      // Return success HTML
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authorization Complete</title>
          <script>
            window.opener.postMessage(
              'authorization:github:success:${JSON.stringify(data)}',
              window.location.origin
            );
            window.close();
          </script>
        </head>
        <body>
          <p>Authorization complete. You can close this window.</p>
        </body>
        </html>
      `;

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          ...corsHeaders,
        },
      });
    } catch (error) {
      return new Response(`Error: ${error.message}`, { 
        status: 500,
        headers: corsHeaders,
      });
    }
  }

  // Auth endpoint (initiates OAuth flow)
  if (url.pathname === '/auth') {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo,user`;
    return Response.redirect(githubAuthUrl, 302);
  }

  return new Response('Decap CMS OAuth Proxy. Use /auth to authenticate.', {
    headers: corsHeaders,
  });
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
```

5. Deploy the Worker:
```bash
wrangler publish
```

6. Your OAuth proxy URL will be: `https://YOUR_WORKER_NAME.workers.dev`

#### Step 3: Configure Decap CMS

Edit `admin/config.yml`:

```yaml
backend:
  name: github
  repo: YOUR_USERNAME/YOUR_REPO_NAME  # e.g., johndoe/shopping
  branch: main  # or 'master' if that's your default branch
  base_url: https://YOUR_OAUTH_PROXY.workers.dev  # Your Cloudflare Worker URL
```

#### Step 4: Test Admin Access

1. Visit `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/admin/`
2. Click **Login with GitHub**
3. Authorize the OAuth app
4. You should see the Decap CMS dashboard

## 📝 How to Add/Edit Products

### For Technical Admins

#### Option 1: Using Decap CMS (Recommended)

1. Go to `/admin/`
2. Log in with GitHub
3. Navigate to **Products**
4. Click **Edit** on `products.json`
5. Use the visual editor to:
   - Add new products (click **Add Products**)
   - Edit existing products
   - Upload images
   - Delete products
6. Click **Save** (creates a draft)
7. Click **Publish** to commit changes

#### Option 2: Direct JSON Editing

Edit `data/products.json` manually:

```json
{
  "products": [
    {
      "id": "prod-013",
      "name": "New Product",
      "description": "Product description here",
      "price": 49.99,
      "currency": "USD",
      "images": ["./assets/products/new-product.jpg"],
      "category": "Electronics",
      "tags": ["tag1", "tag2"],
      "featured": false,
      "in_stock": true,
      "created_at": "2026-01-22T10:00:00Z",
      "updated_at": "2026-01-22T10:00:00Z"
    }
  ]
}
```

Commit and push to GitHub. Changes go live automatically.

### For Non-Technical Admins

**Simple 5-Step Process:**

1. **Go to the admin page**: `https://YOUR_SITE.github.io/admin/`
2. **Click "Login with GitHub"** and enter your credentials
3. **Click "Products"** in the left sidebar
4. **Click "Edit"** on the products file
5. **Make your changes**:
   - Click **"Add Products"** for a new item
   - Fill in: Name, Description, Price, Category
   - Upload images by clicking **"Add Images"**
   - Toggle **"Featured"** and **"In Stock"**
6. **Click "Save"** then **"Publish"**

Changes appear on the website within seconds!

## 🛠️ Configuration Options

### Currency Settings

Edit `js/config.js`:

```javascript
currency: {
    code: 'USD',      // Currency code
    symbol: '$',      // Currency symbol
    position: 'before' // 'before' ($10) or 'after' (10€)
}
```

### Product Categories

Categories are dynamically generated from products. To add a new category, simply add a product with that category.

Supported categories in Decap CMS:
- Electronics
- Clothing
- Home & Kitchen
- Sports & Fitness
- Accessories
- Other

To add more, edit `admin/config.yml`:

```yaml
- { label: "Category", name: "category", widget: "select", options: ["Electronics", "Clothing", "Your New Category"] }
```

### WhatsApp Message Template

Edit `js/config.js`:

```javascript
whatsapp: {
    phoneNumber: '1234567890',
    messagePrefix: '🛒 *New Order from My Shop*\n\n'
}
```

## 🎨 Customization

### Change Site Name and Branding

1. Update `index.html`:
```html
<title>Your Shop Name</title>
<strong><i class="fas fa-shopping-bag"></i> Your Shop Name</strong>
```

2. Update `js/config.js`:
```javascript
site: {
    name: 'Your Shop Name',
    description: 'Your tagline here'
}
```

### Styling

Edit `css/style.css`. Uses CSS custom properties (variables):

```css
:root {
    --primary-color: #2563eb;     /* Main brand color */
    --primary-hover: #1d4ed8;     /* Hover state */
    --success-color: #16a34a;     /* Success messages */
    /* ... more variables */
}
```

### Libraries Used (via CDN)

- **Pico CSS**: Minimal CSS framework
- **Fuse.js**: Fuzzy search
- **Font Awesome**: Icons
- **SweetAlert2**: Beautiful modals and toasts

All loaded via CDN - no build process required!

## 📱 WhatsApp Integration

### How It Works

1. Customer adds products to cart
2. Customer fills optional fields (name, notes)
3. Customer clicks "Send Order to WhatsApp"
4. App generates formatted message with:
   - Customer name (if provided)
   - Line items with quantities and prices
   - Total amount
   - Order notes (if provided)
5. Message is URL-encoded and opened in WhatsApp (web or app)
6. Customer reviews and sends to your WhatsApp number

### Format Example

```
🛒 *New Order from Shopping Site*

👤 Customer: John Doe

📦 *Order Details:*
━━━━━━━━━━━━━━━━
1. Wireless Bluetooth Headphones
   Qty: 2 × $79.99 = $159.98

2. Yoga Mat with Carrying Strap
   Qty: 1 × $34.99 = $34.99

━━━━━━━━━━━━━━━━
💰 *Total: $194.97*

📝 *Notes:*
Please deliver after 5 PM
```

### Testing WhatsApp

Use [wa.me](https://wa.me) tester:
- For testing, use your own number
- Message opens in WhatsApp Web or app
- No actual order is placed until you manually send it

## 🔍 Search & Filters

### Search

Powered by **Fuse.js** - searches across:
- Product name (40% weight)
- Description (30% weight)
- Category (20% weight)
- Tags (10% weight)

Fuzzy matching allows typos and partial matches.

### Filters

- **Category**: Dropdown of all categories
- **Price Range**: Slider (0 - $200 max by default)
- **In Stock Only**: Checkbox to hide out-of-stock items

### Sorting

- Featured (default)
- Price: Low to High
- Price: High to Low
- Newest (by updated_at)

## 🐛 Troubleshooting

### Products Not Loading

1. Check browser console for errors
2. Verify `data/products.json` is valid JSON
3. Ensure file paths are correct (check case sensitivity)
4. Clear browser cache

### Admin Login Not Working

1. Verify OAuth app is configured correctly
2. Check callback URL matches Worker URL
3. Check Worker logs in Cloudflare dashboard
4. Ensure `admin/config.yml` has correct repo and base_url

### Images Not Displaying

1. Check image paths in `products.json`
2. Verify images exist in `assets/products/`
3. Check browser network tab for 404 errors
4. Ensure relative paths start with `./`

### WhatsApp Not Opening

1. Verify phone number in `js/config.js` (no + or spaces)
2. Test with your own number first
3. Check URL encoding in browser network tab
4. Try WhatsApp Web if mobile app doesn't work

### GitHub Pages 404 Error

1. Ensure GitHub Pages is enabled in repo settings
2. Check branch is correct (main vs master)
3. Verify `basePath` is set correctly in config
4. Wait 5-10 minutes for initial deployment

## 🚀 Performance Optimization

The site is already optimized:

- ✅ **Lazy-loaded images** (only load when in viewport)
- ✅ **localStorage caching** for cart
- ✅ **Debounced search** (300ms delay)
- ✅ **Minimal dependencies** (all via CDN)
- ✅ **No build process** (instant updates)
- ✅ **Event delegation** (efficient DOM handling)

### Lighthouse Scores (Typical)

- Performance: 95+
- Accessibility: 90+
- Best Practices: 95+
- SEO: 90+

## 📄 License

MIT License - Feel free to use for commercial projects!

## 🤝 Contributing

This is a template project. Fork it and make it your own!

## 📞 Support

For issues:
1. Check this README's troubleshooting section
2. Check browser console for errors
3. Verify configuration files
4. Review GitHub repository settings

## 🎉 Credits

Built with:
- [Decap CMS](https://decapcms.org/)
- [Pico CSS](https://picocss.com/)
- [Fuse.js](https://fusejs.io/)
- [Font Awesome](https://fontawesome.com/)
- [SweetAlert2](https://sweetalert2.github.io/)
- [Cloudflare Workers](https://workers.cloudflare.com/)

---

**Ready to launch your shop?** Follow the Quick Start guide above and you'll be live in 10 minutes! 🚀
