const fs = require('fs');
let html = fs.readFileSync('host.html', 'utf8');

// ── Replace login form handler ─────────────────────────────────────────────
const loginRegex = /document\.getElementById\('login-form'\)\.addEventListener\('submit',[\s\S]*?\}\);(\s*\/\/.*REGISTER)/;
html = html.replace(loginRegex, `document.getElementById('login-form').addEventListener('submit', async function (e) {
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

// ── Replace register form handler ──────────────────────────────────────────
const regRegex = /document\.getElementById\('register-form'\)\.addEventListener\('submit',[\s\S]*?\}\);(\s*\/\/.*SLIDERS)/;
html = html.replace(regRegex, `document.getElementById('register-form').addEventListener('submit', async function (e) {
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

// ── Fix restoreSession to check both token and user ────────────────────────
html = html.replace(
    /const saved = localStorage\.getItem\('liraHostelUser'\);\s*const token = localStorage\.getItem\('liraToken'\);\s*if \(saved && token\)/,
    `const saved = localStorage.getItem('liraHostelUser');
    const token = localStorage.getItem('liraToken');
    if (saved)`
);

fs.writeFileSync('host.html', html, 'utf8');
console.log('✅  Login/Register handlers fixed to use API!');
