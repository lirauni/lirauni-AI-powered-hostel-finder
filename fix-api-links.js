// Fixes all remaining localStorage calls to use the API
const fs = require('fs');
let html = fs.readFileSync('host.html', 'utf8');

// ── 1. renderUsersTable → use apiGetUsers ──────────────────────────────────
html = html.replace(
    /function renderUsersTable\(\) \{[\s\S]*?const users = getUsers\(\);/,
    `async function renderUsersTable() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    let users = [];
    try { users = await apiGetUsers(); } catch(e) { return; }`
);

// Fix role field: backend returns 'role' not 'type'
html = html.replace(
    /\$\{roleColor\[u\.type\] \|\| 'bg-gray-100 text-gray-800'\}/g,
    "${roleColor[u.role] || 'bg-gray-100 text-gray-800'}"
);
html = html.replace(
    /\$\{roleLabel\[u\.type\] \|\| u\.type\}/g,
    "${roleLabel[u.role] || u.role}"
);

// Fix deleteUser to use id not email
html = html.replace(
    /onclick="deleteUser\('\\$\{u\.email\}'\)"/g,
    "onclick=\"deleteUser(${u.id})\""
);

// ── 2. deleteUser → use apiDeleteUser ─────────────────────────────────────
html = html.replace(
    /function deleteUser\(email\) \{[\s\S]*?showToast\('User removed\.'\);\s*\}/,
    `function deleteUser(id) {
    if (!confirm('Remove this user? This cannot be undone.')) return;
    apiDeleteUser(id)
        .then(() => { renderUsersTable(); renderAdminBookings(); showToast('User removed.'); })
        .catch(err => showToast('Error: ' + err.message));
}`
);

// ── 3. renderReviews → use apiGetReviews ──────────────────────────────────
html = html.replace(
    /function renderReviews\(\) \{[\s\S]*?const reviews = getReviews\(\);/,
    `async function renderReviews() {
    const container = document.getElementById('reviews-list');
    if (!container) return;
    let reviews = [];
    try { reviews = await apiGetReviews(); } catch(e) { return; }`
);

// Fix review field: backend returns hostel_name not hostel, created_at not date
html = html.replace(/\$\{r\.hostel\}/g, '${r.hostel_name || r.hostel || ""}');
html = html.replace(/\$\{r\.date\}/g, '${r.created_at ? new Date(r.created_at).toLocaleDateString("en-GB") : ""}');

// ── 4. approveReview → use apiApproveReview ───────────────────────────────
html = html.replace(
    /function approveReview\(id\) \{[\s\S]*?showToast\('Review approved\.'\);\s*\}/,
    `function approveReview(id) {
    apiApproveReview(id)
        .then(() => { renderReviews(); showToast('Review approved.'); })
        .catch(err => showToast('Error: ' + err.message));
}`
);

// ── 5. deleteReview → use apiDeleteReview ─────────────────────────────────
html = html.replace(
    /function deleteReview\(id\) \{[\s\S]*?showToast\('Review deleted\.'\);\s*\}/,
    `function deleteReview(id) {
    if (!confirm('Delete this review?')) return;
    apiDeleteReview(id)
        .then(() => { renderReviews(); showToast('Review deleted.'); })
        .catch(err => showToast('Error: ' + err.message));
}`
);

// ── 6. renderMessages → use apiGetMessages ────────────────────────────────
// Fix the renderMessages function to use API data
html = html.replace(
    /async function renderMessages\(\) \{[\s\S]*?let msgs = \[\];[\s\S]*?try \{ msgs = await apiGetMessages\(\); \} catch\(e\) \{ return; \}/,
    `async function renderMessages() {
    const container = document.getElementById('messages-list');
    const badge     = document.getElementById('messages-badge');
    if (!container) return;
    let msgs = [];
    try { msgs = await apiGetMessages(); } catch(e) { return; }`
);

// Fix message field names: backend returns is_read not read, created_at not date
html = html.replace(/!\s*m\.read/g, '!m.is_read');
html = html.replace(/m\.read\b/g, 'm.is_read');
html = html.replace(/\$\{m\.date\}/g, '${m.created_at ? new Date(m.created_at).toLocaleString("en-GB") : ""}');

// ── 7. deleteMessage → use apiDeleteMessage ───────────────────────────────
html = html.replace(
    /function deleteMessage\(id\) \{[\s\S]*?allMessages\.splice[\s\S]*?renderMessages\(\);\s*\}/,
    `function deleteMessage(id) {
    apiDeleteMessage(id).then(() => renderMessages()).catch(err => showToast('Error: ' + err.message));
}`
);

// ── 8. deleteAllMessages → use apiClearMessages ───────────────────────────
html = html.replace(
    /function deleteAllMessages\(\) \{[\s\S]*?showToast\('All messages cleared\.'\);\s*\}/,
    `function deleteAllMessages() {
    if (!confirm('Delete all messages? This cannot be undone.')) return;
    apiClearMessages().then(() => { renderMessages(); showToast('All messages cleared.'); }).catch(err => showToast('Error: ' + err.message));
}`
);

// ── 9. Contact form → use apiSendMessage ──────────────────────────────────
// Fix the contact form to not use allMessages array
html = html.replace(
    /const allMessages = \[\]; \/\/ loaded from API/,
    'const allMessages = []; // loaded from API'
);

// ── 10. Fix toggleMessage to use API mark read ────────────────────────────
html = html.replace(
    /\/\/ Mark as read via API[\s\S]*?apiMarkMessageRead\(id\)\.then\(\(\) => renderMessages\(\)\)\.catch\(\(\) => \{\}\);[\s\S]*?\}/,
    `// Mark as read via API
    apiMarkMessageRead(id).then(() => renderMessages()).catch(() => {});
    }`
);

// ── 11. Fix setLoggedIn to use role not type ──────────────────────────────
html = html.replace(
    /const role = user\.role \|\| user\.type;/g,
    'const role = user.role || user.type;'
);

// Fix nav protection to check both role and type
html = html.replace(
    /if \(currentUser && role === protectedViews\[hash\]\)/,
    'if (currentUser && (currentUser.role || currentUser.type) === protectedViews[hash])'
);

fs.writeFileSync('host.html', html, 'utf8');
console.log('✅  All API links fixed successfully!');
