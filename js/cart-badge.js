/**
 * Lightweight cart badge for secondary pages.
 * Shows the cart item count and links back to the main shop page.
 * No heavy dependencies — just reads from localStorage.
 */
(function() {
  const STORAGE_KEY = 'glowhavenCart';

  function getCartCount() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return 0;
      const cart = JSON.parse(saved);
      return Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
    } catch { return 0; }
  }

  function updateBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    const count = getCartCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }

  // Cart button click — go to main shop
  document.addEventListener('DOMContentLoaded', () => {
    updateBadge();
    const btn = document.getElementById('cartButton');
    if (btn) {
      btn.addEventListener('click', () => {
        window.location.href = './index.html#productsGrid';
      });
    }
  });

  // Update badge if storage changes in another tab
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) updateBadge();
  });
})();
