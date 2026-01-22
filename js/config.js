// Site Configuration
export const CONFIG = {
    // WhatsApp Configuration
    whatsapp: {
        // Replace with your WhatsApp number (include country code, no + or spaces)
        // Example: '1234567890' for +1 (234) 567-890
        phoneNumber: '1234567890',
        // Message template
        messagePrefix: '🛒 *New Order from Shopping Site*\n\n'
    },

    // Currency Configuration
    currency: {
        code: 'USD',
        symbol: '$',
        position: 'before' // 'before' or 'after'
    },

    // Site Configuration
    site: {
        name: 'My Shop',
        description: 'Quality Products at Great Prices',
        // GitHub Pages base path (set to '' if using custom domain)
        // For project sites: '/repository-name'
        // For user/org sites: ''
        basePath: '',
        // Product data source
        productsDataUrl: './data/products.json'
    },

    // Pagination & Display
    display: {
        productsPerPage: 12,
        lazyLoadOffset: 100 // pixels before image enters viewport
    },

    // Cart Settings
    cart: {
        storageKey: 'shopping_cart',
        maxQuantityPerItem: 99
    }
};
