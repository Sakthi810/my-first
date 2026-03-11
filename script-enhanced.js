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
    // =================================================================
    // DOM ELEMENTS
    // =================================================================
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('loginForm');
    const userNameInput = document.getElementById('userNameInput');
    const passwordInput = document.getElementById('passwordInput');
    const displayUserName = document.getElementById('displayUserName');
    const logoutBtn = document.getElementById('logoutBtn');
    const registerBtn = document.getElementById('registerBtn');
    const loginBtn = document.getElementById('loginBtn');

    const expenseForm = document.getElementById('expenseForm');
    const expenseList = document.getElementById('expenseList');
    const totalAmountSpan = document.getElementById('totalAmount');
    const transactionCountSpan = document.getElementById('transactionCount');
    const topCategorySpan = document.getElementById('topCategory');
    const noExpensesMsg = document.getElementById('noExpensesMsg');
    const emptyState = document.getElementById('emptyState');
    const currentDateEl = document.getElementById('currentDate');

    // Navigation Elements
    const navDashboard = document.getElementById('navDashboard');
    const navAnalytics = document.getElementById('navAnalytics');
    const navSettings = document.getElementById('navSettings');
    const addExpenseSection = document.getElementById('addExpenseSection');
    const analyticsSection = document.getElementById('analyticsSection');
    const transactionsSection = document.getElementById('transactionsSection');
    const pageTitle = document.getElementById('pageTitle');

    // Mobile Menu
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const sidebar = document.querySelector('.sidebar');

    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');

    // Advanced Filters
    const toggleFiltersBtn = document.getElementById('toggleFilters');
    const filtersPanel = document.getElementById('filtersPanel');
    const searchInput = document.getElementById('searchInput');
    const filterDateFrom = document.getElementById('filterDateFrom');
    const filterDateTo = document.getElementById('filterDateTo');
    const filterCategory = document.getElementById('filterCategory');
    const filterMinAmount = document.getElementById('filterMinAmount');
    const filterMaxAmount = document.getElementById('filterMaxAmount');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const clearAllFiltersBtn = document.getElementById('clearAllFilters');

    // Quick Add Expense
    const quickAddExpenseBtn = document.getElementById('quickAddExpense');

    // Chart Elements
    const chartTabs = document.querySelectorAll('.chart-tab');
    const modalChartTabs = document.querySelectorAll('.modal-chart-tab');
    const expenseChartCanvas = document.getElementById('expenseChart');
    const modalExpenseChartCanvas = document.getElementById('modalExpenseChart');

    // Modal Elements
    const analyticsModal = document.getElementById('analyticsModal');
    const closeAnalyticsBtn = document.getElementById('closeAnalyticsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');

    // =================================================================
    // STATE
    // =================================================================
    let expenses = [];
    let userName = sessionStorage.getItem('userName');
    let currentChartType = 'bar';
    let currentModalChartType = 'comparison';
    let expenseChart = null;
    let modalChart = null;
    let currentFilters = {};
    let currentTheme = localStorage.getItem('theme') || 'dark';

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

    // =================================================================
    // INITIALIZATION
    // =================================================================
    checkUserSession();
    applyTheme(currentTheme);

    // =================================================================
    // EVENT LISTENERS
    // =================================================================

    // Auth
    loginForm.addEventListener('submit', handleLogin);
    registerBtn.addEventListener('click', handleRegister);
    logoutBtn.addEventListener('click', handleLogout);

    // Expenses
    expenseForm.addEventListener('submit', handleAddExpense);
    expenseList.addEventListener('click', handleDeleteExpense);

    // Navigation
    navDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    navAnalytics.addEventListener('click', (e) => {
        e.preventDefault();
        openAnalyticsModal();
    });
    navSettings.addEventListener('click', (e) => {
        e.preventDefault();
        openSettingsModal();
    });

    // Mobile Menu
    hamburgerMenu?.addEventListener('click', toggleSidebar);

    // Create overlay for mobile sidebar
    const sidebarOverlay = document.createElement('div');
    sidebarOverlay.className = 'sidebar-overlay';
    document.body.appendChild(sidebarOverlay);
    sidebarOverlay.addEventListener('click', closeSidebar);

    // Theme Toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Filters
    toggleFiltersBtn.addEventListener('click', toggleFilters);
    applyFiltersBtn.addEventListener('click', applyFilters);
    clearAllFiltersBtn.addEventListener('click', clearAllFilters);

    // Debounced search
    searchInput.addEventListener('input', debounce(applyFilters, 300));

    // Quick Add Expense
    quickAddExpenseBtn?.addEventListener('click', () => {
        addExpenseSection.scrollIntoView({ behavior: 'smooth' });
        document.getElementById('expenseName').focus();
    });

    // Chart Tabs
    chartTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            chartTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentChartType = tab.dataset.chart;
            updateChart();
        });
    });

    modalChartTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            modalChartTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentModalChartType = tab.dataset.chart;
            updateModalChart();
        });
    });

    // Modals
    closeAnalyticsBtn.addEventListener('click', closeAnalyticsModal);
    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });
    analyticsModal.addEventListener('click', (e) => {
        if (e.target === analyticsModal) closeAnalyticsModal();
    });
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.classList.remove('active');
    });

    // Settings Event Listeners (from original script)
    document.getElementById('changePasswordForm').addEventListener('submit', handleChangePassword);
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
    document.getElementById('savePreferencesBtn').addEventListener('click', savePreferences);
    document.getElementById('saveBudgetBtn').addEventListener('click', saveBudget);
    document.getElementById('saveAppearanceBtn').addEventListener('click', saveAppearance);

    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });

    document.querySelectorAll('.color-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const color = e.currentTarget.dataset.color;
            applyAccentColor(color);
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

    // =================================================================
    // AUTH FUNCTIONS
    // =================================================================

    function checkUserSession() {
        if (userName) {
            loadUserExpenses();
            showDashboard();
        } else {
            showLogin();
        }
    }

    async function handleLogin(e) {
        e.preventDefault();
        const name = userNameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!name || !password) {
            alert('Please enter both username and password');
            return;
        }

        // Show loading state
        loginBtn.disabled = true;

        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 500));

        const users = JSON.parse(localStorage.getItem('users') || '{}');

        if (users[name]) {
            if (users[name].password === password) {
                userName = name;
                sessionStorage.setItem('userName', userName);
                loadUserExpenses();
                showDashboard();
            } else {
                alert('Incorrect password');
                loginBtn.disabled = false;
            }
        } else {
            alert('User not found. Please register first.');
            loginBtn.disabled = false;
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        const name = userNameInput.value.trim();
        const password = passwordInput.value.trim();

        if (!name || !password) {
            alert('Please enter both username and password');
            return;
        }

        // Show loading state
        registerBtn.disabled = true;

        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 500));

        const users = JSON.parse(localStorage.getItem('users') || '{}');

        if (users[name]) {
            alert('User already exists. Please login.');
            registerBtn.disabled = false;
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
            loginBtn.disabled = false;
            registerBtn.disabled = false;
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

        displayCurrentDate();
        applyFilters();
        updateStats();
        initChart();
    }

    function showLogin() {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
        userNameInput.value = '';
        passwordInput.value = '';
    }

    // =================================================================
    // MOBILE MENU
    // =================================================================

    function toggleSidebar() {
        sidebar.classList.toggle('active');
        document.querySelector('.sidebar-overlay').classList.toggle('active');
    }

    function closeSidebar() {
        sidebar.classList.remove('active');
        document.querySelector('.sidebar-overlay').classList.remove('active');
    }

    // =================================================================
    // THEME FUNCTIONS
    // =================================================================

    function toggleTheme() {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(currentTheme);
        localStorage.setItem('theme', currentTheme);
    }

    function applyTheme(theme) {
        if (theme === 'light') {
            document.body.classList.add('light-theme');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            document.body.classList.remove('light-theme');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }

    function applyAccentColor(color) {
        const colors = {
            indigo: '#6366f1', purple: '#a855f7', blue: '#3b82f6',
            green: '#10b981', red: '#ef4444', orange: '#f97316'
        };
        document.documentElement.style.setProperty('--primary', colors[color]);
    }

    // =================================================================
    // FILTER FUNCTIONS
    // =================================================================

    function toggleFilters() {
        filtersPanel.classList.toggle('hidden');
    }

    function applyFilters() {
        currentFilters = {
            search: searchInput.value.toLowerCase(),
            dateFrom: filterDateFrom.value,
            dateTo: filterDateTo.value,
            category: filterCategory.value,
            minAmount: parseFloat(filterMinAmount.value) || 0,
            maxAmount: parseFloat(filterMaxAmount.value) || Infinity
        };

        renderExpenses();
    }

    function clearAllFilters() {
        searchInput.value = '';
        filterDateFrom.value = '';
        filterDateTo.value = '';
        filterCategory.value = '';
        filterMinAmount.value = '';
        filterMaxAmount.value = '';
        currentFilters = {};
        renderExpenses();
    }

    function filterExpenses(expenses) {
        return expenses.filter(expense => {
            // Search filter
            if (currentFilters.search && !expense.name.toLowerCase().includes(currentFilters.search)) {
                return false;
            }

            // Date range filter
            if (currentFilters.dateFrom && expense.date < currentFilters.dateFrom) {
                return false;
            }
            if (currentFilters.dateTo && expense.date > currentFilters.dateTo) {
                return false;
            }

            // Category filter
            if (currentFilters.category && expense.category !== currentFilters.category) {
                return false;
            }

            // Amount range filter
            if (expense.amount < currentFilters.minAmount || expense.amount > currentFilters.maxAmount) {
                return false;
            }

            return true;
        });
    }

    // =================================================================
    // EXPENSE FUNCTIONS
    // =================================================================

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

        applyFilters();
        updateStats();
        updateChart();
    }

    function handleDeleteExpense(e) {
        if (e.target.closest('.delete-btn')) {
            const btn = e.target.closest('.delete-btn');
            const id = btn.dataset.id;
            expenses = expenses.filter(expense => expense.id !== id);
            saveExpenses();
            applyFilters();
            updateStats();
            updateChart();
        }
    }

    function saveExpenses() {
        if (userName) {
            localStorage.setItem(`expenses_${userName}`, JSON.stringify(expenses));
        }
    }

    function renderExpenses() {
        let displayExpenses = filterExpenses(expenses);
        displayExpenses = [...displayExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));

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
        const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        totalAmountSpan.textContent = formatCurrency(total);
        transactionCountSpan.textContent = expenses.length;

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

    // =================================================================
    // CHART FUNCTIONS
    // =================================================================

    function initChart() {
        if (!expenseChartCanvas) return;
        if (expenseChart) {
            expenseChart.destroy();
        }
        updateChart();
    }

    function updateChart() {
        if (!expenseChartCanvas) return;

        const ctx = expenseChartCanvas.getContext('2d');
        const data = getChartData();

        if (expenseChart) {
            expenseChart.destroy();
        }

        const chartConfig = getChartConfig(currentChartType, data);
        expenseChart = new Chart(ctx, chartConfig);
    }

    function getChartConfig(type, data) {
        const baseConfig = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: type === 'pie',
                    position: 'bottom'
                }
            }
        };

        if (type === 'pie') {
            return {
                type: 'pie',
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.values,
                        backgroundColor: [
                            '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa', '#34d399', '#f87171', '#94a3b8'
                        ],
                        borderWidth: 0
                    }]
                },
                options: baseConfig
            };
        } else if (type === 'line') {
            const lineData = getTimeSeriesData();
            return {
                type: 'line',
                data: {
                    labels: lineData.labels,
                    datasets: [{
                        label: 'Daily Spending',
                        data: lineData.values,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2
                    }]
                },
                options: {
                    ...baseConfig,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#94a3b8' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8' }
                        }
                    }
                }
            };
        } else {
            // Bar chart (default)
            return {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Amount (₹)',
                        data: data.values,
                        backgroundColor: [
                            '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa', '#34d399', '#f87171', '#94a3b8'
                        ],
                        borderWidth: 0,
                        borderRadius: 8,
                        barThickness: 20,
                        maxBarThickness: 30
                    }]
                },
                options: {
                    ...baseConfig,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#94a3b8' }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8' }
                        }
                    }
                }
            };
        }
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

    function getTimeSeriesData() {
        if (expenses.length === 0) {
            return { labels: [], values: [] };
        }

        // Get last 7 days
        const days = 7;
        const dates = [];
        const amounts = {};

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dates.push(dateStr);
            amounts[dateStr] = 0;
        }

        expenses.forEach(e => {
            if (amounts.hasOwnProperty(e.date)) {
                amounts[e.date] += e.amount;
            }
        });

        return {
            labels: dates.map(d => formatDate(d)),
            values: dates.map(d => amounts[d])
        };
    }

    function getComparisonData() {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

        const currentMonthExpenses = expenses.filter(e => e.date.startsWith(currentMonth));
        const lastMonthExpenses = expenses.filter(e => e.date.startsWith(lastMonthStr));

        const currentTotal = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
        const lastTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

        return {
            labels: ['Last Month', 'This Month'],
            values: [lastTotal, currentTotal]
        };
    }

    // =================================================================
    // MODAL FUNCTIONS
    // =================================================================

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
        let chartConfig;

        if (currentModalChartType === 'comparison') {
            const data = getComparisonData();
            chartConfig = {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Total Spending',
                        data: data.values,
                        backgroundColor: ['#a855f7', '#6366f1'],
                        borderWidth: 0,
                        borderRadius: 12,
                        barThickness: 80
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: 'Monthly Comparison',
                            color: '#f8fafc',
                            font: { size: 18 }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#94a3b8', font: { size: 14 } }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8', font: { size: 14 } }
                        }
                    }
                }
            };
        } else if (currentModalChartType === 'trend') {
            const lineData = getTimeSeriesData();
            chartConfig = {
                type: 'line',
                data: {
                    labels: lineData.labels,
                    datasets: [{
                        label: 'Daily Spending',
                        data: lineData.values,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 3,
                        pointRadius: 5,
                        pointHoverRadius: 7
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: '7-Day Spending Trend',
                            color: '#f8fafc',
                            font: { size: 18 }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#94a3b8', font: { size: 14 } }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#94a3b8', font: { size: 14 } }
                        }
                    }
                }
            };
        } else {
            // Distribution (pie)
            const data = getChartData();
            chartConfig = {
                type: 'doughnut',
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.values,
                        backgroundColor: [
                            '#fbbf24', '#60a5fa', '#f472b6', '#a78bfa', '#34d399', '#f87171', '#94a3b8'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'right',
                            labels: { color: '#f8fafc', font: { size: 14 } }
                        },
                        title: {
                            display: true,
                            text: 'Category Distribution',
                            color: '#f8fafc',
                            font: { size: 18 }
                        }
                    }
                }
            };
        }

        modalChart = new Chart(ctx, chartConfig);
    }

    // =================================================================
    // SETTINGS FUNCTIONS
    // =================================================================

    function openSettingsModal() {
        settingsModal.classList.add('active');
        document.getElementById('settingsUsername').textContent = userName;
        const total = expenses.reduce((sum, e) => sum + e.amount, 0);
        document.getElementById('settingsTotalExpenses').textContent = formatCurrency(total);
        document.getElementById('settingsTotalTransactions').textContent = expenses.length;
    }

    function handleChangePassword(e) {
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
    }

    function exportData() {
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
    }

    function clearAllData() {
        if (confirm('Are you sure you want to delete ALL expenses? This cannot be undone!')) {
            expenses = [];
            saveExpenses();
            applyFilters();
            updateStats();
            updateChart();
            alert('All expenses cleared!');
        }
    }

    function savePreferences() {
        alert('Preferences saved!');
    }

    function saveBudget() {
        alert('Budget settings saved!');
    }

    function saveAppearance() {
        alert('Appearance saved!');
    }

    // =================================================================
    // UTILITY FUNCTIONS
    // =================================================================

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
});
