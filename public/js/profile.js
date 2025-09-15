// Profile JavaScript
class ProfileManager {
    constructor() {
        this.setupProfilePage();
    }

    setupProfilePage() {
        // Check if we're on the profile page
        if (window.location.pathname.includes('/profile')) {
            this.loadProfileData();
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        // Edit Profile Button
        const editBtn = document.getElementById('editProfileBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.showEditModal());
        }
    }

    async loadProfileData() {
        try {
            // Check if user is logged in
            if (!app.currentUser) {
                this.showLoginPrompt();
                return;
            }

            // Load user profile data
            await this.loadUserProfile();
            await this.loadOrderStatistics();
        } catch (error) {
            console.error('Error loading profile data:', error);
            app.showToast('Failed to load profile data', 'error');
        }
    }

    async loadUserProfile() {
        try {
            const response = await fetch('/api/auth/profile');
            const data = await response.json();

            if (response.ok) {
                this.displayUserProfile(data.data);
            } else {
                app.showToast(data.message || 'Failed to load profile', 'error');
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            // Fallback to current user data
            if (app.currentUser) {
                this.displayUserProfile(app.currentUser);
            }
        }
    }

    displayUserProfile(user) {
        // Update profile header
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileRole = document.getElementById('profileRole');

        if (profileName) {
            profileName.textContent = `${user.firstName} ${user.lastName}`;
        }
        if (profileEmail) {
            profileEmail.textContent = user.email;
        }
        if (profileRole) {
            profileRole.textContent = user.role === 'admin' ? 'Administrator' : 'Student';
        }

        // Update personal information
        const firstName = document.getElementById('firstName');
        const lastName = document.getElementById('lastName');
        const userEmail = document.getElementById('userEmail');
        const userPhone = document.getElementById('userPhone');
        const userDepartment = document.getElementById('userDepartment');
        const studentId = document.getElementById('studentId');

        if (firstName) firstName.textContent = user.firstName || 'Not provided';
        if (lastName) lastName.textContent = user.lastName || 'Not provided';
        if (userEmail) userEmail.textContent = user.email || 'Not provided';
        if (userPhone) userPhone.textContent = user.phone || 'Not provided';
        if (userDepartment) userDepartment.textContent = user.department || 'Not provided';
        if (studentId) studentId.textContent = user.studentId || 'Not provided';
    }

    async loadOrderStatistics() {
        try {
            const response = await fetch('/api/orders/my-orders?limit=1000');
            const data = await response.json();

            if (response.ok) {
                this.displayOrderStatistics(data.data.orders);
            } else {
                // Set default values
                this.displayOrderStatistics([]);
            }
        } catch (error) {
            console.error('Error loading order statistics:', error);
            this.displayOrderStatistics([]);
        }
    }

    displayOrderStatistics(orders) {
        const totalOrders = document.getElementById('totalOrders');
        const completedOrders = document.getElementById('completedOrders');
        const pendingOrders = document.getElementById('pendingOrders');
        const totalSpent = document.getElementById('totalSpent');

        if (totalOrders) {
            totalOrders.textContent = orders.length;
        }

        if (completedOrders) {
            const completed = orders.filter(order => order.status === 'delivered').length;
            completedOrders.textContent = completed;
        }

        if (pendingOrders) {
            const pending = orders.filter(order => 
                ['pending', 'confirmed', 'processing', 'shipped'].includes(order.status)
            ).length;
            pendingOrders.textContent = pending;
        }

        if (totalSpent) {
            const spent = orders.reduce((total, order) => {
                return total + (order.pricing?.total || 0);
            }, 0);
            totalSpent.textContent = `₹${spent.toLocaleString()}`;
        }
    }

    showLoginPrompt() {
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileRole = document.getElementById('profileRole');

        if (profileName) profileName.textContent = 'Please Login';
        if (profileEmail) profileEmail.textContent = 'You need to be logged in to view your profile';
        if (profileRole) profileRole.textContent = 'Guest';

        // Show login button
        const editBtn = document.getElementById('editProfileBtn');
        if (editBtn) {
            editBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            editBtn.onclick = () => app.showAuthModal();
        }

        // Clear personal information
        const infoFields = ['firstName', 'lastName', 'userEmail', 'userPhone', 'userDepartment', 'studentId'];
        infoFields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) element.textContent = 'Please login to view';
        });

        // Clear statistics
        const statFields = ['totalOrders', 'completedOrders', 'pendingOrders', 'totalSpent'];
        statFields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) element.textContent = fieldId === 'totalSpent' ? '₹0' : '0';
        });
    }

    showEditModal() {
        // Show edit profile modal
        app.showToast('Edit profile feature coming soon!', 'info');
    }
}

// Initialize profile manager
const profileManager = new ProfileManager();

// Make profile manager globally available
window.profileManager = profileManager;





