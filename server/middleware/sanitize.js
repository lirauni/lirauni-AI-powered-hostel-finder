// Input sanitization middleware
// Trims strings and lowercases emails before they reach route handlers

function sanitizeAuth(req, res, next) {
    if (req.body.email)    req.body.email    = req.body.email.trim().toLowerCase();
    if (req.body.name)     req.body.name     = req.body.name.trim();
    if (req.body.phone)    req.body.phone    = req.body.phone.trim();
    if (req.body.password) req.body.password = req.body.password; // never trim passwords
    next();
}

function sanitizeBooking(req, res, next) {
    const fields = ['student_name','regno','email','phone','gender','year','room_type','hostel_name'];
    fields.forEach(f => { if (req.body[f]) req.body[f] = String(req.body[f]).trim(); });
    if (req.body.email) req.body.email = req.body.email.toLowerCase();
    next();
}

function sanitizeMessage(req, res, next) {
    const fields = ['name','email','subject','message','reply'];
    fields.forEach(f => { if (req.body[f]) req.body[f] = String(req.body[f]).trim(); });
    if (req.body.email) req.body.email = req.body.email.toLowerCase();
    next();
}

module.exports = { sanitizeAuth, sanitizeBooking, sanitizeMessage };
