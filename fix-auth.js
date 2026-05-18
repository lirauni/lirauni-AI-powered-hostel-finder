const fs = require('fs');
let html = fs.readFileSync('host.html', 'utf8');

// Fix restoreSession - replace the whole IIFE
html = html.replace(
    /\/\/ Restore session[\s\S]*?\}\)\(\);/,
    `// Restore session and view on page load / refresh
(function restoreSession() {
    const saved = localStorage.getItem('liraHostelUser');
    if (saved) {
        try {
            const user = JSON.parse(saved);
            if (!user.role && user.type) user.role = user.type;
            if (!user.type && user.role) user.type = user.role;
            currentUser = user;
            document.getElementById('auth-section').style.display = 'none';
            const us = document.getElementById('user-section');
            us.classList.remove('hidden');
            us.style.display = 'flex';
            document.getElementById('username').textContent = user.name;
        } catch (e) {
            localStorage.removeItem('liraHostelUser');
            localStorage.removeItem('liraToken');
        }
    }

    const hash = window.location.hash.replace('#', '');
    const validViews = [
        'home-view', 'login-view', 'register-view', 'hostels-view',
        'about-view', 'contact-view', 'student-dashboard-view',
        'admin-dashboard-view', 'hostel-owner-dashboard-view'
    ];

    let targetView = 'home-view';
    const role = currentUser ? (currentUser.role || currentUser.type) : null;

    if (hash && validViews.includes(hash)) {
        const protectedViews = {
            'student-dashboard-view':      'student',
            'admin-dashboard-view':        'admin',
            'hostel-owner-dashboard-view': 'hostel-owner'
        };
        if (protectedViews[hash]) {
            targetView = (currentUser && role === protectedViews[hash]) ? hash : 'login-view';
        } else {
            targetView = hash;
        }
    } else if (currentUser) {
        if (role === 'admin')             targetView = 'admin-dashboard-view';
        else if (role === 'hostel-owner') targetView = 'hostel-owner-dashboard-view';
        else                              targetView = 'student-dashboard-view';
    }

    showView(targetView);
    if (targetView === 'student-dashboard-view') initSwipers();
    renderAdminBookings();
    renderMessages();
    renderUsersTable();
    renderReviews();
})();`
);

fs.writeFileSync('host.html', html, 'utf8');
console.log('✅  Auth fixed!');
