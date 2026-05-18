-- ══════════════════════════════════════════════════════
--  LiraUni Hostel System — Database Setup
--  Run this once in MySQL Workbench or MySQL CLI:
--  mysql -u root < setup.sql
-- ══════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS liraunihostel;
USE liraunihostel;

-- ── USERS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,
    phone      VARCHAR(20),
    password   VARCHAR(255) NOT NULL,
    role       ENUM('student','admin','hostel-owner') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── HOSTELS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hostels (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(150) NOT NULL,
    distance     DECIMAL(4,1) NOT NULL,
    price_from   INT NOT NULL,
    price_to     INT,
    room_type    ENUM('single','self-contained','double') DEFAULT 'single',
    facilities   VARCHAR(255),
    availability ENUM('Available','Few Rooms Left','Full') DEFAULT 'Available',
    rating       DECIMAL(2,1) DEFAULT 0.0,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── BOOKINGS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL,
    regno       VARCHAR(50)  NOT NULL,
    email       VARCHAR(150) NOT NULL,
    phone       VARCHAR(20)  NOT NULL,
    gender      ENUM('Male','Female') NOT NULL,
    year        VARCHAR(20)  NOT NULL,
    room_type   VARCHAR(100) NOT NULL,
    hostel_name VARCHAR(150) NOT NULL,
    book_date   DATE         NOT NULL,
    status      ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── MESSAGES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    email        VARCHAR(150) NOT NULL,
    subject      VARCHAR(200) NOT NULL,
    message      TEXT         NOT NULL,
    reply        TEXT,
    reply_date   VARCHAR(50),
    is_read      TINYINT(1)   DEFAULT 0,
    student_read TINYINT(1)   DEFAULT 0,
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ── REVIEWS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    reviewer    VARCHAR(100) NOT NULL,
    hostel_name VARCHAR(150) NOT NULL,
    rating      TINYINT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT         NOT NULL,
    status      ENUM('pending','approved') DEFAULT 'pending',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── SEED HOSTELS ───────────────────────────────────────
INSERT IGNORE INTO hostels (id, name, distance, price_from, price_to, room_type, facilities, availability, rating) VALUES
(1, 'Northern Elite Hostel', 0.8, 500000, 700000, 'single',         'wifi,security,water,cctv,solar', 'Available',      4.0),
(2, 'St Peters Hostel',      1.2, 550000, 550000, 'single',         'wifi,security,electricity',      'Few Rooms Left', 3.5),
(3, 'Millennium Hostel',     0.5, 550000, 550000, 'self-contained', 'wifi,security,water,electricity','Available',      4.8),
(4, 'Girama Hostel',         0.8, 200000, 200000, 'single',         'wifi,security,electricity',      'Available',      3.2),
(5, 'Vallen Hostel',         1.0, 850000, 850000, 'self-contained', 'wifi,water',                     'Available',      4.0);

-- ── SEED REVIEWS ───────────────────────────────────────
INSERT IGNORE INTO reviews (id, reviewer, hostel_name, rating, comment, status) VALUES
(1, 'Reagean Adem',   'Northern Elite Hostel', 4, 'Great facilities and very close to campus. Highly recommended!',                       'approved'),
(2, 'Robert Okwanga', 'Northern Elite Hostel', 5, 'Stayed here for three years. Management is responsive and security is excellent.', 'approved'),
(3, 'Okuno Joshua',   'Girama Hostel',         4, 'Great facilities and very close to campus and Trading Center. Highly recommended!', 'approved');
