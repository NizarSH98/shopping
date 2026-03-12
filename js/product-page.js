import { fetchProducts, getProductById, formatPrice, getCompareAtPrice, getEffectivePrice, getProductCtaState } from './products.js';
import {
    initializeCart,
    addToCart,
    getCartItems,
    getCartCount,
    getCartTotal,
    updateCartItemQuantity,
    removeFromCart,
    generateWhatsAppMessage,
    generateWhatsAppUrl,
    getFreeShippingProgress
} from './cart.js';
import {
    renderCartItems,
    updateCartBadge,
    updateCartTotal,
    updateCartItemCount,
    toggleCartModal,
    toggleEmptyCartState,
    showNotification,
    updateFreeShippingUI,
    renderRecentlyViewed
} from './ui.js';
import { trackRecentlyViewed, getRecentlyViewedProducts } from './recently-viewed.js';

let currentProductId = '';

async function init() {
    await fetchProducts();
    initializeCart();
    setupProduct();
    setupEvents();
    updateCartDisplay();
    renderRecentlyViewed(getRecentlyViewedProducts(currentProductId));
}

function setupProduct() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    const product = getProductById(productId || '');

    if (!product) {
        document.getElementById('productDetail').innerHTML = '<p>Product not found. <a href="./index.html">Back to collection</a>.</p>';
        return;
    }

    currentProductId = product.id;
    trackRecentlyViewed(product.id);

    document.getElementById('productBreadcrumb').textContent = product.name;

    const compareAt = getCompareAtPrice(product);
    const effectivePrice = getEffectivePrice(product);
    const ctaState = getProductCtaState(product);

    document.getElementById('productDetail').innerHTML = `
        <div class="product-detail-media">
          <img src="${product.images?.[0] || ''}" alt="${product.name}">
        </div>
        <div class="product-detail-info">
          <p class="product-brand">${product.brand || 'House Brand'}</p>
          <h1>${product.name}</h1>
          <p>${product.description || ''}</p>
          <div class="product-pricing">
            <div class="product-price current">${formatPrice(effectivePrice)}</div>
            ${compareAt ? `<div class="product-price compare">${formatPrice(compareAt)}</div>` : ''}
          </div>
          <button id="productAddToBag" class="add-to-cart-button" data-cta-state="${ctaState}" ${ctaState === 'sold-out' ? 'disabled' : ''}>
            ${ctaState === 'sold-out' ? 'Sold out' : ctaState === 'choose' ? 'Choose options' : 'Add to Bag'}
          </button>
        </div>
    `;

    const addButton = document.getElementById('productAddToBag');
    addButton?.addEventListener('click', () => {
        if (ctaState === 'choose') {
            showNotification('Please choose a variant option at checkout note.', 'info');
            return;
        }

        addToCart(product.id, 1);
        showNotification('Product added to cart!', 'success');
        updateCartDisplay();
    });
}

function setupEvents() {
    document.getElementById('cartButton')?.addEventListener('click', () => {
        toggleCartModal(true);
        updateCartDisplay();
    });

    document.getElementById('closeCart')?.addEventListener('click', () => toggleCartModal(false));

    document.getElementById('cartModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'cartModal') {
            toggleCartModal(false);
        }
    });

    document.getElementById('cartItems')?.addEventListener('click', (e) => {
        const plus = e.target.closest('.increase-quantity');
        const minus = e.target.closest('.decrease-quantity');
        const remove = e.target.closest('.remove-button');

        if (plus) {
            const id = plus.dataset.productId;
            const item = getCartItems().find(entry => entry.product.id === id);
            if (item) updateCartItemQuantity(id, item.quantity + 1);
            updateCartDisplay();
        }

        if (minus) {
            const id = minus.dataset.productId;
            const item = getCartItems().find(entry => entry.product.id === id);
            if (item) updateCartItemQuantity(id, item.quantity - 1);
            updateCartDisplay();
        }

        if (remove) {
            removeFromCart(remove.dataset.productId);
            updateCartDisplay();
        }
    });


    document.getElementById('recentlyViewedGrid')?.addEventListener('click', (e) => {
        const button = e.target.closest('.add-to-cart-button');
        if (!button || button.disabled) return;

        const productId = button.dataset.productId;
        const ctaState = button.dataset.ctaState;

        if (ctaState === 'choose') {
            window.location.href = `./product.html?id=${productId}`;
            return;
        }

        addToCart(productId, 1);
        showNotification('Product added to cart!', 'success');
        updateCartDisplay();
    });

    document.getElementById('sendWhatsAppButton')?.addEventListener('click', () => {
        const customerName = document.getElementById('customerName')?.value || '';
        const orderNotes = document.getElementById('orderNotes')?.value || '';
        const url = generateWhatsAppUrl(generateWhatsAppMessage(customerName, orderNotes));
        window.open(url, '_blank');
    });
}

function updateCartDisplay() {
    const items = getCartItems();
    const count = getCartCount();
    const total = getCartTotal();

    updateCartBadge(count);
    renderCartItems(items, document.getElementById('cartItems'));
    updateCartTotal(total);
    updateCartItemCount(count);
    toggleEmptyCartState(items.length === 0);
    updateFreeShippingUI(getFreeShippingProgress());
}

init();
