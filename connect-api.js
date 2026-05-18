// Run: node connect-api.js
// Connects host.html to the backend API by replacing localStorage logic

const fs = require('fs');
const path = require('path');

let html = fs.readFileSync('host.html', 'utf8');

// ── 1. setLoggedIn: store JWT token, use role not type ─────────────────────
html = html.replace(
    /function setLoggedIn\(user\) \{[\s\S]*?function setLoggedOut/,
    `function setLoggedIn(user) {
    currentUser = user;
    localStorage.setItem('liraHostelUser', JSON.stringify(user));
    document.getElementById('auth-section').style.display = 'none';
    const us = document.getElementById('user-section');
    us.classList.remove('hidden');
    us.style.display = 'flex';
    document.getElementById('username').textContent = user.name;
    const role = user.role || user.type;
    if (role === 'admin') { showView('admin-dashboard-view'); renderAdminBookings(); renderMessages(); renderUsersTable(); renderReviews(); }
    else if (role === 'hostel-owner') { showView('hostel-owner-dashboard-view'); renderAdminBookings(); }
    else { showView('student-dashboard-view'); initSwipers(); }
}

function setLoggedOut`
);

// ── 2. setLoggedOut: clear token ───────────────────────────────────────────
html = html.replace(
    /function setLoggedOut\(\) \{[\s\S]*?showView\('home-view'\);\s*\}/,
    `function setLoggedOut() {
    currentUser = null;
    localStorage.removeItem('liraHostelUser');
    apiLogout();
    document.getElementById('auth-section').style.display = 'flex';
    const us = document.getElementById('user-section');
    us.classList.add('hidden');
    us.style.display = 'none';
    history.replaceState(null, '', window.location.pathname);
    showView('home-view');
}`
);

// ── 3. restoreSession: use JWT token ──────────────────────────────────────
html = html.replace(
    /\/\/ Restore session and view on page load[\s\S]*?\}\)\(\);/,
    `// ── INIT ───────────────────────────────────────────────────────────────────
(function restoreSession() {
    const saved = localStorage.getItem('liraHostelUser');
    const token = localStorage.getItem('liraToken');
    if (saved && token) {
        try {
            const user = JSON.parse(saved);
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
        if (role === 'admin') targetView = 'admin-dashboard-view';
        else if (role === 'hostel-owner') targetView = 'hostel-owner-dashboard-view';
        else targetView = 'student-dashboard-view';
    }

    showView(targetView);
    if (targetView === 'student-dashboard-view') initSwipers();
    renderAdminBookings();
    renderMessages();
    renderUsersTable();
    renderReviews();
})();`
);

// ── 4. Replace login form handler ─────────────────────────────────────────
const loginOld = /document\.getElementById\('login-form'\)\.addEventListener\('submit', function[\s\S]*?\}\);(\s*\/\/ .* REGISTER)/;
html = html.replace(loginOld, `document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const pass  = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    if (!email || !pass) { errEl.textContent = 'Please fill in all fields.'; errEl.classList.remove('hidden'); return; }
    try {
        const user = await apiLogin(email, pass);
        errEl.classList.add('hidden');
        setLoggedIn({ name: user.name, email: user.email, role: user.role });
        this.reset();
    } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
    }
});
$1`);

// ── 5. Replace register form handler ──────────────────────────────────────
const regOld = /document\.getElementById\('register-form'\)\.addEventListener\('submit', function[\s\S]*?\}\);(\s*\/\/ .* SLIDERS)/;
html = html.replace(regOld, `document.getElementById('register-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const name    = document.getElementById('reg-fullname').value.trim();
    const email   = document.getElementById('reg-email').value.trim().toLowerCase();
    const phone   = document.getElementById('reg-phone').value.trim();
    const pass    = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm-password').value;
    const type    = document.getElementById('reg-user-type').value;
    const terms   = document.getElementById('terms').checked;
    const errEl   = document.getElementById('register-error');
    if (!name || !email || !phone || !pass) { errEl.textContent = 'Please fill in all fields.'; errEl.classList.remove('hidden'); return; }
    if (pass !== confirm) { errEl.textContent = 'Passwords do not match.'; errEl.classList.remove('hidden'); return; }
    if (pass.length < 6) { errEl.textContent = 'Password must be at least 6 characters.'; errEl.classList.remove('hidden'); return; }
    if (!terms) { errEl.textContent = 'Please accept the Terms of Service.'; errEl.classList.remove('hidden'); return; }
    try {
        await apiRegister(name, email, phone, pass, type);
        errEl.classList.add('hidden');
        this.reset();
        showToast('Account created! You can now log in.');
        setTimeout(() => showView('login-view'), 1500);
    } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
        if (err.message.includes('already exists')) {
            setTimeout(() => { document.getElementById('login-email').value = email; showView('login-view'); }, 2000);
        }
    }
});
$1`);

// ── 6. Replace booking submit ──────────────────────────────────────────────
const bookOld = /function submitBooking\(e\) \{[\s\S]*?function renderAdminBookings/;
html = html.replace(bookOld, `function submitBooking(e) {
    e.preventDefault();
    const name     = document.getElementById('book-name').value.trim();
    const year     = document.getElementById('book-year').value;
    const roomType = document.getElementById('book-room-type').value;
    const contact  = document.getElementById('book-contact').value.trim();
    const regno    = document.getElementById('book-regno').value.trim();
    const email    = document.getElementById('book-email').value.trim();
    const gender   = document.getElementById('book-gender').value;
    const date     = document.getElementById('book-date').value;
    const hostel   = document.getElementById('modal-hostel-name').textContent;

    if (!name || !year || !roomType || !contact || !regno || !email || !gender || !date) {
        showToast('Please fill in all booking details.'); return;
    }

    apiCreateBooking({
        student_name: name, regno, email, phone: contact,
        gender, year, room_type: roomType, hostel_name: hostel, book_date: date
    }).then(() => {
        showToast('Booking for ' + hostel + ' submitted successfully!');
        document.getElementById('booking-form').reset();
        loadBookings();
        setTimeout(() => closeModal(), 2000);
    }).catch(err => showToast('Error: ' + err.message));
}

async function loadBookings() {
    try {
        const bookings = await apiGetBookings();
        allBookings.length = 0;
        bookings.forEach(b => allBookings.push({
            id: b.id, name: b.student_name, regno: b.regno,
            email: b.email, contact: b.phone, gender: b.gender,
            year: b.year, roomType: b.room_type, hostel: b.hostel_name,
            date: b.book_date ? b.book_date.split('T')[0] : b.book_date,
            status: b.status
        }));
        renderAdminBookings();
    } catch(err) { console.error('loadBookings:', err); }
}

function renderAdminBookings`);

// ── 7. updateBookingStatus → API ───────────────────────────────────────────
html = html.replace(
    /function updateBookingStatus\(id, status\) \{[\s\S]*?\}\s*\n\s*\n\s*function deleteBooking/,
    `function updateBookingStatus(id, status) {
    apiUpdateBookingStatus(id, status)
        .then(() => { loadBookings(); showToast('Booking #' + id + ' marked as ' + status + '.'); })
        .catch(err => showToast('Error: ' + err.message));
}

function deleteBooking`
);

// ── 8. deleteBooking → API ─────────────────────────────────────────────────
html = html.replace(
    /function deleteBooking\(id\) \{[\s\S]*?\}\s*\n\s*\n\s*\/\/ .* PRINT/,
    `function deleteBooking(id) {
    if (!confirm('Delete this booking?')) return;
    apiDeleteBooking(id)
        .then(() => { loadBookings(); showToast('Booking deleted.'); })
        .catch(err => showToast('Error: ' + err.message));
}

// ── PRINT`
);

// ── 9. saveBookingEdit → API ───────────────────────────────────────────────
html = html.replace(
    /function saveBookingEdit\(\) \{[\s\S]*?showToast\('Booking #' \+ id \+ ' updated successfully\.'\);\s*\}/,
    `function saveBookingEdit() {
    const id = parseInt(document.getElementById('edit-booking-id').value);
    const payload = {
        student_name: document.getElementById('edit-name').value.trim(),
        regno:        document.getElementById('edit-regno').value.trim(),
        email:        document.getElementById('edit-email').value.trim(),
        phone:        document.getElementById('edit-contact').value.trim(),
        gender:       document.getElementById('edit-gender').value,
        year:         document.getElementById('edit-year').value,
        room_type:    document.getElementById('edit-room-type').value,
        hostel_name:  document.getElementById('edit-hostel').value,
        book_date:    document.getElementById('edit-date').value,
        status:       document.getElementById('edit-status').value
    };
    apiEditBooking(id, payload)
        .then(() => { loadBookings(); closeEditModal(); showToast('Booking #' + id + ' updated successfully.'); })
        .catch(err => showToast('Error: ' + err.message));
}`
);

// ── 10. Contact form → API ─────────────────────────────────────────────────
html = html.replace(
    /document\.getElementById\('contact-form'\)\.addEventListener\('submit', function[\s\S]*?showToast\('Your message has been sent to the admin!'\);\s*\}, 1000\);\s*\}\);/,
    `document.getElementById('contact-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn  = document.getElementById('contact-submit-btn');
    const txt  = document.getElementById('contact-btn-text');
    const spin = document.getElementById('contact-spinner');
    btn.disabled = true; txt.textContent = 'Sending...'; spin.classList.remove('hidden');
    try {
        await apiSendMessage(
            document.getElementById('contact-name').value.trim(),
            document.getElementById('contact-email').value.trim(),
            document.getElementById('contact-subject').value.trim(),
            document.getElementById('contact-message').value.trim()
        );
        this.reset();
        showToast('Your message has been sent to the admin!');
    } catch(err) { showToast('Error: ' + err.message); }
    finally { btn.disabled = false; txt.textContent = 'Send Message'; spin.classList.add('hidden'); }
});`
);

// ── 11. renderMessages → API ───────────────────────────────────────────────
html = html.replace(
    /function renderMessages\(\) \{[\s\S]*?const container = document\.getElementById\('messages-list'\);[\s\S]*?const badge[\s\S]*?if \(allMessages\.length === 0\)/,
    `async function renderMessages() {
    const container = document.getElementById('messages-list');
    const badge     = document.getElementById('messages-badge');
    if (!container) return;
    let msgs = [];
    try { msgs = await apiGetMessages(); } catch(e) { return; }
    const unread = msgs.filter(m => !m.is_read).length;
    if (badge) { if (unread > 0) { badge.textContent = unread; badge.classList.remove('hidden'); } else { badge.classList.add('hidden'); } }
    if (msgs.length === 0)`
);

// ── 12. toggleMessage → API mark read ─────────────────────────────────────
html = html.replace(
    /\/\/ Mark as read when opened\s*const msg = allMessages\.find[\s\S]*?renderMessages\(\);\s*\/\/ Re-open[\s\S]*?\}\s*\}/,
    `// Mark as read via API
    apiMarkMessageRead(id).then(() => renderMessages()).catch(() => {});
    }`
);

// ── 13. sendReply → API ────────────────────────────────────────────────────
html = html.replace(
    /function sendReply\(\) \{[\s\S]*?msg\.reply = text;[\s\S]*?saveMessages\(\);[\s\S]*?renderMessages\(\);/,
    `function sendReply() {
    const text = document.getElementById('reply-text').value.trim();
    if (!text) { showToast('Please type a reply first.'); return; }
    const msgId = replyTargetId;
    apiReplyMessage(msgId, text).then(() => { renderMessages();`
);

// ── 14. deleteMessage → API ────────────────────────────────────────────────
html = html.replace(
    /function deleteMessage\(id\) \{\s*const idx = allMessages\.findIndex[\s\S]*?\}\s*\n\s*\nfunction deleteAllMessages/,
    `function deleteMessage(id) {
    apiDeleteMessage(id).then(() => renderMessages()).catch(err => showToast('Error: ' + err.message));
}

function deleteAllMessages`
);

// ── 15. deleteAllMessages → API ────────────────────────────────────────────
html = html.replace(
    /function deleteAllMessages\(\) \{[\s\S]*?showToast\('All messages cleared\.'\);\s*\}/,
    `function deleteAllMessages() {
    if (!confirm('Delete all messages? This cannot be undone.')) return;
    apiClearMessages().then(() => { renderMessages(); showToast('All messages cleared.'); }).catch(err => showToast('Error: ' + err.message));
}`
);

// ── 16. renderUsersTable → API ─────────────────────────────────────────────
html = html.replace(
    /function renderUsersTable\(\) \{[\s\S]*?const tbody = document\.getElementById\('users-table-body'\);[\s\S]*?if \(!tbody\) return;[\s\S]*?const users = getUsers\(\);/,
    `async function renderUsersTable() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    let users = [];
    try { users = await apiGetUsers(); } catch(e) { return; }`
);

// ── 17. deleteUser → API ───────────────────────────────────────────────────
html = html.replace(
    /function deleteUser\(email\) \{[\s\S]*?showToast\('User removed\.'\);\s*\}/,
    `function deleteUser(id) {
    if (!confirm('Remove this user? This cannot be undone.')) return;
    apiDeleteUser(id).then(() => { renderUsersTable(); renderAdminBookings(); showToast('User removed.'); }).catch(err => showToast('Error: ' + err.message));
}`
);

// ── 18. Fix deleteUser button to use id not email ─────────────────────────
html = html.replace(
    /onclick="deleteUser\('\$\{u\.email\}'\)"/g,
    'onclick="deleteUser(\'${u.id}\')"'
);
// Fix template literal in renderUsersTable
html = html.replace(
    /onclick="deleteUser\('\\$\{u\.email\}'\)"/g,
    'onclick="deleteUser(\'${u.id}\')"'
);

// ── 19. renderReviews → API ────────────────────────────────────────────────
html = html.replace(
    /function renderReviews\(\) \{[\s\S]*?const container = document\.getElementById\('reviews-list'\);[\s\S]*?if \(!container\) return;[\s\S]*?const reviews = getReviews\(\);/,
    `async function renderReviews() {
    const container = document.getElementById('reviews-list');
    if (!container) return;
    let reviews = [];
    try { reviews = await apiGetReviews(); } catch(e) { return; }`
);

// ── 20. approveReview → API ────────────────────────────────────────────────
html = html.replace(
    /function approveReview\(id\) \{[\s\S]*?showToast\('Review approved\.'\);\s*\}/,
    `function approveReview(id) {
    apiApproveReview(id).then(() => { renderReviews(); showToast('Review approved.'); }).catch(err => showToast('Error: ' + err.message));
}`
);

// ── 21. deleteReview → API ─────────────────────────────────────────────────
html = html.replace(
    /function deleteReview\(id\) \{[\s\S]*?showToast\('Review deleted\.'\);\s*\}/,
    `function deleteReview(id) {
    if (!confirm('Delete this review?')) return;
    apiDeleteReview(id).then(() => { renderReviews(); showToast('Review deleted.'); }).catch(err => showToast('Error: ' + err.message));
}`
);

// ── 22. submitAddHostel → API ──────────────────────────────────────────────
html = html.replace(
    /document\.getElementById\('hostels-list'\)\.appendChild\(newCard\);[\s\S]*?closeAddHostelModal\(\);[\s\S]*?showToast\(name \+ ' added successfully!'\);/,
    `apiAddHostel({
        name, distance: parseFloat(distance), price_from: parseInt(price),
        room_type: type, facilities: facs.join(','), availability: status
    }).then(() => {
        closeAddHostelModal();
        showToast(name + ' added successfully!');
        const hostelCountEl = document.getElementById('admin-hostel-count');
        if (hostelCountEl) hostelCountEl.textContent = parseInt(hostelCountEl.textContent) + 1;
    }).catch(err => { errEl.textContent = err.message; errEl.classList.remove('hidden'); });`
);

// ── 23. allBookings localStorage → in-memory only ─────────────────────────
html = html.replace(
    /const allBookings = JSON\.parse\(localStorage\.getItem\('liraHostelBookings'\) \|\| '\[\]'\);/,
    `const allBookings = []; // loaded from API`
);
html = html.replace(/function saveBookings\(\) \{[\s\S]*?\}/m, `function saveBookings() {} // no-op, API handles persistence`);

// ── 24. allMessages localStorage → in-memory only ─────────────────────────
html = html.replace(
    /const allMessages = JSON\.parse\(localStorage\.getItem\('liraHostelMessages'\) \|\| '\[\]'\);/,
    `const allMessages = []; // loaded from API`
);
html = html.replace(/function saveMessages\(\) \{[\s\S]*?\}/m, `function saveMessages() {} // no-op`);

// ── 25. Add loadBookings() call on admin/owner login ──────────────────────
html = html.replace(
    `renderAdminBookings(); renderMessages(); renderUsersTable(); renderReviews(); }`,
    `renderAdminBookings(); renderMessages(); renderUsersTable(); renderReviews(); loadBookings(); }`
);
html = html.replace(
    `showView('hostel-owner-dashboard-view'); renderAdminBookings(); }`,
    `showView('hostel-owner-dashboard-view'); renderAdminBookings(); loadBookings(); }`
);

fs.writeFileSync('host.html', html, 'utf8');
console.log('✅  host.html connected to backend API successfully!');
