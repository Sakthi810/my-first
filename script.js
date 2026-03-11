// =================================================================
// PERFORMANCE OPTIMIZATIONS
// =================================================================

// Debounce function for input events
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// RAF for smooth DOM updates
const smoothUpdate = (callback) => {
    requestAnimationFrame(() => {
        callback();
    });
};

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('loginForm');
    const userNameInput = document.getElementById('userNameInput');
    const passwordInput = document.getElementById('passwordInput');
    const displayUserName = document.getElementById('displayUserName');
    const logoutBtn = document.getElementById('logoutBtn');
    const registerBtn = document.getElementById('registerBtn');

    const expenseForm = document.getElementById('expenseForm');
    const expenseList = document.getElementById('expenseList');
    const totalAmountSpan = document.getElementById('totalAmount');
    const transactionCountSpan = document.getElementById('transactionCount');
    const topCategorySpan = document.getElementById('topCategory');
    const filterDateInput = document.getElementById('filterDate');
    const clearFilterBtn = document.getElementById('clearFilterBtn');
    const noExpensesMsg = document.getElementById('noExpensesMsg');
    const emptyState = document.getElementById('emptyState');
    const currentDateEl = document.getElementById('currentDate');

    // Navigation Elements
    const navDashboard = document.getElementById('navDashboard');
    const navAnalytics = document.getElementById('navAnalytics');
    const addExpenseSection = document.getElementById('addExpenseSection');
    const analyticsSection = document.getElementById('analyticsSection');
    const transactionsSection = document.getElementById('transactionsSection');
    const pageTitle = document.getElementById('pageTitle');
    const contentGrid = document.querySelector('.content-grid');



    // Modal Elements
    const analyticsModal = document.getElementById('analyticsModal');
    const closeAnalyticsBtn = document.getElementById('closeAnalyticsBtn');
    const modalExpenseChartCanvas = document.getElementById('modalExpenseChart');

    // Chart Instances
    let expenseChart = null;
    let modalChart = null;

    // State
    let expenses = [];
    let userName = sessionStorage.getItem('userName');

    // Icons Mapping
    const categoryIcons = {
        'Food': '<i class="fas fa-utensils" style="color: #fbbf24"></i>',
        'Transport': '<i class="fas fa-car" style="color: #60a5fa"></i>',
        'Utilities': '<i class="fas fa-bolt" style="color: #f472b6"></i>',
        'Entertainment': '<i class="fas fa-film" style="color: #a78bfa"></i>',
        'Shopping': '<i class="fas fa-shopping-bag" style="color: #34d399"></i>',
        'Health': '<i class="fas fa-heartbeat" style="color: #f87171"></i>',
        'Other': '<i class="fas fa-circle" style="color: #94a3b8"></i>'
    };

    // Initialize
    checkUserSession();

    // Event Listeners
    loginForm.addEventListener('submit', handleLogin);
    registerBtn.addEventListener('click', handleRegister);
    logoutBtn.addEventListener('click', handleLogout);
    expenseForm.addEventListener('submit', handleAddExpense);
    filterDateInput.addEventListener('change', handleFilterChange);
    clearFilterBtn.addEventListener('click', clearFilter);
    expenseList.addEventListener('click', handleDeleteExpense);

    // Navigation Listeners
    navDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        // Just scroll to top or do nothing if already on dashboard
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    navAnalytics.addEventListener('click', (e) => {
        e.preventDefault();
        openAnalyticsModal();
    });

    closeAnalyticsBtn.addEventListener('click', closeAnalyticsModal);

    // Close modal when clicking outside
    analyticsModal.addEventListener('click', (e) => {
        if (e.target === analyticsModal) {
            closeAnalyticsModal();
        }
    });

    // User Session Functions
    function checkUserSession() {
        if (userName) {
            loadUserExpenses();
            showDashboard();
        } else {
            showLogin();
        }
    }

    function handleLogin(e) {
        e.preventDefault();
        const name = userNameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!name || !password) {
            alert('Please enter both username and password');
            return;
        }

        const users = JSON.parse(localStorage.getItem('users') || '{}');

        if (users[name]) {
            // User exists, check password
            if (users[name].password === password) {
                userName = name;
                sessionStorage.setItem('userName', userName);
                loadUserExpenses();
                showDashboard();
            } else {
                alert('Incorrect password');
            }
        } else {
            alert('User not found. Please register first.');
        }
    }

    function handleRegister(e) {
        e.preventDefault();
        const name = userNameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!name || !password) {
            alert('Please enter both username and password');
            return;
        }

        const users = JSON.parse(localStorage.getItem('users') || '{}');

        if (users[name]) {
            alert('User already exists. Please login.');
        } else {
            users[name] = { password: password };
            localStorage.setItem('users', JSON.stringify(users));

            alert('Registration successful! Logging you in...');
            userName = name;
            sessionStorage.setItem('userName', userName);
            loadUserExpenses();
            showDashboard();
        }
    }

    function handleLogout(e) {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            sessionStorage.removeItem('userName');
            userName = null;
            expenses = [];
            showLogin();
        }
    }

    function loadUserExpenses() {
        const storedExpenses = localStorage.getItem(`expenses_${userName}`);
        expenses = storedExpenses ? JSON.parse(storedExpenses) : [];
    }

    function showDashboard() {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        displayUserName.textContent = userName;

        // Initialize Dashboard Components
        displayCurrentDate();
        renderExpenses();
        updateStats();
        initChart();
    }

    function showLogin() {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        userNameInput.value = '';
        passwordInput.value = '';
    }

    function openAnalyticsModal() {
        analyticsModal.classList.add('active');
        updateModalChart();
    }

    function closeAnalyticsModal() {
        analyticsModal.classList.remove('active');
    }

    function updateModalChart() {
        if (modalChart) {
            modalChart.destroy();
        }

        const ctx = modalExpenseChartCanvas.getContext('2d');
        const data = getChartData();

        modalChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Amount (₹)',
                    data: data.values,
                    backgroundColor: [
                        '#fbbf24', // Food
                        '#60a5fa', // Transport
                        '#f472b6', // Utilities
                        '#a78bfa', // Entertainment
                        '#34d399', // Shopping
                        '#f87171', // Health
                        '#94a3b8'  // Other
                    ],
                    borderWidth: 0,
                    borderRadius: 8,
                    barThickness: 40,
                    maxBarThickness: 50
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Expense Distribution',
                        color: '#f8fafc',
                        font: {
                            size: 16,
                            family: "'Outfit', sans-serif"
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            font: {
                                size: 14
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#94a3b8',
                            font: {
                                size: 14
                            }
                        }
                    }
                }
            }
        });
    }

    // Dashboard Functions
    function displayCurrentDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateEl.textContent = now.toLocaleDateString('en-IN', options);
    }

    function handleAddExpense(e) {
        e.preventDefault();

        const name = document.getElementById('expenseName').value;
        const amount = parseFloat(document.getElementById('expenseAmount').value);
        const category = document.getElementById('expenseCategory').value;
        const date = document.getElementById('expenseDate').value;

        if (!name || !amount || !category || !date) {
            alert('Please fill in all fields');
            return;
        }

        const newExpense = {
            id: Date.now().toString(),
            name,
            amount,
            category,
            date
        };

        expenses.push(newExpense);
        saveExpenses();
        expenseForm.reset();

        renderExpenses();
        updateStats();
        updateChart();
    }

    function handleDeleteExpense(e) {
        if (e.target.closest('.delete-btn')) {
            const btn = e.target.closest('.delete-btn');
            const id = btn.dataset.id;
            expenses = expenses.filter(expense => expense.id !== id);
            saveExpenses();
            renderExpenses();
            updateStats();
            updateChart();
        }
    }

    function saveExpenses() {
        if (userName) {
            localStorage.setItem(`expenses_${userName}`, JSON.stringify(expenses));
        }
    }

    function handleFilterChange() {
        renderExpenses();
    }

    function clearFilter() {
        filterDateInput.value = '';
        renderExpenses();
    }

    function renderExpenses() {
        const selectedDate = filterDateInput.value;
        let displayExpenses = expenses;

        if (selectedDate) {
            displayExpenses = expenses.filter(e => e.date === selectedDate);
            clearFilterBtn.style.display = 'inline-block';
        } else {
            clearFilterBtn.style.display = 'none';
            displayExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        expenseList.innerHTML = '';

        if (expenses.length === 0) {
            emptyState.classList.remove('hidden');
            noExpensesMsg.classList.add('hidden');
            document.getElementById('expenseTable').classList.add('hidden');
        } else if (displayExpenses.length === 0) {
            emptyState.classList.add('hidden');
            noExpensesMsg.classList.remove('hidden');
            document.getElementById('expenseTable').classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            noExpensesMsg.classList.add('hidden');
            document.getElementById('expenseTable').classList.remove('hidden');

            displayExpenses.forEach(expense => {
                const row = document.createElement('tr');
                const icon = categoryIcons[expense.category] || categoryIcons['Other'];

                row.innerHTML = `
                    <td>${formatDate(expense.date)}</td>
                    <td>${expense.name}</td>
                    <td><span class="category-icon">${icon}</span> ${expense.category}</td>
                    <td style="font-weight: 600; color: var(--text-main)">${formatCurrency(expense.amount)}</td>
                    <td><button class="delete-btn" data-id="${expense.id}"><i class="fas fa-trash"></i></button></td>
                `;
                expenseList.appendChild(row);
            });
        }
    }

    function updateStats() {
        // Total Amount
        const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        totalAmountSpan.textContent = formatCurrency(total);

        // Transaction Count
        transactionCountSpan.textContent = expenses.length;

        // Top Category
        if (expenses.length === 0) {
            topCategorySpan.textContent = 'N/A';
            return;
        }

        const categoryTotals = {};
        expenses.forEach(e => {
            categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
        });

        const topCat = Object.keys(categoryTotals).reduce((a, b) => categoryTotals[a] > categoryTotals[b] ? a : b);
        topCategorySpan.textContent = topCat;
    }

    function initChart() {
        if (expenseChart) {
            expenseChart.destroy();
        }

        const ctx = document.getElementById('expenseChart').getContext('2d');
        const data = getChartData();

        expenseChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Amount (₹)',
                    data: data.values,
                    backgroundColor: [
                        '#fbbf24', // Food
                        '#60a5fa', // Transport
                        '#f472b6', // Utilities
                        '#a78bfa', // Entertainment
                        '#34d399', // Shopping
                        '#f87171', // Health
                        '#94a3b8'  // Other
                    ],
                    borderWidth: 0,
                    borderRadius: 8,
                    barThickness: 20,
                    maxBarThickness: 30
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // Hide legend for bar chart to save space
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    }

    function updateChart() {
        if (!expenseChart) {
            initChart();
            return;
        }

        const data = getChartData();
        expenseChart.data.labels = data.labels;
        expenseChart.data.datasets[0].data = data.values;
        expenseChart.update();
    }

    function getChartData() {
        if (expenses.length === 0) {
            return { labels: ['No Data'], values: [1] };
        }

        const categoryTotals = {};
        expenses.forEach(e => {
            categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
        });

        return {
            labels: Object.keys(categoryTotals),
            values: Object.values(categoryTotals)
        };
    }

    function formatDate(dateString) {
        const options = { month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    }

    // =================================================================
    // SETTINGS FUNCTIONALITY
    // =================================================================

    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const navSettings = document.getElementById('navSettings');

    let userSettings = {
        currency: 'INR',
        dateFormat: 'DD/MM/YYYY',
        defaultCategory: '',
        sortOrder: 'newest',
        monthlyBudget: 0,
        budgetAlerts: { alert80: true, alert90: true, alert100: true },
        theme: 'dark',
        accentColor: 'indigo'
    };

    function loadSettings() {
        const saved = localStorage.getItem(`settings_${userName}`);
        if (saved) {
            userSettings = { ...userSettings, ...JSON.parse(saved) };
        }
        applyTheme(userSettings.theme);
        applyAccentColor(userSettings.accentColor);
    }

    function saveSettings() {
        localStorage.setItem(`settings_${userName}`, JSON.stringify(userSettings));
    }

    function applyTheme(theme) {
        document.body.className = theme === 'light' ? 'light-theme' : '';
    }

    function applyAccentColor(color) {
        const colors = {
            indigo: '#6366f1', purple: '#a855f7', blue: '#3b82f6',
            green: '#10b981', red: '#ef4444', orange: '#f97316'
        };
        document.documentElement.style.setProperty('--primary', colors[color]);
    }

    function openSettingsModal() {
        settingsModal.classList.add('active');
        document.getElementById('settingsUsername').textContent = userName;
        const total = expenses.reduce((sum, e) => sum + e.amount, 0);
        document.getElementById('settingsTotalExpenses').textContent = formatCurrency(total);
        document.getElementById('settingsTotalTransactions').textContent = expenses.length;

        document.getElementById('currencySelect').value = userSettings.currency;
        document.getElementById('dateFormatSelect').value = userSettings.dateFormat;
        document.getElementById('defaultCategorySelect').value = userSettings.defaultCategory;
        document.getElementById('sortOrderSelect').value = userSettings.sortOrder;
        document.getElementById('monthlyBudgetInput').value = userSettings.monthlyBudget || '';
        document.getElementById('alert80').checked = userSettings.budgetAlerts.alert80;
        document.getElementById('alert90').checked = userSettings.budgetAlerts.alert90;
        document.getElementById('alert100').checked = userSettings.budgetAlerts.alert100;

        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === userSettings.theme);
        });
        document.querySelectorAll('.color-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === userSettings.accentColor);
        });

        updateBudgetDisplay();
    }

    function updateBudgetDisplay() {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
        const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

        document.getElementById('currentMonthSpending').textContent = formatCurrency(monthTotal);

        if (userSettings.monthlyBudget > 0) {
            document.getElementById('budgetLimit').textContent = formatCurrency(userSettings.monthlyBudget);
            const remaining = userSettings.monthlyBudget - monthTotal;
            document.getElementById('budgetRemaining').textContent = formatCurrency(Math.max(0, remaining));

            const percentage = (monthTotal / userSettings.monthlyBudget) * 100;
            document.getElementById('budgetProgressText').textContent = `${Math.round(percentage)}%`;

            const progressFill = document.getElementById('budgetProgressFill');
            progressFill.style.width = `${Math.min(percentage, 100)}%`;
            progressFill.className = 'progress-fill';
            if (percentage >= 100) progressFill.classList.add('danger');
            else if (percentage >= 80) progressFill.classList.add('warning');
        } else {
            document.getElementById('budgetLimit').textContent = 'Not Set';
            document.getElementById('budgetRemaining').textContent = '-';
            document.getElementById('budgetProgressFill').style.width = '0%';
            document.getElementById('budgetProgressText').textContent = '0%';
        }
    }

    // Settings Event Listeners
    navSettings.addEventListener('click', (e) => {
        e.preventDefault();
        openSettingsModal();
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });

    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.classList.remove('active');
    });

    document.getElementById('changePasswordForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const currentPwd = document.getElementById('currentPassword').value;
        const newPwd = document.getElementById('newPassword').value;
        const confirmPwd = document.getElementById('confirmPassword').value;

        if (users[userName].password !== currentPwd) {
            alert('Current password is incorrect!');
            return;
        }
        if (newPwd !== confirmPwd) {
            alert('New passwords do not match!');
            return;
        }
        if (newPwd.length < 4) {
            alert('Password must be at least 4 characters!');
            return;
        }

        users[userName].password = newPwd;
        localStorage.setItem('users', JSON.stringify(users));
        alert('Password changed successfully!');
        e.target.reset();
    });

    document.getElementById('exportDataBtn').addEventListener('click', () => {
        if (expenses.length === 0) {
            alert('No data to export!');
            return;
        }

        let csv = 'Date,Description,Category,Amount\n';
        expenses.forEach(e => {
            csv += `${e.date},${e.name},${e.category},${e.amount}\n`;
        });
        csv += `\nTotal,,,${expenses.reduce((sum, e) => sum + e.amount, 0)}`;

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fintrack-${userName}-${Date.now()}.csv`;
        a.click();
        alert('Data exported successfully!');
    });

    document.getElementById('clearDataBtn').addEventListener('click', () => {
        if (confirm('Are you sure you want to delete ALL expenses? This cannot be undone!')) {
            expenses = [];
            saveExpenses();
            renderExpenses();
            updateStats();
            updateChart();
            alert('All expenses cleared!');
        }
    });

    document.getElementById('savePreferencesBtn').addEventListener('click', () => {
        userSettings.currency = document.getElementById('currencySelect').value;
        userSettings.dateFormat = document.getElementById('dateFormatSelect').value;
        userSettings.defaultCategory = document.getElementById('defaultCategorySelect').value;
        userSettings.sortOrder = document.getElementById('sortOrderSelect').value;
        saveSettings();
        alert('Preferences saved!');
    });

    document.getElementById('saveBudgetBtn').addEventListener('click', () => {
        userSettings.monthlyBudget = parseFloat(document.getElementById('monthlyBudgetInput').value) || 0;
        userSettings.budgetAlerts = {
            alert80: document.getElementById('alert80').checked,
            alert90: document.getElementById('alert90').checked,
            alert100: document.getElementById('alert100').checked
        };
        saveSettings();
        updateBudgetDisplay();
        alert('Budget settings saved!');
    });

    document.getElementById('saveAppearanceBtn').addEventListener('click', () => {
        saveSettings();
        alert('Appearance saved!');
    });

    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            userSettings.theme = e.currentTarget.dataset.theme;
            applyTheme(userSettings.theme);
        });
    });

    document.querySelectorAll('.color-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            userSettings.accentColor = e.currentTarget.dataset.color;
            applyAccentColor(userSettings.accentColor);
        });
    });

    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabName = e.currentTarget.dataset.tab;
            document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            document.querySelectorAll('.settings-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`${tabName}Tab`).classList.add('active');
        });
    });

    // Load settings on login
    if (userName) {
        loadSettings();
    }
});

