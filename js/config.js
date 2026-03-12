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
        name: 'GlowHaven',
        description: 'Your Beauty Destination — Skincare, Makeup & More',
        // GitHub Pages base path (set to '' if using custom domain)
        // For project sites: '/repository-name'
        // For user/org sites: ''
        basePath: '',
        // Product data source - use Worker API instead of JSON file
        productsDataUrl: 'https://glowhaven-api.jabernizar98.workers.dev/api/products',
        // Fallback to local JSON if Worker is unavailable
        fallbackDataUrl: './data/products.json'
    },

    announcement: {
        enabled: true,
        label: 'Beauty Sale Ends In',
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
                label: 'Skincare',
                children: [
                    { label: 'Moisturizers', category: 'Skincare' },
                    { label: 'Cleansers', category: 'Skincare' },
                    { label: 'Serums', category: 'Skincare' },
                    { label: 'Sunscreen', category: 'Skincare' }
                ]
            },
            {
                label: 'Makeup',
                children: [
                    { label: 'Face', category: 'Makeup' },
                    { label: 'Lips', category: 'Makeup' },
                    { label: 'Eyes', category: 'Makeup' }
                ]
            },
            {
                label: 'Haircare',
                children: [
                    { label: 'Shampoo & Conditioner', category: 'Haircare' },
                    { label: 'Treatments', category: 'Haircare' },
                    { label: 'Styling', category: 'Haircare' }
                ]
            },
            {
                label: 'Fragrance',
                children: [
                    { label: 'Women\'s Perfume', category: 'Fragrance' },
                    { label: 'Gift Sets', category: 'Fragrance' }
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
