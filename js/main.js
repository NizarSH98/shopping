// Main Application Module
// Bootstrap and coordinate all app functionality

import { CONFIG } from './config.js';
import { 
    fetchProducts, 
    getAllProducts, 
    getCategories, 
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
    generateWhatsAppUrl
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
    populateCategoryFilter
} from './ui.js';

// Application state
let currentProducts = [];
let currentFilters = {
    category: '',
    inStock: false,
    maxPrice: 200
};
let currentSort = 'featured';
let searchQuery = '';

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
        setupEventListeners();
        populateCategoryFilter(getCategories());
        
        // Initial render
        updateDisplay();
        updateCartDisplay();
        
        toggleLoadingState(false);
        
    } catch (error) {
        toggleLoadingState(false);
        showNotification('Failed to load products. Please refresh the page.', 'error');
        console.error('Initialization error:', error);
    }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Search input with debouncing
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                searchQuery = e.target.value;
                updateDisplay();
            }, 300);
        });
    }

    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            currentFilters.category = e.target.value;
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

    // In stock filter
    const inStockFilter = document.getElementById('inStockFilter');
    if (inStockFilter) {
        inStockFilter.addEventListener('change', (e) => {
            currentFilters.inStock = e.target.checked;
            updateDisplay();
        });
    }

    // Price range filter
    const priceRange = document.getElementById('priceRange');
    const priceValue = document.getElementById('priceValue');
    if (priceRange && priceValue) {
        priceRange.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            priceValue.textContent = `$${value}`;
            currentFilters.maxPrice = value;
            updateDisplay();
        });
    }

    // Add to cart buttons (event delegation)
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.addEventListener('click', (e) => {
            const button = e.target.closest('.add-to-cart-button');
            if (button && !button.disabled) {
                const productId = button.dataset.productId;
                handleAddToCart(productId);
            }
        });
    }

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

    // Apply filters
    products = filterProducts({
        category: currentFilters.category,
        inStock: currentFilters.inStock,
        maxPrice: currentFilters.maxPrice
    });

    // Apply sorting
    products = sortProducts(products, currentSort);

    // Update UI
    currentProducts = products;
    const productsGrid = document.getElementById('productsGrid');
    
    if (products.length === 0) {
        toggleNoResultsState(true);
        if (productsGrid) {
            productsGrid.style.display = 'none';
        }
    } else {
        toggleNoResultsState(false);
        if (productsGrid) {
            productsGrid.style.display = 'grid';
            renderProducts(products, productsGrid);
        }
    }

    updateResultsCount(products.length);
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
        html: `
            <p>Your order will be sent via WhatsApp.</p>
            <p><strong>Total:</strong> ${updateCartTotal.textContent || 'N/A'}</p>
        `,
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
