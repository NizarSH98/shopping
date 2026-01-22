// UI Module
// Handles DOM manipulation and rendering

import { formatPrice } from './products.js';
import { CONFIG } from './config.js';

/**
 * Create a product card element
 * @param {Object} product - Product data
 * @returns {HTMLElement} Product card element
 */
export function createProductCard(product) {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.dataset.productId = product.id;

    // Image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'product-image-container';

    const img = document.createElement('img');
    img.className = 'product-image';
    img.alt = product.name;
    img.dataset.src = product.images[0]; // Lazy load
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f3f4f6"/%3E%3C/svg%3E';
    imageContainer.appendChild(img);

    // Badges
    if (product.featured) {
        const badge = document.createElement('span');
        badge.className = 'product-badge featured';
        badge.textContent = 'Featured';
        imageContainer.appendChild(badge);
    }

    if (!product.in_stock) {
        const badge = document.createElement('span');
        badge.className = 'product-badge out-of-stock';
        badge.textContent = 'Out of Stock';
        imageContainer.appendChild(badge);
    }

    card.appendChild(imageContainer);

    // Product info
    const info = document.createElement('div');
    info.className = 'product-info';

    const category = document.createElement('div');
    category.className = 'product-category';
    category.textContent = product.category;
    info.appendChild(category);

    const name = document.createElement('h3');
    name.className = 'product-name';
    name.textContent = product.name;
    info.appendChild(name);

    const description = document.createElement('p');
    description.className = 'product-description';
    description.textContent = product.description;
    info.appendChild(description);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'product-footer';

    const price = document.createElement('div');
    price.className = 'product-price';
    price.textContent = formatPrice(product.price);
    footer.appendChild(price);

    const button = document.createElement('button');
    button.className = 'add-to-cart-button';
    button.dataset.productId = product.id;
    button.disabled = !product.in_stock;
    button.innerHTML = product.in_stock 
        ? '<i class="fas fa-cart-plus"></i> Add'
        : 'Out of Stock';
    footer.appendChild(button);

    info.appendChild(footer);
    card.appendChild(info);

    return card;
}

/**
 * Render products to the grid
 * @param {Array} products - Array of products
 * @param {HTMLElement} container - Container element
 */
export function renderProducts(products, container) {
    // Clear container
    container.innerHTML = '';

    if (products.length === 0) {
        return;
    }

    // Create and append product cards
    products.forEach(product => {
        const card = createProductCard(product);
        container.appendChild(card);
    });

    // Initialize lazy loading
    initializeLazyLoading();
}

/**
 * Create a cart item element
 * @param {Object} item - Cart item with product data
 * @returns {HTMLElement} Cart item element
 */
export function createCartItemElement(item) {
    const { product, quantity } = item;

    const itemDiv = document.createElement('div');
    itemDiv.className = 'cart-item';
    itemDiv.dataset.productId = product.id;

    const img = document.createElement('img');
    img.className = 'cart-item-image';
    img.src = product.images[0];
    img.alt = product.name;
    itemDiv.appendChild(img);

    const details = document.createElement('div');
    details.className = 'cart-item-details';

    const name = document.createElement('div');
    name.className = 'cart-item-name';
    name.textContent = product.name;
    details.appendChild(name);

    const price = document.createElement('div');
    price.className = 'cart-item-price';
    price.textContent = formatPrice(product.price);
    details.appendChild(price);

    const controls = document.createElement('div');
    controls.className = 'cart-item-controls';

    const decreaseBtn = document.createElement('button');
    decreaseBtn.className = 'quantity-button decrease-quantity';
    decreaseBtn.dataset.productId = product.id;
    decreaseBtn.innerHTML = '<i class="fas fa-minus"></i>';
    controls.appendChild(decreaseBtn);

    const quantitySpan = document.createElement('span');
    quantitySpan.className = 'cart-item-quantity';
    quantitySpan.textContent = quantity;
    controls.appendChild(quantitySpan);

    const increaseBtn = document.createElement('button');
    increaseBtn.className = 'quantity-button increase-quantity';
    increaseBtn.dataset.productId = product.id;
    increaseBtn.innerHTML = '<i class="fas fa-plus"></i>';
    controls.appendChild(increaseBtn);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-button';
    removeBtn.dataset.productId = product.id;
    removeBtn.innerHTML = '<i class="fas fa-trash"></i> Remove';
    controls.appendChild(removeBtn);

    details.appendChild(controls);
    itemDiv.appendChild(details);

    return itemDiv;
}

/**
 * Render cart items
 * @param {Array} items - Cart items
 * @param {HTMLElement} container - Container element
 */
export function renderCartItems(items, container) {
    container.innerHTML = '';

    if (items.length === 0) {
        return;
    }

    items.forEach(item => {
        const itemElement = createCartItemElement(item);
        container.appendChild(itemElement);
    });
}

/**
 * Update cart badge
 * @param {number} count - Item count
 */
export function updateCartBadge(count) {
    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.textContent = count;
        
        // Add animation
        badge.style.transform = 'scale(1.2)';
        setTimeout(() => {
            badge.style.transform = 'scale(1)';
        }, 200);
    }
}

/**
 * Update cart total display
 * @param {number} total - Total price
 */
export function updateCartTotal(total) {
    const totalElement = document.getElementById('cartTotal');
    if (totalElement) {
        totalElement.textContent = formatPrice(total);
    }
}

/**
 * Update cart item count display
 * @param {number} count - Item count
 */
export function updateCartItemCount(count) {
    const countElement = document.getElementById('cartItemCount');
    if (countElement) {
        countElement.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
    }
}

/**
 * Show or hide cart modal
 * @param {boolean} show - Whether to show the modal
 */
export function toggleCartModal(show) {
    const modal = document.getElementById('cartModal');
    if (modal) {
        if (show) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
}

/**
 * Show/hide empty cart message and checkout form
 * @param {boolean} isEmpty - Whether cart is empty
 */
export function toggleEmptyCartState(isEmpty) {
    const emptyMessage = document.getElementById('emptyCartMessage');
    const checkoutForm = document.getElementById('checkoutForm');
    const sendButton = document.getElementById('sendWhatsAppButton');

    if (emptyMessage && checkoutForm && sendButton) {
        if (isEmpty) {
            emptyMessage.style.display = 'block';
            checkoutForm.style.display = 'none';
        } else {
            emptyMessage.style.display = 'none';
            checkoutForm.style.display = 'block';
            sendButton.disabled = false;
        }
    }
}

/**
 * Update results count display
 * @param {number} count - Number of results
 */
export function updateResultsCount(count) {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.textContent = `Showing ${count} ${count === 1 ? 'product' : 'products'}`;
    }
}

/**
 * Show/hide loading state
 * @param {boolean} show - Whether to show loading
 */
export function toggleLoadingState(show) {
    const loading = document.getElementById('loadingState');
    const grid = document.getElementById('productsGrid');

    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }

    if (grid) {
        grid.style.display = show ? 'none' : 'grid';
    }
}

/**
 * Show/hide no results state
 * @param {boolean} show - Whether to show no results
 */
export function toggleNoResultsState(show) {
    const noResults = document.getElementById('noResults');
    if (noResults) {
        noResults.style.display = show ? 'block' : 'none';
    }
}

/**
 * Initialize lazy loading for images
 */
function initializeLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: `${CONFIG.display.lazyLoadOffset}px`
    });

    images.forEach(img => imageObserver.observe(img));
}

/**
 * Show notification toast
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, warning, info)
 */
export function showNotification(message, type = 'success') {
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: type,
        title: message,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });
}

/**
 * Populate category filter dropdown
 * @param {Array} categories - Array of category names
 */
export function populateCategoryFilter(categories) {
    const select = document.getElementById('categoryFilter');
    if (!select) return;

    // Keep the "All Categories" option
    select.innerHTML = '<option value="">All Categories</option>';

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        select.appendChild(option);
    });
}
