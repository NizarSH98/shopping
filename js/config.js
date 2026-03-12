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
        // Product data source - use Worker API instead of JSON file
        productsDataUrl: 'https://oauth-proxy.jabernizar98.workers.dev/api/products',
        // Fallback to local JSON if Worker is unavailable
        fallbackDataUrl: './data/products.json'
    },

    announcement: {
        enabled: true,
        label: 'Spring Promo Ends In',
        ctaText: 'Shop Deals',
        ctaHref: '#productsGrid',
        endAt: '2026-12-31T23:59:59Z'
    },

    navigation: {
        supportLinks: [
            { label: 'Search', href: './search.html' },
            { label: 'Contact', href: './contact.html' },
            { label: 'Brands', href: './brands.html' }
        ],
        topLinks: [
            { label: 'Promotions', href: '#productsGrid' },
            { label: 'Rewards', href: './rewards.html' },
            { label: 'Login', href: '#', id: 'loginLink' }
        ],
        categories: [
            {
                label: 'Electronics',
                children: [
                    { label: 'Audio', category: 'Electronics' },
                    { label: 'Wearables', category: 'Electronics' },
                    { label: 'Power & Charging', category: 'Electronics' }
                ]
            },
            {
                label: 'Home & Kitchen',
                children: [
                    { label: 'Cookware', category: 'Home & Kitchen' },
                    { label: 'Coffee', category: 'Home & Kitchen' },
                    { label: 'Lighting', category: 'Home & Kitchen' }
                ]
            },
            {
                label: 'Sports & Fitness',
                children: [
                    { label: 'Yoga', category: 'Sports & Fitness' },
                    { label: 'Training', category: 'Sports & Fitness' }
                ]
            },
            {
                label: 'Clothing',
                children: [
                    { label: 'Tops', category: 'Clothing' }
                ]
            },
            {
                label: 'Accessories',
                children: [
                    { label: 'Bags', category: 'Accessories' }
                ]
            }
        ]
    },

    // Pagination & Display
    display: {
        productsPerPage: 9,
        lazyLoadOffset: 100, // pixels before image enters viewport
        defaultView: 'grid'
    },

    stock: {
        lowStockThreshold: 5
    },

    social: [
        { label: 'Instagram', href: '#', icon: 'fab fa-instagram' },
        { label: 'Facebook', href: '#', icon: 'fab fa-facebook-f' },
        { label: 'YouTube', href: '#', icon: 'fab fa-youtube' }
    ],

    footerMenus: [
        {
            title: 'Shop',
            links: [
                { label: 'All Products', href: './index.html' },
                { label: 'Shop by Brand', href: './brands.html' },
                { label: 'Promotions', href: './rewards.html' }
            ]
        },
        {
            title: 'Support',
            links: [
                { label: 'Contact', href: './contact.html' },
                { label: 'Search', href: './search.html' },
                { label: 'Rewards', href: './rewards.html' }
            ]
        },
        {
            title: 'Policies',
            links: [
                { label: 'Privacy Policy', href: './privacy.html' },
                { label: 'Refund Policy', href: './refund.html' },
                { label: 'Terms of Service', href: './terms.html' }
            ]
        }
    ],

    // Cart Settings
    cart: {
        storageKey: 'shopping_cart',
        maxQuantityPerItem: 99,
        freeShippingThreshold: 150
    }
};
