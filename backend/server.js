const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// SQLite DB setup
const dbPath = path.join(__dirname, 'solemar.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) return console.error('DB connection error:', err.message);
  console.log('Connected to SQLite database.');
});

// Create comprehensive database tables
const createTables = () => {
  // Users table (for admin access)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Rooms table
  db.run(`CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    price_per_night INTEGER NOT NULL,
    max_guests INTEGER NOT NULL,
    room_size REAL,
    view_type TEXT,
    amenities TEXT,
    images TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Bookings table (enhanced)
  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT,
    room_id INTEGER,
    room_type TEXT,
    guests INTEGER NOT NULL,
    checkin_date TEXT NOT NULL,
    checkout_date TEXT NOT NULL,
    total_price INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'pending',
    special_requests TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(room_id) REFERENCES rooms(id)
  )`);

  // Payments table
  db.run(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'EUR',
    payment_method TEXT,
    transaction_id TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(booking_id) REFERENCES bookings(id)
  )`);

  // Availability table (for real-time availability)
  db.run(`CREATE TABLE IF NOT EXISTS availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER,
    date TEXT NOT NULL,
    is_available BOOLEAN DEFAULT 1,
    price_modifier REAL DEFAULT 1.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(room_id) REFERENCES rooms(id),
    UNIQUE(room_id, date)
  )`);

  // Pricing table (for dynamic pricing)
  db.run(`CREATE TABLE IF NOT EXISTS pricing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER,
    season TEXT,
    start_date TEXT,
    end_date TEXT,
    price_multiplier REAL DEFAULT 1.0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(room_id) REFERENCES rooms(id)
  )`);

  // Reviews table (enhanced)
  db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER,
    guest_name TEXT,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    is_verified BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(booking_id) REFERENCES bookings(id)
  )`);

  // FAQ table (enhanced)
  db.run(`CREATE TABLE IF NOT EXISTS faq (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Settings table (for dynamic configuration)
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
};

// Initialize database tables
createTables();

// Seed initial data
const seedData = () => {
  // Check if rooms exist
  db.get("SELECT COUNT(*) as count FROM rooms", [], (err, row) => {
    if (err) return console.error('Seed check error:', err.message);

    if (row.count === 0) {
      console.log('Seeding initial room data...');

      const rooms = [
        {
          name: 'Double Room',
          type: 'double',
          description: 'A bright and cozy double room with premium bedding, modern amenities, and stunning sea views. Perfect for couples seeking intimate coastal luxury.',
          price_per_night: 85,
          max_guests: 2,
          room_size: 25.0,
          view_type: 'City View',
          amenities: 'WiFi, Air Conditioning, Smart TV, Mini Kitchen, Modern Bathroom',
          images: 'Photos/0b347638-be58-406b-a928-21de9d120201.avif'
        },
        {
          name: 'Deluxe Room',
          type: 'deluxe',
          description: 'Elevate your stay in our spacious Deluxe Room featuring a private balcony, premium jacuzzi bathroom, and enhanced amenities for the discerning traveler.',
          price_per_night: 120,
          max_guests: 3,
          room_size: 35.0,
          view_type: 'Partial Sea View',
          amenities: 'Premium WiFi, Climate Control, 55" Smart TV, Espresso Machine, Private Balcony, Jacuzzi Bathroom',
          images: 'Photos/2aad760c-7615-4bd8-9d29-1aba1c02ef5f.avif'
        },
        {
          name: 'Premium Suite',
          type: 'premium',
          description: 'Indulge in luxury with our Premium Suite offering separate living and sleeping areas, panoramic sea views, and a fully equipped kitchen for extended stays.',
          price_per_night: 180,
          max_guests: 4,
          room_size: 55.0,
          view_type: 'Full Sea View',
          amenities: 'High-Speed WiFi, Smart Climate, Dual 65" TVs, Full Kitchen, Spa Bathroom, Sea View Terrace, Mini Bar',
          images: 'Photos/465ae144-9a7c-4d3e-867c-f7b27e0eb6d7.avif'
        },
        {
          name: 'Executive Suite',
          type: 'executive',
          description: 'Experience ultimate luxury in our Executive Suite with master bedroom, private lounge, expansive terrace, and personalized butler service for the most discerning guests.',
          price_per_night: 250,
          max_guests: 4,
          room_size: 75.0,
          view_type: 'Panoramic Sea View',
          amenities: 'Ultra-Fast WiFi, Smart Home System, 85" OLED TV, Gourmet Kitchen, Master Spa Bathroom, 40m² Private Terrace, Premium Bar, Personal Butler',
          images: 'Photos/683675e4-d8de-43c0-a5e0-ba2122da891e.avif'
        }
      ];

      rooms.forEach(room => {
        db.run(`INSERT INTO rooms (name, type, description, price_per_night, max_guests, room_size, view_type, amenities, images)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [room.name, room.type, room.description, room.price_per_night, room.max_guests, room.room_size, room.view_type, room.amenities, room.images]);
      });

      console.log('Room data seeded successfully');
    }
  });

  // Seed FAQ data
  db.get("SELECT COUNT(*) as count FROM faq", [], (err, row) => {
    if (err) return console.error('FAQ seed check error:', err.message);

    if (row.count === 0) {
      const faqs = [
        { category: 'booking', question: 'What are check-in and check-out times?', answer: 'Check-in is available from 3:00 PM, and check-out is by 11:00 AM. Flexible timing can be arranged for early arrivals or late departures.' },
        { category: 'booking', question: 'What\'s the minimum stay requirement?', answer: 'Our minimum stay is 2 nights during low season and 3 nights during peak season (June-August).' },
        { category: 'payment', question: 'When is payment due?', answer: '30% deposit is due immediately to secure your booking. The remaining balance is due 30 days before arrival.' },
        { category: 'payment', question: 'What payment methods do you accept?', answer: 'We accept Visa, Mastercard, American Express, PayPal, and bank transfers.' },
        { category: 'policies', question: 'What\'s your cancellation policy?', answer: 'Free cancellation up to 60 days before arrival. 50% refund 30-59 days prior, 25% refund 14-29 days prior.' }
      ];

      faqs.forEach((faq, index) => {
        db.run(`INSERT INTO faq (category, question, answer, sort_order) VALUES (?, ?, ?, ?)`,
          [faq.category, faq.question, faq.answer, index]);
      });

      console.log('FAQ data seeded successfully');
    }
  });

  // Create admin user
  db.get("SELECT COUNT(*) as count FROM users WHERE role = 'admin'", [], (err, row) => {
    if (err) return console.error('Admin user check error:', err.message);

    if (row.count === 0) {
      // Hash password (in production, use proper hashing)
      const adminPassword = 'admin123'; // Change this in production!
      db.run(`INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)`,
        ['admin', adminPassword, 'admin@solemar.com', 'admin']);
      console.log('Admin user created: admin/admin123');
    }
  });
};

// Seed initial data
seedData();

// ===== ROOMS API =====
app.get('/api/rooms', (req, res) => {
  const { type } = req.query;
  let query = 'SELECT * FROM rooms WHERE is_active = 1';
  let params = [];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  query += ' ORDER BY price_per_night ASC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/rooms/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM rooms WHERE id = ? AND is_active = 1', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Room not found' });
    res.json(row);
  });
});

// ===== BOOKINGS API =====
app.get('/api/bookings', (req, res) => {
  const { status, room_type, start_date, end_date } = req.query;
  let query = 'SELECT * FROM bookings WHERE 1=1';
  let params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (room_type) {
    query += ' AND room_type = ?';
    params.push(room_type);
  }
  if (start_date) {
    query += ' AND checkin_date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND checkout_date <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/bookings', (req, res) => {
  const {
    guest_name,
    guest_email,
    guest_phone,
    room_id,
    room_type,
    guests,
    checkin_date,
    checkout_date,
    total_price,
    special_requests
  } = req.body;

  // Validate required fields
  if (!guest_name || !guest_email || !room_type || !guests || !checkin_date || !checkout_date || !total_price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check room availability
  const checkAvailability = (callback) => {
    if (!room_id) return callback(true); // Skip availability check for room_id-less bookings

    const dates = [];
    const start = new Date(checkin_date);
    const end = new Date(checkout_date);
    const current = new Date(start);

    while (current < end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    // Check if any date is unavailable
    const placeholders = dates.map(() => '?').join(',');
    db.all(`SELECT * FROM availability WHERE room_id = ? AND date IN (${placeholders}) AND is_available = 0`,
      [room_id, ...dates], (err, rows) => {
        if (err) return callback(false);
        callback(rows.length === 0);
      });
  };

  checkAvailability((isAvailable) => {
    if (!isAvailable) {
      return res.status(400).json({ error: 'Room not available for selected dates' });
    }

    // Create booking
    const sql = `INSERT INTO bookings
      (guest_name, guest_email, guest_phone, room_id, room_type, guests, checkin_date, checkout_date, total_price, special_requests)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(sql, [guest_name, guest_email, guest_phone, room_id, room_type, guests, checkin_date, checkout_date, total_price, special_requests], function(err) {
      if (err) return res.status(500).json({ error: err.message });

      res.status(201).json({
        id: this.lastID,
        message: 'Booking created successfully',
        booking: {
          id: this.lastID,
          guest_name,
          guest_email,
          room_type,
          guests,
          checkin_date,
          checkout_date,
          total_price,
          status: 'pending'
        }
      });
    });
  });
});

app.put('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const { status, payment_status } = req.body;

  let sql = 'UPDATE bookings SET updated_at = CURRENT_TIMESTAMP';
  let params = [];

  if (status) {
    sql += ', status = ?';
    params.push(status);
  }
  if (payment_status) {
    sql += ', payment_status = ?';
    params.push(payment_status);
  }

  sql += ' WHERE id = ?';
  params.push(id);

  db.run(sql, params, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Booking not found' });

    res.json({ message: 'Booking updated successfully' });
  });
});

app.delete('/api/bookings/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM bookings WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Booking not found' });

    res.json({ message: 'Booking deleted successfully' });
  });
});

// ===== AVAILABILITY API =====
app.get('/api/availability', (req, res) => {
  const { room_id, start_date, end_date } = req.query;

  let query = 'SELECT * FROM availability WHERE 1=1';
  let params = [];

  if (room_id) {
    query += ' AND room_id = ?';
    params.push(room_id);
  }
  if (start_date) {
    query += ' AND date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND date <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY date ASC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/availability/check', (req, res) => {
  const { room_id, checkin_date, checkout_date } = req.body;

  if (!room_id || !checkin_date || !checkout_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Generate date range
  const dates = [];
  const start = new Date(checkin_date);
  const end = new Date(checkout_date);
  const current = new Date(start);

  while (current < end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }

  // Check availability for each date
  const placeholders = dates.map(() => '?').join(',');
  db.all(`SELECT date, is_available FROM availability WHERE room_id = ? AND date IN (${placeholders})`,
    [room_id, ...dates], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      // If no records found, assume available (default is available)
      const unavailableDates = rows.filter(row => !row.is_available).map(row => row.date);

      res.json({
        available: unavailableDates.length === 0,
        unavailable_dates: unavailableDates,
        checked_dates: dates
      });
    });
});

// ===== PAYMENTS API =====
app.post('/api/payments', (req, res) => {
  const { booking_id, amount, payment_method, transaction_id } = req.body;

  if (!booking_id || !amount || !payment_method) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sql = `INSERT INTO payments (booking_id, amount, payment_method, transaction_id, status)
               VALUES (?, ?, ?, ?, 'completed')`;

  db.run(sql, [booking_id, amount, payment_method, transaction_id || 'manual'], function(err) {
    if (err) return res.status(500).json({ error: err.message });

    // Update booking payment status
    db.run('UPDATE bookings SET payment_status = ? WHERE id = ?',
      ['completed', booking_id]);

    res.status(201).json({
      id: this.lastID,
      message: 'Payment recorded successfully'
    });
  });
});

// ===== REVIEWS API =====
app.get('/api/reviews', (req, res) => {
  const { verified_only = false } = req.query;

  let query = 'SELECT * FROM reviews';
  let params = [];

  if (verified_only === 'true') {
    query += ' WHERE is_verified = 1';
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/reviews', (req, res) => {
  const { booking_id, guest_name, rating, comment } = req.body;

  if (!guest_name || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Invalid review data' });
  }

  const sql = `INSERT INTO reviews (booking_id, guest_name, rating, comment, is_verified)
               VALUES (?, ?, ?, ?, ?)`;

  // Auto-verify reviews for now (in production, add moderation)
  const isVerified = 1;

  db.run(sql, [booking_id, guest_name, rating, comment, isVerified], function(err) {
    if (err) return res.status(500).json({ error: err.message });

    res.status(201).json({
      id: this.lastID,
      message: 'Review submitted successfully'
    });
  });
});

// ===== FAQ API =====
app.get('/api/faq', (req, res) => {
  const { category } = req.query;

  let query = 'SELECT * FROM faq WHERE is_active = 1';
  let params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY sort_order ASC, created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ===== AUTHENTICATION API =====
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  db.get('SELECT id, username, email, role FROM users WHERE username = ? AND password = ?',
    [username, password], (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      // In production, generate JWT token here
      res.json({
        user,
        message: 'Login successful'
      });
    });
});

// ===== DASHBOARD API (Admin) =====
app.get('/api/dashboard/stats', (req, res) => {
  const stats = {};

  // Get total bookings
  db.get('SELECT COUNT(*) as total FROM bookings', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.total_bookings = row.total;

    // Get total revenue
    db.get('SELECT SUM(total_price) as revenue FROM bookings WHERE payment_status = "completed"', [], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      stats.total_revenue = row.revenue || 0;

      // Get pending bookings
      db.get('SELECT COUNT(*) as pending FROM bookings WHERE status = "pending"', [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.pending_bookings = row.pending;

        // Get average rating
        db.get('SELECT AVG(rating) as avg_rating FROM reviews WHERE is_verified = 1', [], (err, row) => {
          if (err) return res.status(500).json({ error: err.message });
          stats.average_rating = Math.round((row.avg_rating || 0) * 10) / 10;

          res.json(stats);
        });
      });
    });
  });
});

// ===== UTILITY ENDPOINTS =====
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`SoleMar backend running on http://localhost:${PORT}`);
});
