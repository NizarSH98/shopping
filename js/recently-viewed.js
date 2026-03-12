import { getProductById } from './products.js';

const STORAGE_KEY = 'shopping_recently_viewed';
const MAX_ITEMS = 8;

export function trackRecentlyViewed(productId) {
    if (!productId) return;

    const existing = getRecentlyViewedIds().filter(id => id !== productId);
    existing.unshift(productId);
    const trimmed = existing.slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function getRecentlyViewedIds() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const ids = JSON.parse(raw || '[]');
        return Array.isArray(ids) ? ids : [];
    } catch (error) {
        return [];
    }
}

export function getRecentlyViewedProducts(excludeId = '') {
    return getRecentlyViewedIds()
        .filter(id => id !== excludeId)
        .map(id => getProductById(id))
        .filter(Boolean);
}
