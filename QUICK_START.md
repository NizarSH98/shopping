# ⚡ Quick Start (5 Minutes)

Get your shop running in 5 minutes!

## 1. Configure WhatsApp (1 min)

Edit `js/config.js`:

```javascript
whatsapp: {
    phoneNumber: '15551234567',  // Your WhatsApp: country code + number (no + or spaces)
}
```

## 2. Set Base Path (30 sec)

Still in `js/config.js`:

```javascript
site: {
    basePath: '/YOUR_REPO_NAME',  // For GitHub Pages project site
    // basePath: '',               // For custom domain
}
```

## 3. Push to GitHub (1 min)

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## 4. Enable GitHub Pages (1 min)

1. Go to GitHub repo → **Settings** → **Pages**
2. Source: **main** branch, **/ (root)** folder
3. Click **Save**
4. Wait 2-3 minutes

## 5. Visit Your Shop! (30 sec)

Open: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

✅ Your shop is live!

---

## Next: Setup Admin (Optional)

Want to add/edit products via admin panel? See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) Part 3-5 (adds 10 minutes).

**What you need:**
- GitHub OAuth App (free)
- Cloudflare Worker (free)

**What you get:**
- Visual admin interface
- Add/edit/delete products
- Upload images
- No code editing needed

---

## Test Your Shop

Try these:

✅ **Search**: Type "headphones" or "yoga"  
✅ **Filter**: Select "Electronics" category  
✅ **Sort**: Try "Price: Low to High"  
✅ **Cart**: Add items, adjust quantities  
✅ **WhatsApp**: Click "Send Order" (opens WhatsApp)  

---

## Replace Sample Data

### Quick Method (via files):

1. Replace images in `assets/products/`
2. Edit `data/products.json`
3. Commit and push

### Visual Method (with admin):

1. Setup admin (see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md))
2. Go to `/admin/`
3. Edit products visually
4. Upload images
5. Save & Publish

---

## Troubleshooting

**Blank page?**
- Check `basePath` in `js/config.js`
- Wait 3-5 minutes for GitHub Pages
- Hard refresh (Ctrl+F5)

**Images not showing?**
- Check paths in `products.json` start with `./`
- Verify files exist in `assets/products/`
- Hard refresh (Ctrl+F5)

**WhatsApp not opening?**
- Check phone number format (no + or spaces)
- Test with your own number first

---

## 📚 Full Documentation

- **[README.md](README.md)** - Complete guide with features, setup, customization
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Step-by-step deployment with admin
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Technical architecture and file structure

---

**Need help?** Check the full [README.md](README.md) or [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)!

**Ready to sell! 🚀**
