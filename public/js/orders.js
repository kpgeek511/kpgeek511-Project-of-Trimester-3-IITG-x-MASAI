
// Orders JavaScript
class OrderManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentStatus = '';
        this.setupOrderPage();
    }

    setupOrderPage() {
        // Check if we're on the orders page
        if (window.location.pathname.includes('/orders')) {
            this.loadOrders();
            this.setupOrderFilters();
            this.setupPagination();
        }
    }

    setupOrderFilters() {
        const filterTabs = document.querySelectorAll('.filter-tab');
        
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                filterTabs.forEach(t => t.classList.remove('active'));
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Update current status and reload orders
                this.currentStatus = tab.dataset.status;
                this.currentPage = 1;
                this.loadOrders();
            });
        });
    }

    setupPagination() {
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousPage());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextPage());
        }
    }

    async loadOrders() {
        try {
            app.showLoading();
            
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage
            });

            if (this.currentStatus) {
                params.set('status', this.currentStatus);
            }

            const response = await fetch(`/api/orders/my-orders?${params}`);
            const data = await response.json();

            if (response.ok) {
                this.renderOrders(data.data.orders);
                this.renderPagination(data.data.pagination);
            } else {
                app.showToast(data.message || 'Failed to load orders', 'error');
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            app.showToast('Failed to load orders', 'error');
        } finally {
            app.hideLoading();
        }
    }

    renderOrders(orders) {
        const container = document.getElementById('ordersList');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = `
                <div class="no-orders">
                    <i class="fas fa-box-open"></i>
                    <h3>No orders found</h3>
                    <p>You haven't placed any orders yet.</p>
                    <a href="/products" class="btn btn-primary">Start Shopping</a>
                </div>
            `;
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-info">
                        <h3 class="order-number">Order #${order.orderNumber}</h3>
                        <p class="order-date">${Utils.formatDate(order.createdAt)}</p>
                    </div>
                    <div class="order-status">
                        <span class="status-badge status-${order.status}">${this.formatStatus(order.status)}</span>
                    </div>
                </div>
                
                <div class="order-items">
                    ${order.items.slice(0, 3).map(item => `
                        <div class="order-item">
                            <img src="${item.product.primaryImage || '/images/placeholder.jpg'}" 
                                 alt="${item.product.name}" 
                                 class="item-image">
                            <div class="item-details">
                                <h4 class="item-name">${item.product.name}</h4>
                                <p class="item-quantity">Qty: ${item.quantity}</p>
                                <p class="item-price">₹${item.totalPrice}</p>
                            </div>
                        </div>
                    `).join('')}
                    ${order.items.length > 3 ? `<p class="more-items">+${order.items.length - 3} more items</p>` : ''}
                </div>
                
                <div class="order-footer">
                    <div class="order-total">
                        <span>Total: ₹${order.pricing.total}</span>
                    </div>
                    <div class="order-actions">
                        <button class="btn btn-outline btn-sm" onclick="orderManager.viewOrderDetails('${order._id}')">
                            View Details
                        </button>
                        ${this.renderOrderActions(order)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderOrderActions(order) {
        let actions = '';

        if (order.canCancel) {
            actions += `
                <button class="btn btn-error btn-sm" onclick="orderManager.cancelOrder('${order._id}')">
                    Cancel Order
                </button>
            `;
        }

        if (order.status === 'delivered') {
            actions += `
                <button class="btn btn-primary btn-sm" onclick="orderManager.writeReview('${order._id}')">
                    Write Review
                </button>
            `;
        }

        if (order.payment.status === 'completed' && order.canRefund) {
            actions += `
                <button class="btn btn-warning btn-sm" onclick="orderManager.requestRefund('${order._id}')">
                    Request Refund
                </button>
            `;
        }

        return actions;
    }

    formatStatus(status) {
        const statusMap = {
            pending: 'Pending',
            confirmed: 'Confirmed',
            processing: 'Processing',
            shipped: 'Shipped',
            delivered: 'Delivered',
            cancelled: 'Cancelled',
            refunded: 'Refunded'
        };
        return statusMap[status] || status;
    }

    renderPagination(pagination) {
        const container = document.getElementById('paginationContainer');
        if (!container) return;

        if (pagination.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = `
            <div class="pagination">
                <button class="btn btn-outline" id="prevPageBtn" ${!pagination.hasPrev ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
                <div class="page-numbers" id="pageNumbers">
        `;

        // Calculate page range
        const startPage = Math.max(1, pagination.currentPage - 2);
        const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="page-number ${i === pagination.currentPage ? 'active' : ''}" 
                        onclick="orderManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }

        paginationHTML += `
                </div>
                <button class="btn btn-outline" id="nextPageBtn" ${!pagination.hasNext ? 'disabled' : ''}>
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;

        container.innerHTML = paginationHTML;

        // Re-attach event listeners
        this.setupPagination();
    }

    goToPage(page) {
        this.currentPage = page;
        this.loadOrders();
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.goToPage(this.currentPage - 1);
        }
    }

    nextPage() {
        this.goToPage(this.currentPage + 1);
    }

    async viewOrderDetails(orderId) {
        try {
            app.showLoading();
            
            const response = await fetch(`/api/orders/${orderId}`);
            const data = await response.json();

            if (response.ok) {
                this.showOrderDetailsModal(data.data);
            } else {
                app.showToast(data.message || 'Failed to load order details', 'error');
            }
        } catch (error) {
            console.error('Error loading order details:', error);
            app.showToast('Failed to load order details', 'error');
        } finally {
            app.hideLoading();
        }
    }

    showOrderDetailsModal(order) {
        const modal = document.getElementById('orderDetailsModal');
        const content = document.getElementById('orderDetailsContent');
        
        if (!modal || !content) return;

        content.innerHTML = `
            <div class="order-details">
                <div class="order-summary">
                    <div class="summary-row">
                        <span>Order Number:</span>
                        <span>${order.orderNumber}</span>
                    </div>
                    <div class="summary-row">
                        <span>Order Date:</span>
                        <span>${Utils.formatDateTime(order.createdAt)}</span>
                    </div>
                    <div class="summary-row">
                        <span>Status:</span>
                        <span class="status-badge status-${order.status}">${this.formatStatus(order.status)}</span>
                    </div>
                    <div class="summary-row">
                        <span>Payment Status:</span>
                        <span class="status-badge status-${order.payment.status}">${this.formatStatus(order.payment.status)}</span>
                    </div>
                </div>

                <div class="order-items-details">
                    <h3>Order Items</h3>
                    ${order.items.map(item => `
                        <div class="order-item-detail">
                            <img src="${item.product.primaryImage || '/images/placeholder.jpg'}" 
                                 alt="${item.product.name}" 
                                 class="item-image">
                            <div class="item-info">
                                <h4>${item.product.name}</h4>
                                <p>Quantity: ${item.quantity}</p>
                                <p>Price: ₹${item.price} each</p>
                                <p>Total: ₹${item.totalPrice}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="order-pricing">
                    <h3>Order Summary</h3>
                    <div class="pricing-row">
                        <span>Subtotal:</span>
                        <span>₹${order.pricing.subtotal}</span>
                    </div>
                    <div class="pricing-row">
                        <span>Discount:</span>
                        <span>-₹${order.pricing.discount}</span>
                    </div>
                    <div class="pricing-row">
                        <span>Tax:</span>
                        <span>₹${order.pricing.tax}</span>
                    </div>
                    <div class="pricing-row">
                        <span>Shipping:</span>
                        <span>₹${order.pricing.shipping}</span>
                    </div>
                    <div class="pricing-row total">
                        <span>Total:</span>
                        <span>₹${order.pricing.total}</span>
                    </div>
                </div>

                <div class="order-addresses">
                    <div class="address-section">
                        <h3>Shipping Address</h3>
                        <div class="address-details">
                            <p>${order.shippingAddress.street}</p>
                            <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}</p>
                            <p>${order.shippingAddress.country}</p>
                        </div>
                    </div>
                </div>

                ${order.distribution ? `
                    <div class="order-distribution">
                        <h3>Distribution Details</h3>
                        <div class="distribution-info">
                            <p><strong>Location:</strong> ${order.distribution.location}</p>
                            <p><strong>Scheduled Date:</strong> ${Utils.formatDate(order.distribution.scheduledDate)}</p>
                            <p><strong>Status:</strong> ${order.distribution.status}</p>
                        </div>
                    </div>
                ` : ''}

                <div class="order-timeline">
                    <h3>Order Timeline</h3>
                    <div class="timeline">
                        ${order.timeline.map(event => `
                            <div class="timeline-item">
                                <div class="timeline-marker"></div>
                                <div class="timeline-content">
                                    <h4>${event.status}</h4>
                                    <p>${Utils.formatDateTime(event.timestamp)}</p>
                                    ${event.note ? `<p>${event.note}</p>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Setup modal close
        const closeBtn = document.getElementById('closeOrderDetailsModal');
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            };
        }
    }

    async cancelOrder(orderId) {
        if (!confirm('Are you sure you want to cancel this order?')) {
            return;
        }

        try {
            app.showLoading();
            
            const response = await fetch(`/api/orders/${orderId}/cancel`, {
                method: 'PUT'
            });
            const data = await response.json();

            if (response.ok) {
                app.showToast('Order cancelled successfully', 'success');
                this.loadOrders();
            } else {
                app.showToast(data.message || 'Failed to cancel order', 'error');
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            app.showToast('Failed to cancel order', 'error');
        } finally {
            app.hideLoading();
        }
    }

    writeReview(orderId) {
        // Redirect to review page or show review modal
        window.location.href = `/reviews?orderId=${orderId}`;
    }

    requestRefund(orderId) {
        // Show refund request modal or redirect
        app.showToast('Refund request feature coming soon', 'info');
    }
}

// Initialize order manager
const orderManager = new OrderManager();

// Make order manager globally available
window.orderManager = orderManager;

