// Cart Module
// Handles shopping cart functionality and localStorage persistence

import { CONFIG } from './config.js';
import { getProductById, formatPrice } from './products.js';

const STORAGE_KEY = CONFIG.cart.storageKey;

let cart = [];

/**
 * Initialize cart from localStorage
 */
export function initializeCart() {
    loadCart();
}

/**
 * Load cart from localStorage
 */
function loadCart() {
    try {
        const savedCart = localStorage.getItem(STORAGE_KEY);
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        cart = [];
    }
}

/**
 * Save cart to localStorage
 */
function saveCart() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
        console.error('Error saving cart:', error);
    }
}

/**
 * Get all cart items with product details
 * @returns {Array} Cart items with product data
 */
export function getCartItems() {
    return cart.map(item => {
        const product = getProductById(item.productId);
        return {
            ...item,
            product
        };
    }).filter(item => item.product); // Filter out items with deleted products
}

/**
 * Get total number of items in cart
 * @returns {number} Total item count
 */
export function getCartCount() {
    return cart.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Get cart total price
 * @returns {number} Total price
 */
export function getCartTotal() {
    return cart.reduce((total, item) => {
        const product = getProductById(item.productId);
        if (product) {
            return total + (product.price * item.quantity);
        }
        return total;
    }, 0);
}

/**
 * Add product to cart
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity to add
 */
export function addToCart(productId, quantity = 1) {
    const product = getProductById(productId);
    
    if (!product) {
        throw new Error('Product not found');
    }

    if (!product.in_stock) {
        throw new Error('Product is out of stock');
    }

    const existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
        existingItem.quantity = Math.min(
            existingItem.quantity + quantity,
            CONFIG.cart.maxQuantityPerItem
        );
    } else {
        cart.push({
            productId,
            quantity: Math.min(quantity, CONFIG.cart.maxQuantityPerItem),
            addedAt: new Date().toISOString()
        });
    }

    saveCart();
}

/**
 * Update item quantity in cart
 * @param {string} productId - Product ID
 * @param {number} quantity - New quantity
 */
export function updateCartItemQuantity(productId, quantity) {
    const item = cart.find(item => item.productId === productId);

    if (item) {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = Math.min(quantity, CONFIG.cart.maxQuantityPerItem);
            saveCart();
        }
    }
}

/**
 * Remove product from cart
 * @param {string} productId - Product ID
 */
export function removeFromCart(productId) {
    cart = cart.filter(item => item.productId !== productId);
    saveCart();
}

/**
 * Clear entire cart
 */
export function clearCart() {
    cart = [];
    saveCart();
}

/**
 * Generate WhatsApp message from cart
 * @param {string} customerName - Customer name (optional)
 * @param {string} notes - Order notes (optional)
 * @returns {string} Formatted WhatsApp message
 */
export function generateWhatsAppMessage(customerName = '', notes = '') {
    const items = getCartItems();
    const total = getCartTotal();

    let message = CONFIG.whatsapp.messagePrefix;

    if (customerName) {
        message += `👤 Customer: ${customerName}\n\n`;
    }

    message += '📦 *Order Details:*\n';
    message += '━━━━━━━━━━━━━━━━\n';

    items.forEach((item, index) => {
        const { product, quantity } = item;
        const itemTotal = product.price * quantity;
        message += `${index + 1}. ${product.name}\n`;
        message += `   Qty: ${quantity} × ${formatPrice(product.price)} = ${formatPrice(itemTotal)}\n\n`;
    });

    message += '━━━━━━━━━━━━━━━━\n';
    message += `💰 *Total: ${formatPrice(total)}*\n`;

    if (notes) {
        message += `\n📝 *Notes:*\n${notes}`;
    }

    return message;
}

/**
 * Generate WhatsApp URL
 * @param {string} message - Message to send
 * @returns {string} WhatsApp URL
 */
export function generateWhatsAppUrl(message) {
    const phoneNumber = CONFIG.whatsapp.phoneNumber;
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
}
