// Products Module
// Handles fetching and managing product data

import { CONFIG } from './config.js';

let allProducts = [];

/**
 * Normalize products to safely support extended commerce fields.
 * @param {Object} product - raw product
 * @returns {Object} normalized product
 */
function normalizeProduct(product) {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const variantPrices = variants
        .map(variant => Number(variant.price))
        .filter(price => !Number.isNaN(price));

    const fallbackPrice = Number(product.price) || 0;
    const basePrice = variantPrices.length > 0
        ? Math.min(...variantPrices)
        : fallbackPrice;

    return {
        ...product,
        brand: product.brand || 'House Brand',
        excerpt: product.excerpt || product.description || '',
        price: basePrice,
        compare_at_price: Number(product.compare_at_price) || null,
        stock_quantity: Number.isFinite(product.stock_quantity) ? product.stock_quantity : null,
        variants
    };
}

/**
 * Fetch products from the data source
 * @returns {Promise<Array>} Array of products
 */
export async function fetchProducts() {
    try {
        const response = await fetch(CONFIG.site.productsDataUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Handle both direct array and {products: []} format
        allProducts = (data.products || data || []).map(normalizeProduct);

        return allProducts;
    } catch (error) {
        console.error('Error fetching products:', error);

        // Try fallback URL if available
        if (CONFIG.site.fallbackDataUrl) {
            try {
                console.log('Trying fallback data source...');
                const fallbackResponse = await fetch(CONFIG.site.fallbackDataUrl);
                const fallbackData = await fallbackResponse.json();
                allProducts = (fallbackData.products || fallbackData || []).map(normalizeProduct);
                return allProducts;
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
            }
        }

        throw error;
    }
}

/**
 * Get all products
 * @returns {Array} Array of products
 */
export function getAllProducts() {
    return allProducts;
}

/**
 * Get product by ID
 * @param {string} id - Product ID
 * @returns {Object|null} Product object or null
 */
export function getProductById(id) {
    return allProducts.find(product => product.id === id) || null;
}

/**
 * Get all unique categories
 * @returns {Array} Array of category names
 */
export function getCategories() {
    const categories = allProducts.map(product => product.category).filter(Boolean);
    return [...new Set(categories)].sort();
}

/**
 * Get all unique brands
 * @returns {Array} Array of brand names
 */
export function getBrands() {
    const brands = allProducts.map(product => product.brand).filter(Boolean);
    return [...new Set(brands)].sort();
}

/**
 * Filter products by various criteria
 * @param {Array} products - input products
 * @param {Object} filters - Filter options
 * @returns {Array} Filtered products
 */
export function filterProducts(products = [], filters = {}) {
    let filtered = [...products];

    // Filter by category
    if (filters.category && filters.category !== '') {
        filtered = filtered.filter(product => product.category === filters.category);
    }

    // Filter by availability
    if (filters.availability === 'in-stock') {
        filtered = filtered.filter(product => product.in_stock === true);
    }

    if (filters.availability === 'sold-out') {
        filtered = filtered.filter(product => product.in_stock === false);
    }

    // Filter by brand
    if (filters.brand && filters.brand !== '') {
        filtered = filtered.filter(product => product.brand === filters.brand);
    }

    // Filter by max price
    if (filters.maxPrice !== undefined) {
        filtered = filtered.filter(product => getEffectivePrice(product) <= filters.maxPrice);
    }

    return filtered;
}

/**
 * Sort products
 * @param {Array} products - Products to sort
 * @param {string} sortBy - Sort method
 * @returns {Array} Sorted products
 */
export function sortProducts(products, sortBy = 'featured') {
    const sorted = [...products];

    switch (sortBy) {
        case 'price-asc':
            return sorted.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));

        case 'price-desc':
            return sorted.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));

        case 'title-asc':
            return sorted.sort((a, b) => a.name.localeCompare(b.name));

        case 'newest':
            return sorted.sort((a, b) => {
                const dateA = new Date(a.updated_at || a.created_at);
                const dateB = new Date(b.updated_at || b.created_at);
                return dateB - dateA;
            });

        case 'featured':
        default:
            return sorted.sort((a, b) => {
                if (a.featured === b.featured) {
                    return 0;
                }
                return a.featured ? -1 : 1;
            });
    }
}

/**
 * Get product stock state label
 * @param {Object} product - product data
 * @returns {'in-stock'|'low-stock'|'sold-out'} stock state
 */
export function getStockState(product) {
    if (!product.in_stock) {
        return 'sold-out';
    }

    if (Number.isFinite(product.stock_quantity) && product.stock_quantity <= CONFIG.stock.lowStockThreshold) {
        return 'low-stock';
    }

    return 'in-stock';
}

/**
 * Get current effective price
 * @param {Object} product - product data
 * @returns {number} effective price
 */
export function getEffectivePrice(product) {
    if (Array.isArray(product.variants) && product.variants.length > 0) {
        const prices = product.variants
            .map(variant => Number(variant.price))
            .filter(price => !Number.isNaN(price));

        if (prices.length > 0) {
            return Math.min(...prices);
        }
    }

    return Number(product.price) || 0;
}

/**
 * Get compare-at price
 * @param {Object} product - product data
 * @returns {number|null}
 */
export function getCompareAtPrice(product) {
    if (Number(product.compare_at_price) > getEffectivePrice(product)) {
        return Number(product.compare_at_price);
    }

    return null;
}

/**
 * Get CTA mode for product card
 * @param {Object} product - product data
 * @returns {'add'|'choose'|'sold-out'}
 */
export function getProductCtaState(product) {
    if (!product.in_stock) {
        return 'sold-out';
    }

    if (Array.isArray(product.variants) && product.variants.length > 1) {
        return 'choose';
    }

    return 'add';
}

/**
 * Format price according to currency settings
 * @param {number} price - Price value
 * @returns {string} Formatted price string
 */
export function formatPrice(price) {
    const { symbol, position } = CONFIG.currency;
    const formattedNumber = Number(price || 0).toFixed(2);

    return position === 'before'
        ? `${symbol}${formattedNumber}`
        : `${formattedNumber}${symbol}`;
}
