require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const xssClean   = require('xss-clean');
const hpp        = require('hpp');
const path       = require('path');

const app = express();

// ══════════════════════════════════════════════════════════════
//  SECURITY MIDDLEWARE
// ══════════════════════════════════════════════════════════════

// 1. Helmet — sets 14 secure HTTP headers
//    Prevents: clickjacking, MIME sniffing, XSS via headers,
//    information leakage, and more.
app.use(helmet({
    contentSecurityPolicy: false, // disabled so Tailwind CDN & external scripts load
    crossOriginEmbedderPolicy: false
}));

// 2. CORS — restrict to your own origin in production
//    In development we allow localhost:5000 and file:// (direct open)
const allowedOrigins = [
    'http://localhost:5000',
    'http://127.0.0.1:5000'
];
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// 3. Body parsers — limit payload size to prevent large body attacks
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. XSS Clean — sanitizes req.body, req.query, req.params
//    Strips malicious HTML/JS from user inputs
app.use(xssClean());

// 5. HPP — HTTP Parameter Pollution protection
//    Prevents duplicate query params like ?role=admin&role=student
app.use(hpp());

// 6. Global rate limiter — max 100 requests per 15 min per IP
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again in 15 minutes.' }
});
app.use('/api/', globalLimiter);

// 7. Auth rate limiter — stricter: max 10 login/register attempts per 15 min
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please wait 15 minutes before trying again.' }
});
app.use('/api/auth/', authLimiter);

// ══════════════════════════════════════════════════════════════
//  SERVE STATIC FRONTEND
// ══════════════════════════════════════════════════════════════
app.use(express.static(path.join(__dirname, '..')));

// ══════════════════════════════════════════════════════════════
//  API ROUTES
// ══════════════════════════════════════════════════════════════
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/reviews',  require('./routes/reviews'));
app.use('/api/hostels',  require('./routes/hostels'));
app.use('/api/users',    require('./routes/users'));

// ── HEALTH CHECK ────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'LiraUniHostel API is running' });
});

// ══════════════════════════════════════════════════════════════
//  GLOBAL ERROR HANDLER
//  Catches any unhandled errors and returns a clean JSON response
//  instead of leaking stack traces to the client
// ══════════════════════════════════════════════════════════════
app.use((err, req, res, next) => {
    // CORS error
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ error: 'CORS: Origin not allowed.' });
    }
    console.error('Unhandled error:', err.message);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Something went wrong. Please try again.'
            : err.message
    });
});

// ── 404 FALLBACK ────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found.' });
});

// ══════════════════════════════════════════════════════════════
//  START SERVER
// ══════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('\n🔒  Security layers active:');
    console.log('    ✅  Helmet (secure HTTP headers)');
    console.log('    ✅  CORS (restricted origins)');
    console.log('    ✅  XSS Clean (input sanitization)');
    console.log('    ✅  HPP (HTTP parameter pollution protection)');
    console.log('    ✅  Rate limiting (100 req/15min global, 10 req/15min auth)');
    console.log('    ✅  Body size limit (10kb)');
    console.log('    ✅  bcrypt password hashing (in auth routes)');
    console.log('    ✅  JWT authentication (in protected routes)');
    console.log(`\n✅  LiraUniHostel server running at http://localhost:${PORT}`);
    console.log(`📋  API base: http://localhost:${PORT}/api`);
    console.log(`🌐  Frontend: http://localhost:${PORT}/host.html\n`);
});
