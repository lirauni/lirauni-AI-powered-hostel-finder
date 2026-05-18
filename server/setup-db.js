// Run this once to create the database and tables:
// node server/setup-db.js

require('dotenv').config({ path: __dirname + '/.env' });
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

async function setup() {
    console.log('🔧 Setting up LiraUniHostel database...\n');

    const conn = await mysql.createConnection({
        host:     process.env.DB_HOST,
        port:     process.env.DB_PORT,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        multipleStatements: true
    });

    const sql = fs.readFileSync(path.join(__dirname, 'setup.sql'), 'utf8');

    try {
        await conn.query(sql);
        console.log('✅  Database and tables created successfully!');
        console.log('✅  Seed data inserted (hostels + reviews).');
        console.log('\n🚀  Now run: cd server && npm install && npm start\n');
    } catch (err) {
        console.error('❌  Setup failed:', err.message);
    } finally {
        await conn.end();
    }
}

setup();
