// Main Application Module
// Bootstrap and coordinate all app functionality

import { CONFIG } from './config.js';
import {
    fetchProducts,
    getAllProducts,
    getCategories,
    getBrands,
    filterProducts,
    sortProducts
} from './products.js';
import { initializeSearch, searchProducts } from './search.js';
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
    renderProducts,
    renderCartItems,
    updateCartBadge,
    updateCartTotal,
    updateCartItemCount,
    toggleCartModal,
    toggleEmptyCartState,
    updateResultsCount,
    toggleLoadingState,
    toggleNoResultsState,
    showNotification,
    populateCategoryFilter,
    populateBrandFilter,
    renderCategoryNavigation,
    toggleMobileDrawer,
    updateAnnouncementCountdown,
    updateBreadcrumb,
    setProductViewMode,
    renderPagination,
    updateFreeShippingUI,
    renderRecentlyViewed
} from './ui.js';
import { getRecentlyViewedProducts } from './recently-viewed.js';

// Application state
let currentFilters = {
    category: '',
    availability: '',
    brand: '',
    maxPrice: 200
};
let currentSort = 'featured';
let currentView = CONFIG.display.defaultView;
let searchQuery = '';
let currentPage = 1;

const params = new URLSearchParams(window.location.search);
const initialQuery = params.get('q');
const initialBrand = params.get('brand');
if (initialQuery) {
    searchQuery = initialQuery;
}
if (initialBrand) {
    currentFilters.brand = initialBrand;
}

// Debounce timer
let searchDebounceTimer;

/**
 * Initialize the application
 */
async function init() {
    try {
        toggleLoadingState(true);

        // Load products
        await fetchProducts();

        // Initialize search
        initializeSearch();

        // Initialize cart
        initializeCart();

        // Setup UI
        setupAnnouncementBar();
        setupEventListeners();
        renderCategoryNavigation(CONFIG.navigation.categories);
        populateCategoryFilter(getCategories());
        populateBrandFilter(getBrands());
        if (initialBrand) {
            const brandFilter = document.getElementById('brandFilter');
            if (brandFilter) brandFilter.value = initialBrand;
        }
        setProductViewMode(currentView);

        // Initial render
        updateDisplay();
        updateCartDisplay();
        renderRecentlyViewed(getRecentlyViewedProducts());

        toggleLoadingState(false);
    } catch (error) {
        toggleLoadingState(false);
        showNotification('Failed to load products. Please refresh the page.', 'error');
        console.error('Initialization error:', error);
    }
}

/**
 * Setup announcement bar countdown
 */
function setupAnnouncementBar() {
    const announcement = document.getElementById('announcementBar');
    if (!announcement || !CONFIG.announcement.enabled) {
        return;
    }

    const targetDate = new Date(CONFIG.announcement.endAt).getTime();

    const tick = () => {
        const now = Date.now();
        const diff = targetDate - now;

        if (diff <= 0) {
            updateAnnouncementCountdown('00d 00h 00m 00s');
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        const pad = value => String(value).padStart(2, '0');
        updateAnnouncementCountdown(`${pad(days)}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
    };

    tick();
    setInterval(tick, 1000);
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Search input with debouncing
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        if (searchQuery) {
            searchInput.value = searchQuery;
        }

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                searchQuery = e.target.value;
                currentPage = 1;
                updateDisplay();
            }, 250);
        });
    }

    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            currentFilters.category = e.target.value;
            currentPage = 1;
            updateDisplay();
        });
    }

    // Availability filter
    const availabilityFilter = document.getElementById('availabilityFilter');
    if (availabilityFilter) {
        availabilityFilter.addEventListener('change', (e) => {
            currentFilters.availability = e.target.value;
            currentPage = 1;
            updateDisplay();
        });
    }

    // Brand filter
    const brandFilter = document.getElementById('brandFilter');
    if (brandFilter) {
        brandFilter.addEventListener('change', (e) => {
            currentFilters.brand = e.target.value;
            currentPage = 1;
            updateDisplay();
        });
    }

    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            updateDisplay();
        });
    }

    // Price range filter
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');
    if (priceRange && priceValue) {
        priceRange.addEventListener('input', (e) => {
            const value = parseInt(e.target.value, 10);
            priceValue.textContent = `$${value}`;
            currentFilters.maxPrice = value;
            currentPage = 1;
            updateDisplay();
        });
    }

    // View toggle
    const viewToggles = document.querySelectorAll('[data-view-toggle]');
    viewToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            currentView = toggle.dataset.viewToggle;
            setProductViewMode(currentView);
        });
    });

    // Add to cart buttons (event delegation)
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.addEventListener('click', (e) => {
            const button = e.target.closest('.add-to-cart-button');
            if (!button || button.disabled) return;

            const productId = button.dataset.productId;
            const ctaState = button.dataset.ctaState;

            if (ctaState === 'choose') {
                showNotification('Please choose a variant on product detail page.', 'info');
                return;
            }

            handleAddToCart(productId);
        });
    }

    // Pagination clicks
    const pagination = document.getElementById('paginationControls');
    if (pagination) {
        pagination.addEventListener('click', (e) => {
            const button = e.target.closest('[data-page]');
            if (!button || button.disabled) return;
            currentPage = Number(button.dataset.page);
            updateDisplay();
            document.getElementById('productsGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // Drawer controls
    document.getElementById('openDrawer')?.addEventListener('click', () => toggleMobileDrawer(true));
    document.getElementById('closeDrawer')?.addEventListener('click', () => toggleMobileDrawer(false));
    document.getElementById('mobileDrawer')?.addEventListener('click', (e) => {
        if (e.target.id === 'mobileDrawer') {
            toggleMobileDrawer(false);
        }
    });

    // Nested category quick-filter links
    document.addEventListener('click', (e) => {
        const categoryBtn = e.target.closest('.category-link');
        if (!categoryBtn) return;

        const category = categoryBtn.dataset.category || '';
        currentFilters.category = category;
        const categoryFilterEl = document.getElementById('categoryFilter');
        if (categoryFilterEl) {
            categoryFilterEl.value = category;
        }
        currentPage = 1;
        updateDisplay();
        toggleMobileDrawer(false);
    });

    // Cart button
    const cartButton = document.getElementById('cartButton');
    if (cartButton) {
        cartButton.addEventListener('click', () => {
            toggleCartModal(true);
            updateCartDisplay();
        });
    }

    // Close cart button
    const closeCart = document.getElementById('closeCart');
    if (closeCart) {
        closeCart.addEventListener('click', () => {
            toggleCartModal(false);
        });
    }

    // Close cart when clicking outside
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.addEventListener('click', (e) => {
            if (e.target === cartModal) {
                toggleCartModal(false);
            }
        });
    }

    // Cart item controls (event delegation)
    const cartItems = document.getElementById('cartItems');
    if (cartItems) {
        cartItems.addEventListener('click', (e) => {
            const increaseBtn = e.target.closest('.increase-quantity');
            const decreaseBtn = e.target.closest('.decrease-quantity');
            const removeBtn = e.target.closest('.remove-button');

            if (increaseBtn) {
                const productId = increaseBtn.dataset.productId;
                handleIncreaseQuantity(productId);
            } else if (decreaseBtn) {
                const productId = decreaseBtn.dataset.productId;
                handleDecreaseQuantity(productId);
            } else if (removeBtn) {
                const productId = removeBtn.dataset.productId;
                handleRemoveFromCart(productId);
            }
        });
    }

    // WhatsApp button
    const whatsappButton = document.getElementById('sendWhatsAppButton');
    if (whatsappButton) {
        whatsappButton.addEventListener('click', handleWhatsAppOrder);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Close cart with Escape key
        if (e.key === 'Escape') {
            toggleCartModal(false);
            toggleMobileDrawer(false);
        }
    });
}

/**
 * Update product display based on current filters and search
 */
function updateDisplay() {
    let products = getAllProducts();

    // Apply search
    if (searchQuery && searchQuery.trim() !== '') {
        products = searchProducts(searchQuery);
    }

    // Apply filters and sorting in sequence
    products = filterProducts(products, {
        category: currentFilters.category,
        availability: currentFilters.availability,
        brand: currentFilters.brand,
        maxPrice: currentFilters.maxPrice
    });

    products = sortProducts(products, currentSort);

    // Pagination
    const totalCount = products.length;
    const perPage = CONFIG.display.productsPerPage;
    const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const start = (currentPage - 1) * perPage;
    const paginatedProducts = products.slice(start, start + perPage);

    // Update UI
    const productsGrid = document.getElementById('productsGrid');

    if (totalCount === 0) {
        toggleNoResultsState(true);
        if (productsGrid) {
            productsGrid.style.display = 'none';
        }
    } else {
        toggleNoResultsState(false);
        if (productsGrid) {
            productsGrid.style.display = 'grid';
            renderProducts(paginatedProducts, productsGrid);
        }
    }

    updateResultsCount(totalCount);
    renderPagination(currentPage, totalPages);
    updateBreadcrumb(currentFilters.category);
}

/**
 * Update cart display
 */
function updateCartDisplay() {
    const items = getCartItems();
    const count = getCartCount();
    const total = getCartTotal();

    // Update badge
    updateCartBadge(count);

    // Update cart modal
    const cartItemsContainer = document.getElementById('cartItems');
    if (cartItemsContainer) {
        renderCartItems(items, cartItemsContainer);
    }

    // Update totals
    updateCartTotal(total);
    updateCartItemCount(count);

    // Toggle empty state
    toggleEmptyCartState(items.length === 0);

    updateFreeShippingUI(getFreeShippingProgress());
}

/**
 * Handle add to cart
 * @param {string} productId - Product ID
 */
function handleAddToCart(productId) {
    try {
        addToCart(productId, 1);
        showNotification('Product added to cart!', 'success');
        updateCartDisplay();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

/**
 * Handle increase quantity
 * @param {string} productId - Product ID
 */
function handleIncreaseQuantity(productId) {
    const items = getCartItems();
    const item = items.find(item => item.product.id === productId);

    if (item) {
        const newQuantity = item.quantity + 1;

        if (newQuantity > CONFIG.cart.maxQuantityPerItem) {
            showNotification(`Maximum quantity is ${CONFIG.cart.maxQuantityPerItem}`, 'warning');
            return;
        }

        updateCartItemQuantity(productId, newQuantity);
        updateCartDisplay();
    }
}

/**
 * Handle decrease quantity
 * @param {string} productId - Product ID
 */
function handleDecreaseQuantity(productId) {
    const items = getCartItems();
    const item = items.find(item => item.product.id === productId);

    if (item) {
        const newQuantity = item.quantity - 1;
        updateCartItemQuantity(productId, newQuantity);
        updateCartDisplay();
    }
}

/**
 * Handle remove from cart
 * @param {string} productId - Product ID
 */
function handleRemoveFromCart(productId) {
    Swal.fire({
        title: 'Remove item?',
        text: 'Are you sure you want to remove this item from your cart?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, remove it',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc2626'
    }).then((result) => {
        if (result.isConfirmed) {
            removeFromCart(productId);
            updateCartDisplay();
            showNotification('Item removed from cart', 'info');
        }
    });
}

/**
 * Handle WhatsApp order
 */
function handleWhatsAppOrder() {
    const customerName = document.getElementById('customerName')?.value || '';
    const orderNotes = document.getElementById('orderNotes')?.value || '';

    const items = getCartItems();

    if (items.length === 0) {
        showNotification('Your cart is empty', 'warning');
        return;
    }

    // Generate message
    const message = generateWhatsAppMessage(customerName, orderNotes);
    const whatsappUrl = generateWhatsAppUrl(message);

    // Show confirmation
    Swal.fire({
        title: 'Send Order?',
        html: '<p>Your order will be sent via WhatsApp.</p>',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '<i class="fab fa-whatsapp"></i> Open WhatsApp',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#25d366'
    }).then((result) => {
        if (result.isConfirmed) {
            // Open WhatsApp
            window.open(whatsappUrl, '_blank');

            // Clear form fields
            if (document.getElementById('customerName')) {
                document.getElementById('customerName').value = '';
            }
            if (document.getElementById('orderNotes')) {
                document.getElementById('orderNotes').value = '';
            }

            showNotification('Opening WhatsApp...', 'success');
        }
    });
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
