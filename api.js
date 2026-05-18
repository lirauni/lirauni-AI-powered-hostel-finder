// ══════════════════════════════════════════════════════════════
//  LiraUniHostel — API Client
//  All communication with the backend goes through this file.
//  Backend: http://localhost:5000/api
// ══════════════════════════════════════════════════════════════

const API = 'http://localhost:5000/api';

// ── TOKEN HELPERS ──────────────────────────────────────────────
function getToken()        { return localStorage.getItem('liraToken'); }
function setToken(t)       { localStorage.setItem('liraToken', t); }
function clearToken()      { localStorage.removeItem('liraToken'); }

function authHeaders() {
    const t = getToken();
    return t ? { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + t }
             : { 'Content-Type': 'application/json' };
}

async function apiFetch(path, options = {}) {
    const res = await fetch(API + path, {
        headers: authHeaders(),
        ...options
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

// ══════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════
async function apiRegister(name, email, phone, password, role) {
    const data = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, password, role })
    });
    setToken(data.token);
    return data.user;
}

async function apiLogin(email, password) {
    const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    setToken(data.token);
    return data.user;
}

function apiLogout() { clearToken(); }

// ══════════════════════════════════════════════════════════════
//  BOOKINGS
// ══════════════════════════════════════════════════════════════
async function apiGetBookings()    { return apiFetch('/bookings'); }

async function apiCreateBooking(b) {
    return apiFetch('/bookings', {
        method: 'POST',
        body: JSON.stringify(b)
    });
}

async function apiUpdateBookingStatus(id, status) {
    return apiFetch('/bookings/' + id + '/status', {
        method: 'PATCH',
        body: JSON.stringify({ status })
    });
}

async function apiEditBooking(id, b) {
    return apiFetch('/bookings/' + id, {
        method: 'PUT',
        body: JSON.stringify(b)
    });
}

async function apiDeleteBooking(id) {
    return apiFetch('/bookings/' + id, { method: 'DELETE' });
}

// ══════════════════════════════════════════════════════════════
//  MESSAGES
// ══════════════════════════════════════════════════════════════
async function apiSendMessage(name, email, subject, message) {
    return apiFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({ name, email, subject, message })
    });
}

async function apiGetMessages()    { return apiFetch('/messages'); }

async function apiGetMyMessages()  { return apiFetch('/messages/mine'); }

async function apiMarkMessageRead(id) {
    return apiFetch('/messages/' + id + '/read', { method: 'PATCH', body: '{}' });
}

async function apiMarkStudentRead(id) {
    return apiFetch('/messages/' + id + '/student-read', { method: 'PATCH', body: '{}' });
}

async function apiReplyMessage(id, reply) {
    return apiFetch('/messages/' + id + '/reply', {
        method: 'PATCH',
        body: JSON.stringify({ reply })
    });
}

async function apiDeleteMessage(id) {
    return apiFetch('/messages/' + id, { method: 'DELETE' });
}

async function apiClearMessages()  { return apiFetch('/messages', { method: 'DELETE' }); }

// ══════════════════════════════════════════════════════════════
//  REVIEWS
// ══════════════════════════════════════════════════════════════
async function apiGetReviews()     { return apiFetch('/reviews'); }

async function apiApproveReview(id) {
    return apiFetch('/reviews/' + id + '/approve', { method: 'PATCH', body: '{}' });
}

async function apiDeleteReview(id) {
    return apiFetch('/reviews/' + id, { method: 'DELETE' });
}

// ══════════════════════════════════════════════════════════════
//  USERS
// ══════════════════════════════════════════════════════════════
async function apiGetUsers()       { return apiFetch('/users'); }

async function apiDeleteUser(id)   {
    return apiFetch('/users/' + id, { method: 'DELETE' });
}

// ══════════════════════════════════════════════════════════════
//  HOSTELS
// ══════════════════════════════════════════════════════════════
async function apiGetHostels()     { return apiFetch('/hostels'); }

async function apiAddHostel(h) {
    return apiFetch('/hostels', {
        method: 'POST',
        body: JSON.stringify(h)
    });
}
