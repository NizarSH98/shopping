// Products Module
// Handles fetching and managing product data

import { CONFIG } from './config.js';

let allProducts = [];

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
        allProducts = data.products || [];
        
        return allProducts;
    } catch (error) {
        console.error('Error fetching products:', error);
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
    const categories = allProducts.map(product => product.category);
    return [...new Set(categories)].sort();
}

/**
 * Filter products by various criteria
 * @param {Object} filters - Filter options
 * @returns {Array} Filtered products
 */
export function filterProducts(filters = {}) {
    let filtered = [...allProducts];

    // Filter by category
    if (filters.category && filters.category !== '') {
        filtered = filtered.filter(product => product.category === filters.category);
    }

    // Filter by in stock
    if (filters.inStock) {
        filtered = filtered.filter(product => product.in_stock === true);
    }

    // Filter by max price
    if (filters.maxPrice !== undefined) {
        filtered = filtered.filter(product => product.price <= filters.maxPrice);
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
            return sorted.sort((a, b) => a.price - b.price);
        
        case 'price-desc':
            return sorted.sort((a, b) => b.price - a.price);
        
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
 * Format price according to currency settings
 * @param {number} price - Price value
 * @returns {string} Formatted price string
 */
export function formatPrice(price) {
    const { symbol, position } = CONFIG.currency;
    const formattedNumber = price.toFixed(2);
    
    return position === 'before' 
        ? `${symbol}${formattedNumber}` 
        : `${formattedNumber}${symbol}`;
}
