// Search Module
// Handles fuzzy search using Fuse.js

import { getAllProducts } from './products.js';

let fuseInstance = null;

/**
 * Initialize Fuse.js search
 */
export function initializeSearch() {
    const products = getAllProducts();
    
    const fuseOptions = {
        keys: [
            { name: 'name', weight: 0.4 },
            { name: 'description', weight: 0.3 },
            { name: 'category', weight: 0.2 },
            { name: 'tags', weight: 0.1 }
        ],
        threshold: 0.4,
        minMatchCharLength: 2,
        includeScore: true
    };

    fuseInstance = new Fuse(products, fuseOptions);
}

/**
 * Search products
 * @param {string} query - Search query
 * @returns {Array} Array of products matching the query
 */
export function searchProducts(query) {
    if (!query || query.trim() === '') {
        return getAllProducts();
    }

    if (!fuseInstance) {
        initializeSearch();
    }

    const results = fuseInstance.search(query);
    return results.map(result => result.item);
}
