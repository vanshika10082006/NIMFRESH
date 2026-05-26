// Global state
let currentUser = null;
let currentView = 'dashboard';
let products = [];
let donations = [];
let notifications = [];
let isLogin = true;
let selectedUserType = 'individual';
let selectedInputMethod = 'manual';
let selectedProducts = [];
let selectedNGO = null;

// NGO data
const ngos = [
    {
        id: '1',
        name: 'Food Bank Community Center',
        type: 'Food Bank',
        location: 'Downtown, Mumbai',
        phone: '+91 98765 43210',
        email: 'donations@foodbank.org',
        rating: 4.8,
        verified: true,
        accepts: ['grocery', 'canned', 'beverages']
    },
    {
        id: '2',
        name: 'City Health Mission',
        type: 'Healthcare NGO',
        location: 'Bandra, Mumbai',
        phone: '+91 98765 43211',
        email: 'help@cityhealth.org',
        rating: 4.9,
        verified: true,
        accepts: ['medicine', 'healthcare']
    },
    {
        id: '3',
        name: 'Hope Foundation',
        type: 'Community Support',
        location: 'Andheri, Mumbai',
        phone: '+91 98765 43212',
        email: 'connect@hopefoundation.org',
        rating: 4.7,
        verified: true,
        accepts: ['grocery', 'dairy', 'fruits', 'vegetables']
    }
];

// Utility functions
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

function getDaysUntilExpiry(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getProductStatus(product) {
    const daysUntilExpiry = getDaysUntilExpiry(product.expiryDate);
    
    if (daysUntilExpiry < 0) {
        return {
            label: `Expired ${Math.abs(daysUntilExpiry)} day(s) ago`,
            class: 'status-expired',
            icon: 'fas fa-exclamation-triangle'
        };
    } else if (daysUntilExpiry <= 30) {
        return {
            label: `Expires in ${daysUntilExpiry} day(s)`,
            class: 'status-expiring',
            icon: 'fas fa-clock'
        };
    } else {
        return {
            label: `Fresh (${daysUntilExpiry} days left)`,
            class: 'status-fresh',
            icon: 'fas fa-check-circle'
        };
    }
}

// Authentication functions
function toggleAuthMode() {
    isLogin = !isLogin;
    const nameField = document.getElementById('name-field');
    const userTypeField = document.getElementById('user-type-field');
    const authToggle = document.getElementById('auth-toggle');
    const authSubtitle = document.querySelector('.auth-subtitle');
    const authBtnText = document.getElementById('auth-btn-text');
    
    if (isLogin) {
        nameField.style.display = 'none';
        userTypeField.style.display = 'none';
        authToggle.textContent = "Don't have an account? Sign up";
        authSubtitle.textContent = 'Welcome back! Sign in to your account';
        authBtnText.textContent = 'Sign In';
    } else {
        nameField.style.display = 'block';
        userTypeField.style.display = 'block';
        authToggle.textContent = 'Already have an account? Sign in';
        authSubtitle.textContent = 'Create your account to get started';
        authBtnText.textContent = 'Create Account';
    }
}

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.password-toggle i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.className = 'fas fa-eye-off';
    } else {
        passwordInput.type = 'password';
        toggleBtn.className = 'fas fa-eye';
    }
}

function handleAuth(event) {
    event.preventDefault();
    
    const authBtn = document.getElementById('auth-submit');
    const authBtnText = document.getElementById('auth-btn-text');
    const authLoading = document.getElementById('auth-loading');
    
    // Show loading state
    authBtnText.style.display = 'none';
    authLoading.style.display = 'block';
    authBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        const email = document.getElementById('email').value;
        const name = document.getElementById('name').value || email.trim().split('@')[0];
        
        currentUser = {
            id: generateId(),
            name: name,
            email: email,
            userType: selectedUserType,
            joinedAt: new Date().toISOString()
        };
        
        // Hide auth screen and show main app
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        
        // Update user name in header
        document.getElementById('user-name').textContent = currentUser.name;
        
        // Add welcome notification
        addNotification({
            type: 'success',
            title: '🎉 Welcome to NIMFRESH!',
            message: 'Start by adding your first item to track its expiry and reduce food waste.',
            actionText: 'Add Item'
        });
        
        updateDashboard();
    }, 1500);
}

function logout() {
    currentUser = null;
    products = [];
    donations = [];
    notifications = [];
    currentView = 'dashboard';
    
    // Reset forms
    document.getElementById('auth-form').reset();
    
    // Show auth screen and hide main app
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
    
    // Reset auth mode to login
    isLogin = true;
    toggleAuthMode();
    toggleAuthMode(); // Call twice to reset to login state
}

// Navigation functions
function switchView(view) {
    currentView = view;
    
    // Update navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    
    // Update views
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
    });
    document.getElementById(`${view}-view`).classList.add('active');
    
    // Update content based on view
    if (view === 'dashboard') {
        updateDashboard();
    } else if (view === 'inventory') {
        updateInventory();
    } else if (view === 'donations') {
        updateDonations();
    }
}

// Dashboard functions
function updateDashboard() {
    updateStats();
    updateRecentItems();
}

function updateStats() {
    const totalItems = products.length;
    const expiredItems = products.filter(p => getDaysUntilExpiry(p.expiryDate) < 0).length;
    const expiringSoonItems = products.filter(p => {
        const days = getDaysUntilExpiry(p.expiryDate);
        return days <= 30 && days > 0;
    }).length;
    const freshItems = products.filter(p => getDaysUntilExpiry(p.expiryDate) > 30).length;
    
    document.getElementById('total-items').textContent = totalItems;
    document.getElementById('expired-items').textContent = expiredItems;
    document.getElementById('expiring-items').textContent = expiringSoonItems;
    document.getElementById('fresh-items').textContent = freshItems;
    
    // Update expired trend
    const expiredTrend = document.getElementById('expired-trend');
    expiredTrend.textContent = expiredItems > 0 ? 'Action required' : 'All good!';
}

function updateRecentItems() {
    const recentItemsContent = document.getElementById('recent-items-content');
    
    if (products.length === 0) {
        recentItemsContent.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box"></i>
                <h4>No Items Yet</h4>
                <p>Start by adding your first grocery or medicine item</p>
                <button class="btn btn-primary" onclick="showAddProduct()">Add Item</button>
            </div>
        `;
        return;
    }
    
    const recentProducts = products
        .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
        .slice(0, 5);
    
    const tableHTML = `
        <div style="background: white; border-radius: 1rem; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1); overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: #f9fafb;">
                    <tr>
                        <th style="padding: 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 500; color: #6b7280; text-transform: uppercase;">Item</th>
                        <th style="padding: 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 500; color: #6b7280; text-transform: uppercase;">Category</th>
                        <th style="padding: 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 500; color: #6b7280; text-transform: uppercase;">Expiry Date</th>
                        <th style="padding: 0.75rem; text-align: left; font-size: 0.75rem; font-weight: 500; color: #6b7280; text-transform: uppercase;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${recentProducts.map(product => {
                        const status = getProductStatus(product);
                        return `
                            <tr style="border-top: 1px solid #f3f4f6;">
                                <td style="padding: 1rem;">
                                    <div style="font-weight: 500; color: #1f2937;">${product.name}</div>
                                    <div style="font-size: 0.875rem; color: #6b7280;">${product.brand}</div>
                                </td>
                                <td style="padding: 1rem; font-size: 0.875rem; color: #6b7280;">${product.category}</td>
                                <td style="padding: 1rem; font-size: 0.875rem; color: #6b7280;">${formatDate(product.expiryDate)}</td>
                                <td style="padding: 1rem;">
                                    <span class="status-badge ${status.class}">
                                        <i class="${status.icon}"></i>
                                        ${status.label.split(' ')[0]}
                                    </span>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    recentItemsContent.innerHTML = tableHTML;
}

// Product management functions
function showAddProduct() {
    document.getElementById('add-product-modal').classList.add('active');
    resetProductForm();
}

function hideAddProduct() {
    document.getElementById('add-product-modal').classList.remove('active');
}

function resetProductForm() {
    document.getElementById('product-form').reset();
    document.getElementById('product-quantity').value = 1;
    document.getElementById('product-category').value = 'grocery';
    document.getElementById('product-location').value = 'pantry';
    
    // Reset input method
    selectedInputMethod = 'manual';
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('[data-method="manual"]').classList.add('active');
    document.getElementById('barcode-scanner').style.display = 'none';
}

function selectInputMethod(method) {
    selectedInputMethod = method;
    
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-method="${method}"]`).classList.add('active');
    
    const barcodeSection = document.getElementById('barcode-scanner');
    if (method === 'barcode') {
        barcodeSection.style.display = 'block';
    } else {
        barcodeSection.style.display = 'none';
    }
    const productform = document.getElementById('product-form');
     if (method === 'barcode') {
        productform.style.display = 'none';
    } else {
        productform.style.display = 'block';
    }
}

function simulateBarcodeScan() {
    const scanBtn = document.getElementById('start-scan-btn');
    const scanningIndicator = document.getElementById('scanning-indicator');
    
    scanBtn.style.display = 'none';
    scanningIndicator.style.display = 'block';
    
    setTimeout(() => {
        // Simulate successful scan
        document.getElementById('product-name').value = 'Organic Milk';
        document.getElementById('product-brand').value = 'Amul';
        document.getElementById('product-category').value = 'dairy';
        
        scanBtn.style.display = 'block';
        scanningIndicator.style.display = 'none';
        
        addNotification({
            type: 'success',
            title: '✅ Barcode Scanned Successfully',
            message: 'Product details have been automatically filled. Please verify and add expiry date.'
        });
    }, 2000);
}

function handleProductSubmit(event) {
    event.preventDefault();
    
    const product = {
        id: generateId(),
        name: document.getElementById('product-name').value,
        brand: document.getElementById('product-brand').value,
        category: document.getElementById('product-category').value,
        expiryDate: document.getElementById('product-expiry').value,
        quantity: parseInt(document.getElementById('product-quantity').value),
        unit: document.getElementById('product-unit').value,
        location: document.getElementById('product-location').value,
        addedAt: new Date().toISOString(),
        inputMethod: selectedInputMethod
    };
    
    products.push(product);
    hideAddProduct();
    
    addNotification({
        type: 'success',
        title: '✅ Item Added Successfully',
        message: `${product.name} has been added to your inventory and will be monitored for expiry.`
    });
    
    updateDashboard();
    updateInventory();
    updateDonations();
    generateExpiryNotifications();
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this item?')) {
        products = products.filter(p => p.id !== productId);
        updateDashboard();
        updateInventory();
        updateDonations();
    }
}

// Inventory functions
function updateInventory() {
    const inventoryContent = document.getElementById('inventory-content');
    const inventoryCount = document.getElementById('inventory-count');
    
    let filteredProducts = [...products];
    
    // Apply filters
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('category-filter')?.value || 'all';
    const statusFilter = document.getElementById('status-filter')?.value || 'all';
    const sortFilter = document.getElementById('sort-filter')?.value || 'expiry';
    
    // Filter by search term
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.brand.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by category
    if (categoryFilter !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.category === categoryFilter);
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
        filteredProducts = filteredProducts.filter(product => {
            const days = getDaysUntilExpiry(product.expiryDate);
            if (statusFilter === 'expired') return days < 0;
            if (statusFilter === 'expiring-soon') return days <= 30 && days > 0;
            if (statusFilter === 'fresh') return days > 30;
            return true;
        });
    }
    
    // Sort products
    filteredProducts.sort((a, b) => {
        if (sortFilter === 'expiry') {
            return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        } else if (sortFilter === 'name') {
            return a.name.localeCompare(b.name);
        } else if (sortFilter === 'added') {
            return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        }
        return 0;
    });
    
    inventoryCount.textContent = `${filteredProducts.length} of ${products.length} items`;
    
    if (filteredProducts.length === 0) {
        inventoryContent.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box"></i>
                <h3>No Items Found</h3>
                <p>${products.length === 0 ? 'Start by adding your first item to track its expiry' : 'Try adjusting your search or filter criteria'}</p>
                ${products.length === 0 ? '<button class="btn btn-primary" onclick="showAddProduct()">Add Item</button>' : ''}
            </div>
        `;
        return;
    }
    
    const productsHTML = `
        <div class="inventory-grid">
            ${filteredProducts.map(product => {
                const status = getProductStatus(product);
                const canDonate = getDaysUntilExpiry(product.expiryDate) <= 30;
                
                return `
                    <div class="product-card">
                        <div class="product-header">
                            <div class="product-info">
                                <h3>${product.name}</h3>
                                <p>${product.brand}</p>
                                <span class="product-category">${product.category}</span>
                            </div>
                            <div class="product-actions">
                                <button class="icon-btn edit" onclick="editProduct('${product.id}')" title="Edit item">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="icon-btn delete" onclick="deleteProduct('${product.id}')" title="Delete item">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="product-details">
                            <div class="detail-item">
                                <i class="fas fa-calendar"></i>
                                <span>: ${formatDate(product.expiryDate)}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-box"></i>
                                <span>${product.quantity} ${product.unit}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${product.location}</span>
                            </div>
                        </div>
                        
                        <div class="product-footer">
                            <span class="status-badge ${status.class}">
                                <i class="${status.icon}"></i>
                                ${status.label.split(' ')[0]}
                            </span>
                            ${canDonate ? `
                                <button class="donate-btn" onclick="donateProduct('${product.id}')">
                                    <i class="fas fa-heart"></i>
                                    Donate
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    inventoryContent.innerHTML = productsHTML;
}

function editProduct(productId) {
    // In a real app, this would open an edit modal
    console.log('Edit product:', productId);
    addNotification({
        type: 'info',
        title: 'Edit Feature',
        message: 'Product editing feature will be available in the next update.'
    });
}

function donateProduct(productId) {
    switchView('donations');
    // Auto-select the product for donation
    setTimeout(() => {
        const productElement = document.querySelector(`[data-product-id="${productId}"]`);
        if (productElement) {
            productElement.click();
        }
    }, 100);
}

// Donations functions
function updateDonations() {
    updateDonationItems();
    updateDonationStats();
    updateRecentDonations();
}

function updateDonationItems() {
    const donationItems = document.getElementById('donation-items');
    const createDonationBtn = document.getElementById('create-donation-btn');
    
    // Get items eligible for donation (expiring within 30 days)
    const eligibleProducts = products.filter(product => {
        const days = getDaysUntilExpiry(product.expiryDate);
        return days <= 30 && days > 0;
    });
    
    if (eligibleProducts.length === 0) {
        donationItems.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box"></i>
                <h4>No Items Ready for Donation</h4>
                <p>Items expiring soon will appear here automatically</p>
            </div>
        `;
        createDonationBtn.style.display = 'none';
        return;
    }
    
    createDonationBtn.style.display = 'block';
    
    const itemsHTML = `
        <div class="donation-items">
            ${eligibleProducts.map(product => {
                const days = getDaysUntilExpiry(product.expiryDate);
                const isSelected = selectedProducts.includes(product.id);
                
                return `
                    <div class="donation-item ${isSelected ? 'selected' : ''}" data-product-id="${product.id}" onclick="toggleProductSelection('${product.id}')">
                        <div class="donation-item-header">
                            <div>
                                <h4>${product.name}</h4>
                                <p>${product.brand} • ${product.category}</p>
                                <div class="donation-item-details">
                                    <span>Expires: ${formatDate(product.expiryDate)}</span>
                                    <span style="color: ${days < 0 ? '#ef4444' : '#f59e0b'}; font-weight: 500;">
                                        ${days < 0 ? `${Math.abs(days)} days ago` : `${days} days left`}
                                    </span>
                                </div>
                            </div>
                            <div class="selection-indicator"></div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    donationItems.innerHTML = itemsHTML;
}

function updateDonationStats() {
    const availableDonations = products.filter(p => getDaysUntilExpiry(p.expiryDate) <= 30 && getDaysUntilExpiry(p.expiryDate) > 0).length;
    const totalDonations = donations.length;
    
    document.getElementById('available-donations').textContent = availableDonations;
    document.getElementById('total-donations').textContent = totalDonations;
}

function updateRecentDonations() {
    const recentDonationsSection = document.getElementById('recent-donations');
    const donationsList = document.getElementById('donations-list');
    
    if (donations.length === 0) {
        recentDonationsSection.style.display = 'none';
        return;
    }
    
    recentDonationsSection.style.display = 'block';
    
    const recentDonations = donations.slice(0, 3);
    const donationsHTML = recentDonations.map(donation => `
        <div class="donation-history-item">
            <div class="donation-icon">
                <i class="fas fa-heart"></i>
            </div>
            <div class="donation-history-content">
                <h4>${donation.products.length} items donated to ${donation.ngo.name}</h4>
                <p>Created ${formatDate(donation.createdAt)}</p>
            </div>
            <div class="donation-status status-${donation.status}">
                ${donation.status}
            </div>
        </div>
    `).join('');
    
    donationsList.innerHTML = donationsHTML;
}

function toggleProductSelection(productId) {
    if (selectedProducts.includes(productId)) {
        selectedProducts = selectedProducts.filter(id => id !== productId);
    } else {
        selectedProducts.push(productId);
    }
    
    updateDonationItems();
    updateDonationFormButton();
}

function selectNGO(ngoId) {
    selectedNGO = ngoId;
    
    // Update NGO selection UI
    document.querySelectorAll('.ngo-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-ngo-id="${ngoId}"]`)?.classList.add('selected');
    
    updateDonationFormButton();
}

function showDonationForm() {
    document.getElementById('donation-modal').classList.add('active');
    updateDonationFormContent();
}

function hideDonationForm() {
    document.getElementById('donation-modal').classList.remove('active');
    selectedProducts = [];
    selectedNGO = null;
    document.getElementById('donation-message').value = '';
    updateDonationItems();
}

function updateDonationFormContent() {
    document.getElementById('selected-items-count').textContent = selectedProducts.length;
    
    const selectedNgoName = document.getElementById('selected-ngo-name');
    if (selectedNGO) {
        const ngo = ngos.find(n => n.id === selectedNGO);
        selectedNgoName.textContent = ngo ? ngo.name : 'Please select an NGO from the list.';
    } else {
        selectedNgoName.textContent = 'Please select an NGO from the list.';
    }
    
    updateDonationFormButton();
}

function updateDonationFormButton() {
    const createBtn = document.querySelector('#donation-modal .btn-primary');
    if (createBtn) {
        createBtn.disabled = selectedProducts.length === 0 || !selectedNGO;
    }
}

function createDonation() {
    if (selectedProducts.length === 0 || !selectedNGO) return;
    
    const donation = {
        id: generateId(),
        products: selectedProducts.map(id => products.find(p => p.id === id)),
        ngo: ngos.find(n => n.id === selectedNGO),
        message: document.getElementById('donation-message').value,
        status: 'pending',
        createdAt: new Date().toISOString(),
        estimatedPickup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    donations.push(donation);
    hideDonationForm();
    
    addNotification({
        type: 'donation',
        title: '💝 Donation Request Created',
        message: `Your donation of ${donation.products.length} item(s) to ${donation.ngo.name} has been submitted.`,
        actionText: 'View Status'
    });
    
    updateDonations();
}

// Notification functions
function addNotification(notification) {
    const newNotification = {
        id: generateId(),
        ...notification,
        read: false,
        createdAt: new Date().toISOString()
    };
    
    notifications.unshift(newNotification);
    
    // Keep only last 20 notifications
    if (notifications.length > 20) {
        notifications = notifications.slice(0, 20);
    }
    
    updateNotificationBadge();
    updateNotificationsPanel();
}

function updateNotificationBadge() {
    const badge = document.getElementById('notification-count');
    const unreadCount = notifications.filter(n => !n.read).length;
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function toggleNotifications() {
    const panel = document.getElementById('notifications-panel');
    panel.classList.toggle('active');
    
    if (panel.classList.contains('active')) {
        updateNotificationsPanel();
    }
}

function updateNotificationsPanel() {
    const notificationsList = document.getElementById('notifications-list');
    const notificationStatus = document.getElementById('notification-status');
    const markAllReadBtn = document.getElementById('mark-all-read');
    
    const unreadCount = notifications.filter(n => !n.read).length;
    
    if (unreadCount > 0) {
        notificationStatus.textContent = `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`;
        markAllReadBtn.style.display = 'block';
    } else {
        notificationStatus.textContent = 'All caught up!';
        markAllReadBtn.style.display = 'none';
    }
    
    if (notifications.length === 0) {
        notificationsList.innerHTML = `
            <div class="empty-notifications">
                <i class="fas fa-bell"></i>
                <h4>No Notifications</h4>
                <p>You'll receive notifications about expiring items and donation updates here.</p>
            </div>
        `;
        return;
    }
    
    const notificationsHTML = notifications.map(notification => {
        const iconMap = {
            'expired': { icon: 'fas fa-exclamation-triangle', color: 'color: #ef4444; background: #fef2f2;' },
            'expiring-soon': { icon: 'fas fa-clock', color: 'color: #f59e0b; background: #fffbeb;' },
            'donation': { icon: 'fas fa-heart', color: 'color: #ec4899; background: #fdf2f8;' },
            'success': { icon: 'fas fa-check-circle', color: 'color: #10b981; background: #ecfdf5;' },
            'info': { icon: 'fas fa-info-circle', color: 'color: #6b7280; background: #f9fafb;' }
        };
        
        const iconInfo = iconMap[notification.type] || iconMap['info'];
        
        return `
            <div class="notification-item ${!notification.read ? 'unread' : ''}" onclick="markNotificationRead('${notification.id}')">
                <div class="notification-item-icon" style="${iconInfo.color}">
                    <i class="${iconInfo.icon}"></i>
                </div>
                <div class="notification-item-content">
                    <div class="notification-item-header">
                        <h4>${notification.title}</h4>
                        ${!notification.read ? '<div class="unread-indicator"></div>' : ''}
                    </div>
                    <p>${notification.message}</p>
                    <div class="notification-item-footer">
                        <span>${new Date(notification.createdAt).toLocaleString()}</span>
                        ${notification.actionText ? `<button>${notification.actionText}</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    notificationsList.innerHTML = notificationsHTML;
}

function markNotificationRead(notificationId) {
    notifications = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
    );
    
    updateNotificationBadge();
    updateNotificationsPanel();
}

function markAllNotificationsRead() {
    notifications = notifications.map(n => ({ ...n, read: true }));
    updateNotificationBadge();
    updateNotificationsPanel();
}

function generateExpiryNotifications() {
    const today = new Date();
    
    products.forEach(product => {
        const days = getDaysUntilExpiry(product.expiryDate);
        const notificationId = `expiry-${product.id}`;
        
        // Check if we already have a notification for this product
        const existingNotification = notifications.find(n => n.id === notificationId);
        if (existingNotification) return;
        
        if (days < 0) {
            addNotification({
                id: notificationId,
                type: 'expired',
                title: '⚠️ Item Expired',
                message: `${product.name} expired ${Math.abs(days)} day(s) ago. Consider donating or disposing safely.`,
                actionText: 'View Item'
            });
        } else if (days <= 30 && days > 0) {
            addNotification({
                id: notificationId,
                type: 'expiring-soon',
                title: '🕐 Item Expiring Soon',
                message: `${product.name} expires in ${days} day(s). Consider using it soon or donating.`,
                actionText: 'Donate Now'
            });
        }
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Auth form
    document.getElementById('auth-form').addEventListener('submit', handleAuth);
    
    // User type selection
    document.querySelectorAll('.user-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            selectedUserType = this.dataset.type;
            document.querySelectorAll('.user-type-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Input method selection
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (!this.classList.contains('disabled')) {
                selectInputMethod(this.dataset.method);
            }
        });
    });
    
    // Product form
    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);
    
    // Filter inputs
    document.getElementById('search-input')?.addEventListener('input', updateInventory);
    document.getElementById('category-filter')?.addEventListener('change', updateInventory);
    document.getElementById('status-filter')?.addEventListener('change', updateInventory);
    document.getElementById('sort-filter')?.addEventListener('change', updateInventory);
    
    // NGO selection
    document.querySelectorAll('.ngo-card').forEach(card => {
        card.addEventListener('click', function() {
            const ngoId = this.dataset.ngoId || '1'; // Default to first NGO
            selectNGO(ngoId);
        });
    });
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });
    
    // Close notifications panel when clicking outside
    document.addEventListener('click', function(e) {
        const panel = document.getElementById('notifications-panel');
        const notificationBtn = document.querySelector('.notification-btn');
        
        if (!panel.contains(e.target) && !notificationBtn.contains(e.target)) {
            panel.classList.remove('active');
        }
    });
    
    // Initialize NGO data attributes
    document.querySelectorAll('.ngo-card').forEach((card, index) => {
        card.dataset.ngoId = ngos[index].id;
    });
});

// Periodic notification check (simulate real-time monitoring)
setInterval(() => {
    if (currentUser && products.length > 0) {
        generateExpiryNotifications();
    }
}, 60000); // Check every minute