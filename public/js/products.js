// Products Page JavaScript
class ProductsManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentPage = 1;
        this.productsPerPage = 12;
        this.currentView = 'grid';
        this.filters = {
            search: '',
            category: '',
            sort: 'newest',
            priceRange: ''
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadProducts();
        this.setupFilters();
        this.setupViewToggle();
        this.setupPagination();
        this.setupProductModal();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('mainSearchInput');
        const searchBtn = document.getElementById('mainSearchBtn');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.applyFilters();
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.applyFilters();
            });
        }

        // Filter controls
        const categoryFilter = document.getElementById('categoryFilter');
        const sortFilter = document.getElementById('sortFilter');
        const priceFilter = document.getElementById('priceFilter');
        const clearFilters = document.getElementById('clearFilters');

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.applyFilters();
            });
        }

        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                this.filters.sort = e.target.value;
                this.applyFilters();
            });
        }

        if (priceFilter) {
            priceFilter.addEventListener('change', (e) => {
                this.filters.priceRange = e.target.value;
                this.applyFilters();
            });
        }

        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
    }

    setupFilters() {
        // Get URL parameters for initial filters
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        const search = urlParams.get('search');

        if (category) {
            this.filters.category = category;
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) {
                categoryFilter.value = category;
            }
        }

        if (search) {
            this.filters.search = search;
            const searchInput = document.getElementById('mainSearchInput');
            if (searchInput) {
                searchInput.value = search;
            }
        }
    }

    setupViewToggle() {
        const gridView = document.getElementById('gridView');
        const listView = document.getElementById('listView');
        const productsGrid = document.getElementById('productsGrid');

        if (gridView) {
            gridView.addEventListener('click', () => {
                this.currentView = 'grid';
                this.updateViewButtons();
                this.renderProducts();
            });
        }

        if (listView) {
            listView.addEventListener('click', () => {
                this.currentView = 'list';
                this.updateViewButtons();
                this.renderProducts();
            });
        }
    }

    updateViewButtons() {
        const gridView = document.getElementById('gridView');
        const listView = document.getElementById('listView');
        const productsGrid = document.getElementById('productsGrid');

        if (gridView && listView && productsGrid) {
            if (this.currentView === 'grid') {
                gridView.classList.add('active');
                listView.classList.remove('active');
                productsGrid.classList.remove('list-view');
            } else {
                listView.classList.add('active');
                gridView.classList.remove('active');
                productsGrid.classList.add('list-view');
            }
        }
    }

    setupPagination() {
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');

        if (prevPage) {
            prevPage.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.renderProducts();
                    this.updatePagination();
                }
            });
        }

        if (nextPage) {
            nextPage.addEventListener('click', () => {
                const totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.renderProducts();
                    this.updatePagination();
                }
            });
        }
    }

    setupProductModal() {
        const productModal = document.getElementById('productModal');
        const productModalClose = document.getElementById('productModalClose');
        const addToCartModal = document.getElementById('addToCartModal');
        const buyNowModal = document.getElementById('buyNowModal');
        const decreaseQty = document.getElementById('decreaseQty');
        const increaseQty = document.getElementById('increaseQty');
        const quantity = document.getElementById('quantity');

        if (productModalClose) {
            productModalClose.addEventListener('click', () => {
                productModal.classList.remove('active');
            });
        }

        if (productModal) {
            productModal.addEventListener('click', (e) => {
                if (e.target === productModal) {
                    productModal.classList.remove('active');
                }
            });
        }

        if (decreaseQty && quantity) {
            decreaseQty.addEventListener('click', () => {
                const currentQty = parseInt(quantity.value);
                if (currentQty > 1) {
                    quantity.value = currentQty - 1;
                }
            });
        }

        if (increaseQty && quantity) {
            increaseQty.addEventListener('click', () => {
                const currentQty = parseInt(quantity.value);
                if (currentQty < 10) {
                    quantity.value = currentQty + 1;
                }
            });
        }

        if (addToCartModal) {
            addToCartModal.addEventListener('click', () => {
                this.addToCartFromModal();
            });
        }

        if (buyNowModal) {
            buyNowModal.addEventListener('click', () => {
                this.buyNowFromModal();
            });
        }
    }

    async loadProducts() {
        try {
            this.showLoading();
            const response = await fetch('/api/products?limit=100');
            const data = await response.json();

            if (data.success) {
                this.products = data.data.products;
                this.filteredProducts = [...this.products];
                this.applyFilters();
                this.updateResultsInfo();
            } else {
                this.showError('Failed to load products');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Error loading products');
        }
    }

    applyFilters() {
        let filtered = [...this.products];

        // Search filter
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        // Category filter
        if (this.filters.category) {
            filtered = filtered.filter(product => product.category === this.filters.category);
        }

        // Price range filter
        if (this.filters.priceRange) {
            const [min, max] = this.filters.priceRange.split('-').map(Number);
            filtered = filtered.filter(product => {
                if (max) {
                    return product.price >= min && product.price <= max;
                } else {
                    return product.price >= min;
                }
            });
        }

        // Sort products
        filtered = this.sortProducts(filtered, this.filters.sort);

        this.filteredProducts = filtered;
        this.currentPage = 1;
        this.renderProducts();
        this.updatePagination();
        this.updateResultsInfo();
    }

    sortProducts(products, sortBy) {
        switch (sortBy) {
            case 'price-low':
                return products.sort((a, b) => a.price - b.price);
            case 'price-high':
                return products.sort((a, b) => b.price - a.price);
            case 'name':
                return products.sort((a, b) => a.name.localeCompare(b.name));
            case 'popular':
                return products.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
            case 'newest':
            default:
                return products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    }

    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        const startIndex = (this.currentPage - 1) * this.productsPerPage;
        const endIndex = startIndex + this.productsPerPage;
        const productsToShow = this.filteredProducts.slice(startIndex, endIndex);

        if (productsToShow.length === 0) {
            productsGrid.innerHTML = `
                <div class="no-products" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-search" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">No products found</h3>
                    <p style="color: var(--text-secondary);">Try adjusting your search or filter criteria</p>
                </div>
            `;
            return;
        }

        const productsHTML = productsToShow.map(product => this.createProductCard(product)).join('');
        productsGrid.innerHTML = productsHTML;

        // Add event listeners to product cards
        this.addProductCardListeners();
    }

    createProductCard(product) {
        const categoryIcons = {
            'apparel': 'tshirt',
            'accessories': 'gift',
            'stationery': 'book',
            'electronics': 'laptop',
            'sports': 'dumbbell',
            'books': 'book-open',
            'gifts': 'gift',
            'other': 'box'
        };

        const categoryColors = {
            'apparel': '#3b82f6',
            'accessories': '#8b5cf6',
            'stationery': '#10b981',
            'electronics': '#f59e0b',
            'sports': '#ef4444',
            'books': '#06b6d4',
            'gifts': '#ec4899',
            'other': '#6b7280'
        };

        const icon = categoryIcons[product.category] || 'box';
        const color = categoryColors[product.category] || '#6b7280';
        const discount = product.discount || 0;
        const originalPrice = product.originalPrice || product.price;
        const hasDiscount = discount > 0 && originalPrice > product.price;

        return `
            <div class="product-card" data-product-id="${product._id}">
                <div class="product-image" style="background: linear-gradient(135deg, ${color}15, ${color}05); background-image: url('/images/${product.category}.svg'); background-size: cover; background-position: center;">
                    <div class="product-image-overlay">
                        <i class="fas fa-${icon}" style="color: ${color}; font-size: 2rem; opacity: 0.8;"></i>
                    </div>
                    ${product.isFeatured ? '<div class="product-badge featured">Featured</div>' : ''}
                    ${hasDiscount ? `<div class="product-badge sale">${discount}% OFF</div>` : ''}
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category.charAt(0).toUpperCase() + product.category.slice(1)}</div>
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.shortDescription || product.description}</p>
                    <div class="product-price-section">
                        <span class="product-price">₹${product.price}</span>
                        ${hasDiscount ? `<span class="product-original-price">₹${originalPrice}</span>` : ''}
                        ${hasDiscount ? `<span class="product-discount">${discount}% OFF</span>` : ''}
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary btn-sm" onclick="productsManager.addToCart('${product._id}')">
                            <i class="fas fa-cart-plus"></i>
                            Add to Cart
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="productsManager.viewProduct('${product._id}')">
                            <i class="fas fa-eye"></i>
                            View
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    addProductCardListeners() {
        // Add any additional event listeners for product cards if needed
    }

    updatePagination() {
        const paginationContainer = document.getElementById('paginationContainer');
        const prevPage = document.getElementById('prevPage');
        const nextPage = document.getElementById('nextPage');
        const paginationNumbers = document.getElementById('paginationNumbers');

        if (!paginationContainer || !prevPage || !nextPage || !paginationNumbers) return;

        const totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);

        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        paginationContainer.style.display = 'flex';

        // Update prev/next buttons
        prevPage.disabled = this.currentPage === 1;
        nextPage.disabled = this.currentPage === totalPages;

        // Generate page numbers
        let pageNumbersHTML = '';
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbersHTML += `
                <button class="pagination-number ${i === this.currentPage ? 'active' : ''}" 
                        onclick="productsManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        paginationNumbers.innerHTML = pageNumbersHTML;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderProducts();
        this.updatePagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    updateResultsInfo() {
        const resultsTitle = document.getElementById('resultsTitle');
        const resultsCount = document.getElementById('resultsCount');

        if (resultsTitle && resultsCount) {
            const category = this.filters.category;
            const search = this.filters.search;

            if (category) {
                resultsTitle.textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} Products`;
            } else if (search) {
                resultsTitle.textContent = `Search Results for "${search}"`;
            } else {
                resultsTitle.textContent = 'All Products';
            }

            resultsCount.textContent = `${this.filteredProducts.length} products found`;
        }
    }

    clearAllFilters() {
        this.filters = {
            search: '',
            category: '',
            sort: 'newest',
            priceRange: ''
        };

        // Reset form elements
        const searchInput = document.getElementById('mainSearchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const sortFilter = document.getElementById('sortFilter');
        const priceFilter = document.getElementById('priceFilter');

        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (sortFilter) sortFilter.value = 'newest';
        if (priceFilter) priceFilter.value = '';

        this.applyFilters();
    }

    viewProduct(productId) {
        const product = this.products.find(p => p._id === productId);
        if (!product) return;

        const modal = document.getElementById('productModal');
        const productName = document.getElementById('modalProductName');
        const productPrice = document.getElementById('modalProductPrice');
        const productOriginalPrice = document.getElementById('modalProductOriginalPrice');
        const productDiscount = document.getElementById('modalProductDiscount');
        const productDescription = document.getElementById('modalProductDescription');
        const productSpecifications = document.getElementById('modalProductSpecifications');

        if (productName) productName.textContent = product.name;
        if (productPrice) productPrice.textContent = `₹${product.price}`;

        const discount = product.discount || 0;
        const originalPrice = product.originalPrice || product.price;
        const hasDiscount = discount > 0 && originalPrice > product.price;

        if (hasDiscount) {
            if (productOriginalPrice) {
                productOriginalPrice.textContent = `₹${originalPrice}`;
                productOriginalPrice.style.display = 'inline';
            }
            if (productDiscount) {
                productDiscount.textContent = `${discount}% OFF`;
                productDiscount.style.display = 'inline';
            }
        } else {
            if (productOriginalPrice) productOriginalPrice.style.display = 'none';
            if (productDiscount) productDiscount.style.display = 'none';
        }

        if (productDescription) {
            productDescription.textContent = product.description;
        }

        if (productSpecifications && product.specifications) {
            const specsHTML = Object.entries(product.specifications)
                .map(([key, value]) => `
                    <div class="spec-item">
                        <span class="spec-label">${key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                        <span class="spec-value">${value}</span>
                    </div>
                `).join('');
            
            productSpecifications.innerHTML = `
                <h4>Specifications</h4>
                ${specsHTML}
            `;
        }

        // Store current product for modal actions
        this.currentModalProduct = product;

        if (modal) {
            modal.classList.add('active');
        }
    }

    addToCart(productId) {
        if (!window.app || !window.app.currentUser) {
            window.app?.showAuthModal();
            return;
        }

        const product = this.products.find(p => p._id === productId);
        if (!product) return;

        window.app.addToCart(productId);
    }

    addToCartFromModal() {
        if (!this.currentModalProduct) return;

        const quantity = parseInt(document.getElementById('quantity')?.value) || 1;
        
        if (!window.app || !window.app.currentUser) {
            window.app?.showAuthModal();
            return;
        }

        // Add multiple items to cart
        for (let i = 0; i < quantity; i++) {
            window.app.addToCart(this.currentModalProduct._id);
        }

        const modal = document.getElementById('productModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    buyNowFromModal() {
        if (!this.currentModalProduct) return;

        const quantity = parseInt(document.getElementById('quantity')?.value) || 1;
        
        if (!window.app || !window.app.currentUser) {
            window.app?.showAuthModal();
            return;
        }

        // Add to cart and redirect to checkout
        for (let i = 0; i < quantity; i++) {
            window.app.addToCart(this.currentModalProduct._id);
        }

        const modal = document.getElementById('productModal');
        if (modal) {
            modal.classList.remove('active');
        }

        // Redirect to checkout (you can implement this)
        window.location.href = '/checkout';
    }

    showLoading() {
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
            productsGrid.innerHTML = `
                <div class="loading-spinner" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary-color); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-secondary);">Loading products...</p>
                </div>
            `;
        }
    }

    showError(message) {
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
            productsGrid.innerHTML = `
                <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--danger-color); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">Error</h3>
                    <p style="color: var(--text-secondary);">${message}</p>
                </div>
            `;
        }
    }
}

// Initialize products manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productsManager = new ProductsManager();
});