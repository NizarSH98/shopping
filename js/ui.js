// UI Module
// Handles DOM manipulation and rendering

import {
    formatPrice,
    getCompareAtPrice,
    getProductCtaState,
    getStockState,
    getEffectivePrice
} from './products.js';
import { CONFIG } from './config.js';

/**
 * Render announcement bar countdown text
 * @param {string} value - countdown value
 */
export function updateAnnouncementCountdown(value) {
    const countdown = document.getElementById('announcementCountdown');
    if (countdown) {
        countdown.textContent = value;
    }
}

/**
 * Create nested navigation tree for desktop and drawer
 * @param {Array} categories - category tree
 */
export function renderCategoryNavigation(categories = []) {
    const desktopContainer = document.getElementById('desktopCategoryNav');
    const mobileContainer = document.getElementById('mobileCategoryNav');

    if (desktopContainer) {
        desktopContainer.innerHTML = '';
        categories.forEach(group => {
            const details = document.createElement('details');
            details.className = 'nav-group';

            const summary = document.createElement('summary');
            summary.textContent = group.label;
            details.appendChild(summary);

            const list = document.createElement('ul');
            (group.children || []).forEach(child => {
                const item = document.createElement('li');
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'category-link';
                button.dataset.category = child.category || '';
                button.textContent = child.label;
                item.appendChild(button);
                list.appendChild(item);
            });

            details.appendChild(list);
            desktopContainer.appendChild(details);
        });
    }

    if (mobileContainer) {
        mobileContainer.innerHTML = '';
        categories.forEach(group => {
            const details = document.createElement('details');
            details.className = 'drawer-group';

            const summary = document.createElement('summary');
            summary.textContent = group.label;
            details.appendChild(summary);

            const list = document.createElement('ul');
            (group.children || []).forEach(child => {
                const item = document.createElement('li');
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'category-link';
                button.dataset.category = child.category || '';
                button.textContent = child.label;
                item.appendChild(button);
                list.appendChild(item);
            });

            details.appendChild(list);
            mobileContainer.appendChild(details);
        });
    }
}

/**
 * Toggle mobile drawer visibility
 * @param {boolean} show - show/hide
 */
export function toggleMobileDrawer(show) {
    const drawer = document.getElementById('mobileDrawer');
    const trigger = document.getElementById('openDrawer');
    if (!drawer) return;

    drawer.classList.toggle('active', show);
    drawer.setAttribute('aria-hidden', show ? 'false' : 'true');
    document.body.classList.toggle('drawer-open', show);

    if (trigger) {
        trigger.setAttribute('aria-expanded', show ? 'true' : 'false');
    }

    if (show) {
        drawer.querySelector('.category-link, #closeDrawer')?.focus();
    } else {
        trigger?.focus();
    }
}

/**
 * Update breadcrumb text
 * @param {string} category - selected category
 */
export function updateBreadcrumb(category = '') {
    const current = document.getElementById('breadcrumbCurrent');
    if (current) {
        current.textContent = category || 'All Products';
    }
}

/**
 * Create a product card element
 * @param {Object} product - Product data
 * @returns {HTMLElement} Product card element
 */
export function createProductCard(product) {
    const card = document.createElement('article');
    card.className = 'product-card reveal-item';
    card.dataset.productId = product.id;

    // Image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'product-image-container';

    const img = document.createElement('img');
    img.className = 'product-image';
    img.alt = product.name;
    img.dataset.src = product.images?.[0] || '';
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23f3f4f6"/%3E%3C/svg%3E';
    const imageLink = document.createElement('a');
    imageLink.href = `./product.html?id=${product.id}`;
    imageLink.className = 'product-link';
    imageLink.appendChild(img);
    imageContainer.appendChild(imageLink);

    const compareAt = getCompareAtPrice(product);
    const currentPrice = getEffectivePrice(product);

    if (compareAt) {
        const percent = Math.round(((compareAt - currentPrice) / compareAt) * 100);
        const badge = document.createElement('span');
        badge.className = 'product-badge sale';
        badge.textContent = `${percent}% OFF`;
        imageContainer.appendChild(badge);
    }

    const stockState = getStockState(product);
    const stockBadge = document.createElement('span');
    stockBadge.className = `stock-pill ${stockState}`;
    stockBadge.textContent =
        stockState === 'sold-out'
            ? 'Sold Out'
            : stockState === 'low-stock'
                ? 'Low Stock'
                : 'In Stock';
    imageContainer.appendChild(stockBadge);

    card.appendChild(imageContainer);

    // Product info
    const info = document.createElement('div');
    info.className = 'product-info';

    const brand = document.createElement('div');
    brand.className = 'product-brand';
    brand.textContent = product.brand;
    info.appendChild(brand);

    const name = document.createElement('h3');
    name.className = 'product-name';
    const nameLink = document.createElement('a');
    nameLink.href = `./product.html?id=${product.id}`;
    nameLink.className = 'product-link';
    nameLink.textContent = product.name;
    name.appendChild(nameLink);
    info.appendChild(name);

    if (product.excerpt) {
        const description = document.createElement('p');
        description.className = 'product-description';
        description.textContent = product.excerpt;
        info.appendChild(description);
    }

    // Footer
    const footer = document.createElement('div');
    footer.className = 'product-footer';

    const priceWrap = document.createElement('div');
    priceWrap.className = 'product-pricing';

    const currentPriceEl = document.createElement('div');
    currentPriceEl.className = 'product-price current';
    currentPriceEl.textContent = formatPrice(currentPrice);
    priceWrap.appendChild(currentPriceEl);

    if (compareAt) {
        const comparePriceEl = document.createElement('div');
        comparePriceEl.className = 'product-price compare';
        comparePriceEl.textContent = formatPrice(compareAt);
        priceWrap.appendChild(comparePriceEl);
    }

    footer.appendChild(priceWrap);

    const button = document.createElement('button');
    const ctaState = getProductCtaState(product);

    button.className = 'add-to-cart-button';
    button.dataset.productId = product.id;
    button.dataset.ctaState = ctaState;

    if (ctaState === 'sold-out') {
        button.disabled = true;
        button.textContent = 'Sold out';
    } else if (ctaState === 'choose') {
        button.textContent = 'Choose options';
    } else {
        button.innerHTML = '<i class="fas fa-cart-plus"></i> Add to Bag';
    }

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
    products.forEach((product, index) => {
        const card = createProductCard(product);
        card.style.animationDelay = `${index * 30}ms`;
        container.appendChild(card);
    });

    // Initialize lazy loading
    initializeLazyLoading();
}

/**
 * Render pagination controls
 * @param {number} currentPage - selected page
 * @param {number} totalPages - total pages
 */
export function renderPagination(currentPage, totalPages) {
    const pagination = document.getElementById('paginationControls');
    if (!pagination) return;

    pagination.innerHTML = '';

    if (totalPages <= 1) {
        pagination.classList.add('hidden');
        return;
    }

    pagination.classList.remove('hidden');

    const createPageButton = (label, page, disabled = false, active = false) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `page-button ${active ? 'active' : ''}`;
        button.textContent = label;
        button.disabled = disabled;
        button.dataset.page = page;
        pagination.appendChild(button);
    };

    createPageButton('Prev', currentPage - 1, currentPage === 1);

    for (let i = 1; i <= totalPages; i += 1) {
        createPageButton(String(i), i, false, i === currentPage);
    }

    createPageButton('Next', currentPage + 1, currentPage === totalPages);
}

/**
 * Toggle product view mode
 * @param {'grid'|'list'} view - selected view
 */
export function setProductViewMode(view) {
    const grid = document.getElementById('productsGrid');
    const toggles = document.querySelectorAll('[data-view-toggle]');

    if (grid) {
        grid.classList.toggle('list-view', view === 'list');
    }

    toggles.forEach(toggle => {
        toggle.classList.toggle('active', toggle.dataset.viewToggle === view);
    });
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
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            modal.querySelector('#closeCart')?.focus();
        } else {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
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
 * Update free-shipping UI in cart summary
 * @param {{threshold:number,remaining:number,progress:number,qualified:boolean}} data - progress metadata
 */
export function updateFreeShippingUI(data) {
    const bar = document.getElementById('freeShippingBar');
    const text = document.getElementById('freeShippingText');

    if (bar) {
        bar.style.width = `${data.progress || 0}%`;
    }

    if (text) {
        if (data.qualified) {
            text.textContent = 'You unlocked free delivery.';
        } else {
            text.textContent = `Add ${formatPrice(data.remaining)} more for free delivery.`;
        }
    }
}

/**
 * Render recently viewed items
 * @param {Array} products - recently viewed products
 */
export function renderRecentlyViewed(products = []) {
    const section = document.getElementById('recentlyViewedSection');
    const container = document.getElementById('recentlyViewedGrid');

    if (!section || !container) return;

    container.innerHTML = '';

    if (products.length === 0) {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');
    products.slice(0, 4).forEach(product => {
        const card = createProductCard(product);
        container.appendChild(card);
    });
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

/**
 * Populate brand filter dropdown
 * @param {Array} brands - brand names
 */
export function populateBrandFilter(brands) {
    const select = document.getElementById('brandFilter');
    if (!select) return;

    select.innerHTML = '<option value="">All Brands</option>';

    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        select.appendChild(option);
    });
}
