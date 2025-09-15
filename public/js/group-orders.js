// Group Orders JavaScript
class GroupOrderManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.currentStatus = '';
        this.setupGroupOrderPage();
    }

    setupGroupOrderPage() {
        // Check if we're on the group orders page
        if (window.location.pathname.includes('/group-orders')) {
            this.loadGroupOrders();
            this.setupGroupOrderFilters();
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        // Create Group Order Button
        const createBtn = document.getElementById('createGroupOrderBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateModal());
        }

        // Join Group Order Button
        const joinBtn = document.getElementById('joinGroupOrderBtn');
        if (joinBtn) {
            joinBtn.addEventListener('click', () => this.showJoinModal());
        }

        // Create Group Order Form
        const createForm = document.getElementById('createGroupOrderForm');
        if (createForm) {
            createForm.addEventListener('submit', (e) => this.handleCreateGroupOrder(e));
        }

        // Join Group Order Form
        const joinForm = document.getElementById('joinGroupOrderForm');
        if (joinForm) {
            joinForm.addEventListener('submit', (e) => this.handleJoinGroupOrder(e));
        }

        // Modal close buttons
        const closeCreateBtn = document.getElementById('closeCreateGroupOrderModal');
        if (closeCreateBtn) {
            closeCreateBtn.addEventListener('click', () => this.closeCreateModal());
        }

        const closeJoinBtn = document.getElementById('closeJoinGroupOrderModal');
        if (closeJoinBtn) {
            closeJoinBtn.addEventListener('click', () => this.closeJoinModal());
        }
    }

    setupGroupOrderFilters() {
        const filterTabs = document.querySelectorAll('.filter-tab');
        
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs
                filterTabs.forEach(t => t.classList.remove('active'));
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Update current status and reload group orders
                this.currentStatus = tab.dataset.status;
                this.currentPage = 1;
                this.loadGroupOrders();
            });
        });
    }

    async loadGroupOrders() {
        try {
            app.showLoading();
            
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage
            });

            if (this.currentStatus) {
                params.set('status', this.currentStatus);
            }

            const response = await fetch(`/api/group-orders?${params}`);
            const data = await response.json();

            if (response.ok) {
                this.renderGroupOrders(data.data.groupOrders);
            } else {
                app.showToast(data.message || 'Failed to load group orders', 'error');
            }
        } catch (error) {
            console.error('Error loading group orders:', error);
            app.showToast('Failed to load group orders', 'error');
        } finally {
            app.hideLoading();
        }
    }

    renderGroupOrders(groupOrders) {
        const container = document.getElementById('groupOrdersList');
        if (!container) return;

        if (groupOrders.length === 0) {
            container.innerHTML = `
                <div class="no-group-orders">
                    <i class="fas fa-users"></i>
                    <h3>No group orders found</h3>
                    <p>There are no active group orders at the moment.</p>
                    <button class="btn btn-primary" onclick="groupOrderManager.showCreateModal()">
                        Create First Group Order
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = groupOrders.map(groupOrder => `
            <div class="group-order-card">
                <div class="group-order-header">
                    <div class="group-order-info">
                        <h3 class="group-order-name">${groupOrder.name}</h3>
                        <p class="group-order-description">${groupOrder.description}</p>
                        <div class="group-order-meta">
                            <span class="group-order-code">Code: ${groupOrder.code}</span>
                            <span class="group-order-creator">Created by: ${groupOrder.creator.name}</span>
                        </div>
                    </div>
                    <div class="group-order-status">
                        <span class="status-badge status-${groupOrder.status}">${this.formatStatus(groupOrder.status)}</span>
                    </div>
                </div>
                
                <div class="group-order-details">
                    <div class="detail-item">
                        <i class="fas fa-calendar"></i>
                        <span>Deadline: ${this.formatDate(groupOrder.deadline)}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-users"></i>
                        <span>Participants: ${groupOrder.participants.length}/${groupOrder.maxParticipants}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-rupee-sign"></i>
                        <span>Total Amount: ₹${groupOrder.totalAmount}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-percentage"></i>
                        <span>Discount: ${groupOrder.discount}%</span>
                    </div>
                </div>
                
                <div class="group-order-footer">
                    <div class="group-order-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${(groupOrder.participants.length / groupOrder.maxParticipants) * 100}%"></div>
                        </div>
                        <span class="progress-text">${groupOrder.participants.length}/${groupOrder.maxParticipants} participants</span>
                    </div>
                    <div class="group-order-actions">
                        <button class="btn btn-outline btn-sm" onclick="groupOrderManager.viewGroupOrderDetails('${groupOrder._id}')">
                            View Details
                        </button>
                        ${this.renderGroupOrderActions(groupOrder)}
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderGroupOrderActions(groupOrder) {
        let actions = '';

        if (groupOrder.status === 'open' && groupOrder.participants.length < groupOrder.maxParticipants) {
            actions += `
                <button class="btn btn-primary btn-sm" onclick="groupOrderManager.joinGroupOrder('${groupOrder._id}')">
                    Join Order
                </button>
            `;
        }

        if (groupOrder.creator._id === app.currentUser?._id) {
            if (groupOrder.status === 'open') {
                actions += `
                    <button class="btn btn-warning btn-sm" onclick="groupOrderManager.closeGroupOrder('${groupOrder._id}')">
                        Close Order
                    </button>
                `;
            }
            actions += `
                <button class="btn btn-error btn-sm" onclick="groupOrderManager.deleteGroupOrder('${groupOrder._id}')">
                    Delete
                </button>
            `;
        }

        return actions;
    }

    formatStatus(status) {
        const statusMap = {
            open: 'Open',
            closed: 'Closed',
            completed: 'Completed',
            cancelled: 'Cancelled'
        };
        return statusMap[status] || status;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showCreateModal() {
        const modal = document.getElementById('createGroupOrderModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeCreateModal() {
        const modal = document.getElementById('createGroupOrderModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    showJoinModal() {
        const modal = document.getElementById('joinGroupOrderModal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeJoinModal() {
        const modal = document.getElementById('joinGroupOrderModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    async handleCreateGroupOrder(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const groupOrderData = {
            name: formData.get('name'),
            description: formData.get('description'),
            deadline: formData.get('deadline'),
            minAmount: parseFloat(formData.get('minAmount')) || 0,
            maxParticipants: parseInt(formData.get('maxParticipants')) || 10
        };

        try {
            app.showLoading();
            
            const response = await fetch('/api/group-orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(groupOrderData)
            });

            const data = await response.json();

            if (response.ok) {
                app.showToast('Group order created successfully!', 'success');
                this.closeCreateModal();
                e.target.reset();
                this.loadGroupOrders();
            } else {
                app.showToast(data.message || 'Failed to create group order', 'error');
            }
        } catch (error) {
            console.error('Error creating group order:', error);
            app.showToast('Failed to create group order', 'error');
        } finally {
            app.hideLoading();
        }
    }

    async handleJoinGroupOrder(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const code = formData.get('code');

        try {
            app.showLoading();
            
            const response = await fetch('/api/group-orders/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code })
            });

            const data = await response.json();

            if (response.ok) {
                app.showToast('Successfully joined group order!', 'success');
                this.closeJoinModal();
                e.target.reset();
                this.loadGroupOrders();
            } else {
                app.showToast(data.message || 'Failed to join group order', 'error');
            }
        } catch (error) {
            console.error('Error joining group order:', error);
            app.showToast('Failed to join group order', 'error');
        } finally {
            app.hideLoading();
        }
    }

    async viewGroupOrderDetails(groupOrderId) {
        try {
            app.showLoading();
            
            const response = await fetch(`/api/group-orders/${groupOrderId}`);
            const data = await response.json();

            if (response.ok) {
                // Show group order details modal or redirect to details page
                window.location.href = `/group-orders/${groupOrderId}`;
            } else {
                app.showToast(data.message || 'Failed to load group order details', 'error');
            }
        } catch (error) {
            console.error('Error loading group order details:', error);
            app.showToast('Failed to load group order details', 'error');
        } finally {
            app.hideLoading();
        }
    }

    async joinGroupOrder(groupOrderId) {
        try {
            app.showLoading();
            
            const response = await fetch(`/api/group-orders/${groupOrderId}/join`, {
                method: 'POST'
            });
            const data = await response.json();

            if (response.ok) {
                app.showToast('Successfully joined group order!', 'success');
                this.loadGroupOrders();
            } else {
                app.showToast(data.message || 'Failed to join group order', 'error');
            }
        } catch (error) {
            console.error('Error joining group order:', error);
            app.showToast('Failed to join group order', 'error');
        } finally {
            app.hideLoading();
        }
    }

    async closeGroupOrder(groupOrderId) {
        if (!confirm('Are you sure you want to close this group order?')) {
            return;
        }

        try {
            app.showLoading();
            
            const response = await fetch(`/api/group-orders/${groupOrderId}/close`, {
                method: 'PUT'
            });
            const data = await response.json();

            if (response.ok) {
                app.showToast('Group order closed successfully', 'success');
                this.loadGroupOrders();
            } else {
                app.showToast(data.message || 'Failed to close group order', 'error');
            }
        } catch (error) {
            console.error('Error closing group order:', error);
            app.showToast('Failed to close group order', 'error');
        } finally {
            app.hideLoading();
        }
    }

    async deleteGroupOrder(groupOrderId) {
        if (!confirm('Are you sure you want to delete this group order? This action cannot be undone.')) {
            return;
        }

        try {
            app.showLoading();
            
            const response = await fetch(`/api/group-orders/${groupOrderId}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (response.ok) {
                app.showToast('Group order deleted successfully', 'success');
                this.loadGroupOrders();
            } else {
                app.showToast(data.message || 'Failed to delete group order', 'error');
            }
        } catch (error) {
            console.error('Error deleting group order:', error);
            app.showToast('Failed to delete group order', 'error');
        } finally {
            app.hideLoading();
        }
    }
}

// Initialize group order manager
const groupOrderManager = new GroupOrderManager();

// Make group order manager globally available
window.groupOrderManager = groupOrderManager;





