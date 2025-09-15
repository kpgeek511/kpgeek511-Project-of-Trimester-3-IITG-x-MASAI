// Authentication JavaScript
class AuthManager {
    constructor() {
        this.setupAuthForms();
    }

    setupAuthForms() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const loginData = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            app.showLoading();
            
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();

            if (response.ok) {
                app.showToast('Login successful!', 'success');
                app.closeModal('loginModal');
                
                // Reload user data
                await app.loadUserData();
                
                // Clear form
                e.target.reset();
                
                // Redirect if needed
                const urlParams = new URLSearchParams(window.location.search);
                const redirect = urlParams.get('redirect');
                if (redirect) {
                    window.location.href = redirect;
                }
            } else {
                app.showToast(data.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            app.showToast('Login failed. Please try again.', 'error');
        } finally {
            app.hideLoading();
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const registerData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            password: formData.get('password'),
            department: formData.get('department') || ''
        };

        // Validate password
        if (registerData.password.length < 6) {
            app.showToast('Password must be at least 6 characters long', 'error');
            return;
        }

        try {
            app.showLoading();
            
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registerData)
            });

            const data = await response.json();

            if (response.ok) {
                app.showToast('Registration successful!', 'success');
                app.closeModal('registerModal');
                
                // Reload user data
                await app.loadUserData();
                
                // Clear form
                e.target.reset();
            } else {
                app.showToast(data.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            app.showToast('Registration failed. Please try again.', 'error');
        } finally {
            app.hideLoading();
        }
    }

    async updateProfile(profileData) {
        try {
            app.showLoading();
            
            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });

            const data = await response.json();

            if (response.ok) {
                app.showToast('Profile updated successfully!', 'success');
                await app.loadUserData();
                return true;
            } else {
                app.showToast(data.message || 'Profile update failed', 'error');
                return false;
            }
        } catch (error) {
            console.error('Profile update error:', error);
            app.showToast('Profile update failed. Please try again.', 'error');
            return false;
        } finally {
            app.hideLoading();
        }
    }

    async changePassword(currentPassword, newPassword) {
        try {
            app.showLoading();
            
            const response = await fetch('/api/auth/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                app.showToast('Password changed successfully!', 'success');
                return true;
            } else {
                app.showToast(data.message || 'Password change failed', 'error');
                return false;
            }
        } catch (error) {
            console.error('Password change error:', error);
            app.showToast('Password change failed. Please try again.', 'error');
            return false;
        } finally {
            app.hideLoading();
        }
    }

    async addAddress(addressData) {
        try {
            app.showLoading();
            
            const response = await fetch('/api/auth/address', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(addressData)
            });

            const data = await response.json();

            if (response.ok) {
                app.showToast('Address added successfully!', 'success');
                return true;
            } else {
                app.showToast(data.message || 'Failed to add address', 'error');
                return false;
            }
        } catch (error) {
            console.error('Add address error:', error);
            app.showToast('Failed to add address. Please try again.', 'error');
            return false;
        } finally {
            app.hideLoading();
        }
    }

    async updateAddress(addressId, addressData) {
        try {
            app.showLoading();
            
            const response = await fetch(`/api/auth/address/${addressId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(addressData)
            });

            const data = await response.json();

            if (response.ok) {
                app.showToast('Address updated successfully!', 'success');
                return true;
            } else {
                app.showToast(data.message || 'Failed to update address', 'error');
                return false;
            }
        } catch (error) {
            console.error('Update address error:', error);
            app.showToast('Failed to update address. Please try again.', 'error');
            return false;
        } finally {
            app.hideLoading();
        }
    }

    async deleteAddress(addressId) {
        try {
            app.showLoading();
            
            const response = await fetch(`/api/auth/address/${addressId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.ok) {
                app.showToast('Address deleted successfully!', 'success');
                return true;
            } else {
                app.showToast(data.message || 'Failed to delete address', 'error');
                return false;
            }
        } catch (error) {
            console.error('Delete address error:', error);
            app.showToast('Failed to delete address. Please try again.', 'error');
            return false;
        } finally {
            app.hideLoading();
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePhone(phone) {
        const phoneRegex = /^[6-9]\d{9}$/;
        return phoneRegex.test(phone);
    }

    validatePassword(password) {
        return password.length >= 6;
    }

    formatPhoneNumber(phone) {
        // Remove all non-digit characters
        const cleaned = phone.replace(/\D/g, '');
        
        // Format as Indian phone number
        if (cleaned.length === 10) {
            return cleaned;
        } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
            return cleaned.substring(1);
        } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
            return cleaned.substring(2);
        }
        
        return cleaned;
    }

    showPasswordRequirements() {
        return `
            <div class="password-requirements">
                <p>Password must contain:</p>
                <ul>
                    <li>At least 6 characters</li>
                    <li>No spaces</li>
                </ul>
            </div>
        `;
    }

    showPhoneFormat() {
        return `
            <div class="phone-format">
                <p>Enter a valid Indian phone number (10 digits)</p>
            </div>
        `;
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Make auth manager globally available
window.authManager = authManager;

