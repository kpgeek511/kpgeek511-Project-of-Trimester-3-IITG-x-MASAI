// Main Application JavaScript
class MerchandisePortal {
    constructor() {
        this.currentUser = null;
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserData();
        this.updateCartCount();
        this.loadFeaturedProducts();
        this.loadCategories();
        this.loadStats();
        this.setupNavigation();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.handleSearch());
        }

        // User menu
        const userBtn = document.getElementById('userBtn');
        const userDropdown = document.getElementById('userDropdown');
        
        if (userBtn) {
            userBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('active');
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (userDropdown && !userBtn.contains(e.target)) {
                userDropdown.classList.remove('active');
            }
        });

        // Mobile menu
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const navMenu = document.getElementById('navMenu');
        
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                navMenu.classList.toggle('active');
            });
        }

        // Auth modal
        this.setupAuthModal();

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    setupAuthModal() {
        const authModal = document.getElementById('authModal');
        const modalClose = document.getElementById('modalClose');
        const loginTab = document.getElementById('loginTab');
        const registerTab = document.getElementById('registerTab');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        // Close modal
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                authModal.classList.remove('active');
            });
        }

        // Close modal when clicking outside
        if (authModal) {
            authModal.addEventListener('click', (e) => {
                if (e.target === authModal) {
                    authModal.classList.remove('active');
                }
            });
        }

        // Tab switching
        if (loginTab) {
            loginTab.addEventListener('click', () => {
                loginTab.classList.add('active');
                registerTab.classList.remove('active');
                loginForm.style.display = 'block';
                registerForm.style.display = 'none';
                document.getElementById('modalTitle').textContent = 'Login';
            });
        }

        if (registerTab) {
            registerTab.addEventListener('click', () => {
                registerTab.classList.add('active');
                loginTab.classList.remove('active');
                registerForm.style.display = 'block';
                loginForm.style.display = 'none';
                document.getElementById('modalTitle').textContent = 'Register';
            });
        }

        // Form submissions
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
    }

    setupNavigation() {
        // Handle navigation clicks
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                this.navigateToPage(href);
            });
        });

        // Handle user menu clicks
        const userMenuLinks = document.querySelectorAll('.user-dropdown .dropdown-item');
        userMenuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href) {
                    this.navigateToPage(href);
                }
            });
        });

        // Handle hero action buttons
        const heroButtons = document.querySelectorAll('.hero-actions .btn');
        heroButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const href = button.getAttribute('href');
                if (href) {
                    this.navigateToPage(href);
                }
            });
        });

        // Handle section footer buttons
        const sectionButtons = document.querySelectorAll('.section-footer .btn');
        sectionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const href = button.getAttribute('href');
                if (href) {
                    this.navigateToPage(href);
                }
            });
        });
    }

    navigateToPage(href) {
        if (href === '/') {
            window.location.href = '/';
        } else if (href === '/products') {
            window.location.href = '/products';
        } else if (href === '/orders') {
            if (this.currentUser) {
                window.location.href = '/orders';
            } else {
                this.showAuthModal();
            }
        } else if (href === '/group-orders') {
            if (this.currentUser) {
                window.location.href = '/group-orders';
            } else {
                this.showAuthModal();
            }
        } else if (href === '/reviews') {
            window.location.href = '/reviews';
        } else if (href === '/profile') {
            if (this.currentUser) {
                window.location.href = '/profile';
            } else {
                this.showAuthModal();
            }
        } else if (href === '/settings') {
            if (this.currentUser) {
                window.location.href = '/settings';
            } else {
                this.showAuthModal();
            }
        } else if (href === '/cart') {
            window.location.href = '/cart';
        } else {
            // For other routes, try to navigate
            window.location.href = href;
        }
    }

    showAuthModal() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.classList.add('active');
        }
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success) {
                this.currentUser = data.user;
                localStorage.setItem('user', JSON.stringify(data.user));
                this.updateUserInterface();
                this.hideAuthModal();
                this.showNotification('Login successful!', 'success');
            } else {
                this.showNotification(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('An error occurred during login', 'error');
        }
    }

    async handleRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const department = document.getElementById('registerDepartment').value;

        // Split name into firstName and lastName
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    firstName, 
                    lastName, 
                    email, 
                    password, 
                    department,
                    phone: '1234567890' // Default phone number
                }),
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification('Registration successful! Please login.', 'success');
                // Switch to login tab
                document.getElementById('loginTab').click();
                // Clear register form
                document.getElementById('registerForm').reset();
            } else {
                this.showNotification(data.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification('An error occurred during registration', 'error');
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('user');
        this.updateUserInterface();
        this.showNotification('Logged out successfully', 'success');
    }

    loadUserData() {
        const userData = localStorage.getItem('user');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.updateUserInterface();
        }
    }

    updateUserInterface() {
        const userName = document.getElementById('userName');
        const userMenu = document.getElementById('userMenu');
        const userBtn = document.getElementById('userBtn');

        if (this.currentUser) {
            if (userName) userName.textContent = this.currentUser.name;
            if (userMenu) userMenu.style.display = 'block';
            if (userBtn) userBtn.style.display = 'flex';
        } else {
            if (userName) userName.textContent = 'Guest';
            if (userMenu) userMenu.style.display = 'none';
            if (userBtn) {
                userBtn.style.display = 'flex';
                userBtn.addEventListener('click', () => this.showAuthModal());
            }
        }
    }

    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = this.cart.length;
        }
    }

    async loadFeaturedProducts() {
        const productsContainer = document.getElementById('featuredProducts');
        if (!productsContainer) return;

        try {
            const response = await fetch('/api/products/featured/list?limit=8');
            const data = await response.json();

            if (data.success && data.data.products) {
                this.displayProducts(data.data.products, productsContainer);
            } else {
                productsContainer.innerHTML = '<div class="no-products">No featured products available</div>';
            }
        } catch (error) {
            console.error('Error loading featured products:', error);
            productsContainer.innerHTML = '<div class="error-message">Error loading products</div>';
        }
    }

    async loadCategories() {
        const categoriesContainer = document.getElementById('categoriesGrid');
        if (!categoriesContainer) return;

        try {
            const response = await fetch('/api/products/categories/list');
            const data = await response.json();

            if (data.success && data.data) {
                this.displayCategories(data.data, categoriesContainer);
            } else {
                categoriesContainer.innerHTML = '<div class="no-categories">No categories available</div>';
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            categoriesContainer.innerHTML = '<div class="error-message">Error loading categories</div>';
        }
    }

    async loadStats() {
        try {
            // Load total products
            const productsResponse = await fetch('/api/products');
            const productsData = await productsResponse.json();
            if (productsData.success) {
                const totalProducts = document.getElementById('totalProducts');
                if (totalProducts) {
                    this.animateNumber(totalProducts, productsData.data.products.length);
                }
            }

            // Load other stats (you can add more API calls here)
            const totalOrders = document.getElementById('totalOrders');
            if (totalOrders) {
                this.animateNumber(totalOrders, 150); // Placeholder
            }

            const totalUsers = document.getElementById('totalUsers');
            if (totalUsers) {
                this.animateNumber(totalUsers, 500); // Placeholder
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    animateNumber(element, targetNumber) {
        let currentNumber = 0;
        const increment = targetNumber / 50;
        const timer = setInterval(() => {
            currentNumber += increment;
            if (currentNumber >= targetNumber) {
                currentNumber = targetNumber;
                clearInterval(timer);
            }
            element.textContent = Math.floor(currentNumber);
        }, 30);
    }

    displayProducts(products, container) {
        if (!products || products.length === 0) {
            container.innerHTML = '<div class="no-products">No products available</div>';
            return;
        }

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

        const productsHTML = products.map(product => {
            const color = categoryColors[product.category] || '#6b7280';
            const discount = product.discount || 0;
            const originalPrice = product.originalPrice || product.price;
            const hasDiscount = discount > 0 && originalPrice > product.price;

            return `
                <div class="product-card">
                    <div class="product-image" style="background: linear-gradient(135deg, ${color}15, ${color}05); background-image: url('/images/${product.category}.svg'); background-size: cover; background-position: center;">
                        <div class="product-image-overlay">
                            <i class="fas fa-${this.getProductIcon(product.category)}" style="color: ${color}; font-size: 2rem; opacity: 0.8;"></i>
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
                            <button class="btn btn-primary btn-sm" onclick="app.addToCart('${product._id}')">
                                <i class="fas fa-cart-plus"></i>
                                Add to Cart
                            </button>
                            <button class="btn btn-outline btn-sm" onclick="app.viewProduct('${product._id}')">
                                <i class="fas fa-eye"></i>
                                View
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = productsHTML;
    }

    displayCategories(categories, container) {
        if (!categories || categories.length === 0) {
            container.innerHTML = '<div class="no-categories">No categories available</div>';
            return;
        }

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

        const categoriesHTML = categories.map(category => {
            const color = categoryColors[category.name.toLowerCase()] || '#6b7280';
            return `
                <a href="/products?category=${category.name}" class="category-card">
                    <div class="category-icon" style="background: linear-gradient(135deg, ${color}15, ${color}05); background-image: url('/images/${category.name.toLowerCase()}.svg'); background-size: cover; background-position: center;">
                        <div class="category-icon-overlay">
                            <i class="fas fa-${categoryIcons[category.name.toLowerCase()] || 'box'}" style="color: ${color};"></i>
                        </div>
                    </div>
                    <div class="category-name">${category.name.charAt(0).toUpperCase() + category.name.slice(1)}</div>
                    <div class="category-count">${category.count} products</div>
                </a>
            `;
        }).join('');

        container.innerHTML = categoriesHTML;
    }

    getProductIcon(category) {
        const icons = {
            'apparel': 'tshirt',
            'accessories': 'gift',
            'stationery': 'book',
            'electronics': 'laptop',
            'sports': 'dumbbell',
            'books': 'book-open',
            'gifts': 'gift',
            'other': 'box'
        };
        return icons[category?.toLowerCase()] || 'box';
    }

    addToCart(productId) {
        if (!this.currentUser) {
            this.showAuthModal();
            return;
        }

        // Add to cart logic
        const existingItem = this.cart.find(item => item.productId === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({ productId, quantity: 1 });
        }

        localStorage.setItem('cart', JSON.stringify(this.cart));
        this.updateCartCount();
        this.showNotification('Product added to cart!', 'success');
    }

    viewProduct(productId) {
        window.location.href = `/products?id=${productId}`;
    }

    handleSearch() {
        const searchInput = document.getElementById('searchInput');
        const query = searchInput.value.trim();
        
        if (query) {
            window.location.href = `/products?search=${encodeURIComponent(query)}`;
        }
    }

    hideAuthModal() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.classList.remove('active');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 3000;
            animation: slideInRight 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the application
const app = new MerchandisePortal();

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .no-products, .no-categories, .error-message {
        text-align: center;
        padding: 2rem;
        color: var(--text-muted);
        grid-column: 1 / -1;
    }
    
    .error-message {
        color: var(--danger-color);
    }
`;
document.head.appendChild(style);