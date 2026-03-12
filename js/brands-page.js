import { fetchProducts, getBrands } from './products.js';

async function init() {
    await fetchProducts();
    const container = document.getElementById('brandIndex');
    const brands = getBrands();

    container.innerHTML = brands
        .map(brand => `<a class="brand-chip" href="./index.html?brand=${encodeURIComponent(brand)}">${brand}</a>`)
        .join('');
}

init();
