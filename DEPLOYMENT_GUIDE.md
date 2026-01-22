# 🚀 Complete Deployment Guide

This guide walks you through deploying your static shopping website to GitHub Pages with full admin functionality.

## ⏱️ Total Time: ~15 minutes

## 📋 Prerequisites

- [x] GitHub account (free)
- [x] Cloudflare account (free tier is enough)
- [x] WhatsApp number for receiving orders
- [x] Git installed on your computer (or use GitHub web interface)

---

## Part 1: Initial Setup (5 minutes)

### Step 1.1: Fork or Clone Repository

**Option A: Using Git (Recommended)**

```bash
# Create new repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

# Copy all files from this project into your repo
# Then:
git add .
git commit -m "Initial commit: Static shopping site"
git push origin main
```

**Option B: Using GitHub Web Interface**

1. Create new repository on GitHub
2. Upload all project files via web interface
3. Commit changes

### Step 1.2: Configure WhatsApp

Edit `js/config.js`:

```javascript
whatsapp: {
    // Format: Country code + number (no spaces, no +)
    // Example for +1 (555) 123-4567:
    phoneNumber: '15551234567',
}
```

**Finding Your WhatsApp Number:**
- Open WhatsApp on your phone
- Go to Settings > Profile
- Your number is shown at the top
- Remove spaces, dashes, and the + sign
- Include country code

**Examples:**
- US: `+1 (555) 123-4567` → `15551234567`
- UK: `+44 20 1234 5678` → `442012345678`
- India: `+91 98765 43210` → `919876543210`

### Step 1.3: Set GitHub Pages Base Path

Edit `js/config.js`:

```javascript
site: {
    // If using username.github.io/repo-name:
    basePath: '/YOUR_REPO_NAME',
    
    // If using custom domain (e.g., shop.yoursite.com):
    basePath: '',
}
```

### Step 1.4: Commit Configuration Changes

```bash
git add js/config.js
git commit -m "Configure WhatsApp and base path"
git push origin main
```

---

## Part 2: Enable GitHub Pages (2 minutes)

### Step 2.1: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top right)
3. Scroll down to **Pages** (left sidebar)
4. Under **Source**:
   - Branch: `main` (or `master`)
   - Folder: `/ (root)`
5. Click **Save**

### Step 2.2: Wait for Deployment

- GitHub will show: "Your site is ready to be published at..."
- Wait 2-3 minutes for initial deployment
- URL format: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### Step 2.3: Test Public Site

Visit your GitHub Pages URL. You should see:
- ✅ Product grid with 12 sample products
- ✅ Search bar working
- ✅ Filters and sorting working
- ✅ Cart functionality
- ✅ WhatsApp button (test with empty cart = disabled)

**If you see a blank page or 404:**
- Check basePath in `js/config.js`
- Wait a few more minutes
- Check browser console for errors
- Ensure branch name is correct (main vs master)

---

## Part 3: Setup GitHub OAuth (5 minutes)

### Step 3.1: Create GitHub OAuth App

1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click **Developer settings** (left sidebar, bottom)
3. Click **OAuth Apps**
4. Click **New OAuth App**
5. Fill in the form:

```
Application name: My Shop Admin
Homepage URL: https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
Authorization callback URL: https://TEMP_PLACEHOLDER.workers.dev/callback
Description: CMS for my shop (optional)
```

6. Click **Register application**
7. You'll see:
   - **Client ID**: Copy this (e.g., `Iv1.abc123def456`)
   - **Client Secret**: Click "Generate a new client secret", then copy it

**⚠️ IMPORTANT:** Keep Client Secret secure! Don't commit it to your repo.

---

## Part 4: Deploy OAuth Proxy to Cloudflare (5 minutes)

### Step 4.1: Create Cloudflare Account

1. Go to [Cloudflare.com](https://www.cloudflare.com/)
2. Sign up for free account
3. Skip domain setup (we don't need it)

### Step 4.2: Install Wrangler CLI

**Option A: Using npm (if you have Node.js)**

```bash
npm install -g wrangler
```

**Option B: Using npm without global install**

```bash
npx wrangler --version
# Use 'npx wrangler' instead of 'wrangler' in all commands below
```

**Option C: Manual deployment (see Step 4.5)**

### Step 4.3: Login to Cloudflare

```bash
wrangler login
```

This will open a browser for authentication.

### Step 4.4: Create and Deploy Worker

```bash
# Create new worker project
wrangler init decap-oauth-proxy

# Choose:
# - Type: "Hello World" Worker
# - TypeScript: No
# - Git: Yes (optional)
# - Deploy: No (we'll do it manually)

cd decap-oauth-proxy
```

Copy the `oauth-proxy-worker.js` file from the project root to `src/index.js`:

```bash
# On Windows PowerShell:
Copy-Item ..\oauth-proxy-worker.js .\src\index.js

# On Mac/Linux:
cp ../oauth-proxy-worker.js src/index.js
```

Edit `src/index.js` and replace:

```javascript
const CLIENT_ID = 'YOUR_GITHUB_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_GITHUB_CLIENT_SECRET';
```

with your actual GitHub OAuth credentials.

Deploy:

```bash
wrangler publish
```

You'll see output like:

```
Published decap-oauth-proxy
  https://decap-oauth-proxy.YOUR_SUBDOMAIN.workers.dev
```

**Copy this Worker URL!** (e.g., `https://decap-oauth-proxy.abc123.workers.dev`)

### Step 4.5: Manual Deployment (Alternative)

If you can't use Wrangler CLI:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click **Workers & Pages**
3. Click **Create Application** > **Create Worker**
4. Name it: `decap-oauth-proxy`
5. Click **Deploy**
6. Click **Edit Code**
7. Replace all code with contents of `oauth-proxy-worker.js`
8. Update `CLIENT_ID` and `CLIENT_SECRET`
9. Click **Save and Deploy**
10. Copy the Worker URL from the top

### Step 4.6: Update GitHub OAuth App Callback

1. Go back to [GitHub OAuth Apps](https://github.com/settings/developers)
2. Click your OAuth App
3. Update **Authorization callback URL**:
   ```
   https://YOUR_WORKER_NAME.workers.dev/callback
   ```
4. Click **Update application**

---

## Part 5: Configure Decap CMS (2 minutes)

### Step 5.1: Update CMS Configuration

Edit `admin/config.yml`:

```yaml
backend:
  name: github
  repo: YOUR_USERNAME/YOUR_REPO_NAME    # e.g., johndoe/shopping
  branch: main                          # or 'master'
  base_url: https://YOUR_WORKER_NAME.workers.dev  # Cloudflare Worker URL
```

**Example:**

```yaml
backend:
  name: github
  repo: johndoe/my-shop
  branch: main
  base_url: https://decap-oauth-proxy.abc123.workers.dev
```

### Step 5.2: Commit and Push

```bash
git add admin/config.yml
git commit -m "Configure Decap CMS"
git push origin main
```

### Step 5.3: Wait for GitHub Pages to Rebuild

- Wait 1-2 minutes
- GitHub Pages automatically rebuilds when you push

---

## Part 6: Test Admin Access (1 minute)

### Step 6.1: Access Admin Panel

Visit: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/admin/`

### Step 6.2: Login with GitHub

1. Click **Login with GitHub**
2. You'll be redirected to GitHub
3. Click **Authorize** to grant access
4. You'll be redirected back to admin panel
5. You should see the Decap CMS dashboard

**If login fails:**
- Check browser console for errors
- Verify OAuth app callback URL is correct
- Check Cloudflare Worker logs (Cloudflare Dashboard > Workers > your worker > Logs)
- Ensure `admin/config.yml` has correct repo and base_url

### Step 6.3: Test Product Management

1. Click **Products** in sidebar
2. Click **Edit** on `products.json`
3. Try editing a product (change price, description, etc.)
4. Click **Save** (creates draft)
5. Click **Publish** (commits to GitHub)
6. Wait 1-2 minutes
7. Refresh public site - changes should appear!

---

## Part 7: Customize Your Shop (Optional)

### Step 7.1: Update Branding

Edit `index.html`:

```html
<title>Your Shop Name - Your Tagline</title>
<strong><i class="fas fa-shopping-bag"></i> Your Shop Name</strong>
```

Edit `js/config.js`:

```javascript
site: {
    name: 'Your Shop Name',
    description: 'Your tagline here'
}
```

### Step 7.2: Update Hero Section

Edit `index.html`:

```html
<section class="hero">
    <h1>Welcome to Your Shop</h1>
    <p>Your tagline here</p>
</section>
```

### Step 7.3: Customize Colors

Edit `css/style.css`:

```css
:root {
    --primary-color: #2563eb;     /* Your brand color */
    --primary-hover: #1d4ed8;
}
```

### Step 7.4: Replace Product Images

Option 1: Via Admin Panel
- Go to `/admin/`
- Edit products
- Upload new images

Option 2: Manually
- Replace files in `assets/products/`
- Update paths in `data/products.json`
- Commit and push

### Step 7.5: Add Your Products

Via Admin Panel:
1. Go to `/admin/`
2. Products > Edit
3. Click **Add Products**
4. Fill in details
5. Upload images
6. Save and Publish

Or edit `data/products.json` manually:

```json
{
  "id": "prod-xxx",
  "name": "Your Product",
  "description": "Product description",
  "price": 99.99,
  "currency": "USD",
  "images": ["./assets/products/your-image.jpg"],
  "category": "Your Category",
  "tags": ["tag1", "tag2"],
  "featured": false,
  "in_stock": true,
  "created_at": "2026-01-22T10:00:00Z",
  "updated_at": "2026-01-22T10:00:00Z"
}
```

---

## 🎉 Congratulations!

Your shop is now live at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### What You Can Do Now:

✅ **Customers can:**
- Browse products
- Search and filter
- Add to cart
- Send orders via WhatsApp

✅ **You can:**
- Add/edit/delete products via `/admin/`
- Upload product images
- Update prices and descriptions
- Mark items as in/out of stock
- Feature products

### Next Steps:

1. **Add real products** (replace sample data)
2. **Upload real images** (replace SVG placeholders)
3. **Test WhatsApp flow** (add item to cart, send order)
4. **Share your shop** (promote on social media)
5. **Optional: Add custom domain** (GitHub Pages supports it)

---

## 🔒 Security Best Practices

- ✅ **Never commit** `CLIENT_SECRET` to your repo
- ✅ **Use environment variables** in Cloudflare Worker (Wrangler Secrets)
- ✅ **Rotate OAuth secrets** if they're ever exposed
- ✅ **Enable 2FA** on GitHub account
- ✅ **Limit admin access** to trusted GitHub accounts only

### Using Wrangler Secrets (Recommended)

Instead of hardcoding CLIENT_SECRET:

```bash
# Set secrets (more secure)
wrangler secret put CLIENT_ID
# Paste your Client ID when prompted

wrangler secret put CLIENT_SECRET
# Paste your Client Secret when prompted
```

Then update Worker code:

```javascript
// Access secrets from environment
const CLIENT_ID = env.CLIENT_ID;
const CLIENT_SECRET = env.CLIENT_SECRET;
```

---

## 🆘 Troubleshooting

### Products not loading
- Check `data/products.json` is valid JSON
- Check browser console for errors
- Verify file paths are correct

### Admin login fails
- Verify OAuth app callback URL
- Check Cloudflare Worker is deployed
- Check `admin/config.yml` configuration
- View Worker logs in Cloudflare Dashboard

### WhatsApp not opening
- Verify phone number format (no + or spaces)
- Try with your own number first
- Check browser console for errors

### Images not showing
- Verify image paths in products.json
- Check files exist in assets/products/
- Try hard refresh (Ctrl+F5)

### Changes not appearing
- Wait 2-3 minutes for GitHub Pages rebuild
- Hard refresh browser (Ctrl+F5)
- Check commit was successful (GitHub repo)

---

## 📞 Need Help?

1. Check [README.md](README.md) troubleshooting section
2. Check browser console for errors (F12)
3. Check Cloudflare Worker logs
4. Verify all configuration files
5. Try incognito mode (rule out caching)

---

## 🌟 Pro Tips

### Custom Domain

1. Buy a domain (e.g., from Namecheap, Google Domains)
2. Add custom domain in GitHub Pages settings
3. Update DNS records (GitHub provides instructions)
4. Update `basePath: ''` in config.js
5. Update OAuth app URLs

### Performance

- ✅ Already optimized (lazy loading, debounced search, etc.)
- Consider enabling Cloudflare Pages (even faster)
- Compress images (use TinyPNG, Squoosh)

### SEO

- Add meta tags for social sharing (Open Graph, Twitter Cards)
- Add sitemap.xml and robots.txt
- Submit to Google Search Console
- Use descriptive product descriptions

### Analytics

Add Google Analytics or similar:

```html
<!-- Add to index.html before </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

---

**Ready to sell! 🚀**
