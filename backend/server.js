const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Allow CORS from frontend (local development and production)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://mite-payment-portal.onrender.com', // Add your Render URL directly
  process.env.FRONTEND_URL, // Production frontend URL from Render
].filter(Boolean); // Remove undefined values

// Updated CORS config for Render deployment


app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
// Increase limit to handle image uploads (base64 encoded screenshots can be large)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB Connection
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;
let isConnected = false;

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    db = client.db("campus_events"); // Your database name
    isConnected = true;
    console.log("✅ Connected to MongoDB!");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    isConnected = false;
  }
}

// Call connect immediately
connectDB();

// Middleware to check DB connection
const checkDBConnection = (req, res, next) => {
  if (!isConnected || !db) {
    return res.status(503).json({ 
      error: 'Database not connected. Please try again in a moment.' 
    });
  }
  next();
};

// Apply DB check to all routes
app.use('/api', checkDBConnection);

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// ============= AUTH ROUTES =============

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { usn, email, password, name, role } = req.body;

    console.log('📝 Registration attempt:', { usn, email, name, role });

    // Validate inputs
    if (!usn || !email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Force role to be 'student' - no admin registration allowed
    if (role && role !== 'student') {
      return res.status(403).json({ error: 'Only student registration is allowed' });
    }

    // Check if user exists (by USN or email)
    const existingUser = await db.collection('users').findOne({ 
      $or: [
        { usn: { $regex: new RegExp(`^${usn}$`, 'i') } },
        { email: email.toLowerCase() }
      ]
    });

    if (existingUser) {
      console.log('❌ User already exists:', existingUser.usn);
      return res.status(400).json({ error: 'User with this USN or email already exists' });
    }

    // Create user with payment structure
    const user = {
      usn: usn.trim(),
      email: email.toLowerCase().trim(),
      password: password.trim(),
      name: name.trim(),
      role: role || 'student',
      payments: {                    // ← ADD THIS STRUCTURE
        mandatory: [],
        optional: []
      },
      createdAt: new Date()
    };

    console.log('💾 Saving user to DB:', { ...user, password: '***' });

    const result = await db.collection('users').insertOne(user);
    
    console.log('✅ User saved with ID:', result.insertedId);

    // Create token
    const token = jwt.sign(
      { id: result.insertedId.toString(), usn: user.usn, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const responseData = {
      token,
      user: {
        id: result.insertedId.toString(),
        usn: user.usn,
        email: user.email,
        name: user.name,
        role: user.role,
        payments: user.payments    // ← INCLUDE IN RESPONSE
      }
    };

    console.log('✅ Sending response:', { ...responseData, token: 'JWT_TOKEN...' });

    res.json(responseData);
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
});

// Login - Updated for USN-based authentication
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const usn = email;

    // Find user by USN (case-insensitive)
    const user = await db.collection('users').findOne({ 
      usn: { $regex: new RegExp(`^${usn}$`, 'i') } 
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid USN or password' });
    }

    // Check role
    if (user.role !== role) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = user.password === password;

    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid USN or password' });
    }

    // Ensure payments structure exists (for old users)
    if (!user.payments) {
      user.payments = {
        mandatory: [],
        optional: []
      };
    }

    // Create token
    const token = jwt.sign(
      { id: user._id.toString(), usn: user.usn, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id.toString(),
        usn: user.usn,
        name: user.name,
        role: user.role,
        email: user.email,
        payments: user.payments    // ← INCLUDE PAYMENTS
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
});
// ============= EVENTS ROUTES =============

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    const events = await db.collection('events').find({}).toArray();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single event
app.get('/api/events/:id', async (req, res) => {
  try {
    const event = await db.collection('events').findOne({ _id: new ObjectId(req.params.id) });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create event (admin only)
app.post('/api/events', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const event = {
      ...req.body,
      createdBy: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('events').insertOne(event);
    res.json({ ...event, _id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update event (admin only)
app.put('/api/events/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { _id, ...updateData } = req.body;
    updateData.updatedAt = new Date();

    const result = await db.collection('events').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete event (admin only)
app.delete('/api/events/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await db.collection('events').deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= REGISTRATIONS ROUTES =============

// Create registration/booking
app.post('/api/registrations', authenticateToken, async (req, res) => {
  try {
    const registration = {
      userId: req.user.id,
      userEmail: req.user.email,
      events: req.body.events,
      totalAmount: req.body.totalAmount,
      paymentMethod: req.body.paymentMethod,
      status: 'confirmed',
      createdAt: new Date()
    };

    const result = await db.collection('registrations').insertOne(registration);
    res.json({ ...registration, _id: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user registrations
app.get('/api/registrations', authenticateToken, async (req, res) => {
  try {
    const registrations = await db.collection('registrations')
      .find({ userId: req.user.id })
      .toArray();
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all registrations (admin only)
app.get('/api/admin/registrations', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const registrations = await db.collection('registrations').find({}).toArray();
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    dbConnected: isConnected 
  });
});

// ============= USER PAYMENT ROUTES =============

// Update user payments
app.put('/api/user/payments', authenticateToken, async (req, res) => {
  try {
    const { payments } = req.body;

    if (!payments || !payments.mandatory || !payments.optional) {
      return res.status(400).json({ error: 'Invalid payment data' });
    }

    // Ensure all new payments have status 'pending' if not already set
    const processedPayments = {
      mandatory: payments.mandatory.map(p => ({
        ...p,
        status: p.status || (p.paid ? 'pending' : undefined) // Set pending if paid but no status
      })),
      optional: payments.optional.map(p => ({
        ...p,
        status: p.status || (p.paid ? 'pending' : undefined) // Set pending if paid but no status
      }))
    };

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(req.user.id) },
      { 
        $set: { 
          payments: processedPayments,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'Payments updated successfully',
      payments: processedPayments
    });
  } catch (error) {
    console.error('Update payments error:', error);
    res.status(500).json({ error: 'Failed to update payments: ' + error.message });
  }
});

// Get user payments
app.get('/api/user/payments', authenticateToken, async (req, res) => {
  try {
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { payments: 1 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      payments: user.payments || { mandatory: [], optional: [] }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to get payments: ' + error.message });
  }
});

// ============= ADMIN PAYMENT ROUTES =============

// Get payment summary (admin only)
app.get('/api/admin/payment-summary', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const allStudents = await db.collection('users').find({ role: 'student' }).toArray();
    const allEvents = await db.collection('events').find({}).toArray();

    let totalStudents = allStudents.length;
    let totalPaymentsReceived = 0;
    let totalAmountReceived = 0;
    let mandatoryPayments = 0;
    let optionalEvents = 0;

    // Count mandatory and optional events
    allEvents.forEach(event => {
      if (event.type === 'mandatory') {
        mandatoryPayments++;
      } else if (event.type === 'optional') {
        optionalEvents++;
      }
    });

    // Calculate payments (only confirmed payments count)
    allStudents.forEach(student => {
      if (student.payments) {
        // Count mandatory payments
        if (student.payments.mandatory) {
          student.payments.mandatory.forEach(payment => {
            if (payment.paid && payment.status === 'confirmed') {
              totalPaymentsReceived++;
              const event = allEvents.find(e => (e._id.toString() === payment.id || e._id.toString() === payment._id));
              if (event) {
                totalAmountReceived += event.amount || 0;
              }
            }
          });
        }
        // Count optional payments
        if (student.payments.optional) {
          student.payments.optional.forEach(payment => {
            if (payment.paid && payment.status === 'confirmed') {
              totalPaymentsReceived++;
              const event = allEvents.find(e => (e._id.toString() === payment.id || e._id.toString() === payment._id));
              if (event) {
                totalAmountReceived += event.amount || 0;
              }
            }
          });
        }
      }
    });

    res.json({
      totalStudents,
      totalPaymentsReceived,
      totalAmountReceived,
      mandatoryPayments,
      optionalEvents
    });
  } catch (error) {
    console.error('Get payment summary error:', error);
    res.status(500).json({ error: 'Failed to get payment summary: ' + error.message });
  }
});

// Get students who paid for a specific event (admin only)
app.get('/api/admin/event-payments/:eventId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { eventId } = req.params;
    const event = await db.collection('events').findOne({ 
      $or: [
        { _id: new ObjectId(eventId) },
        { _id: eventId }
      ]
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const allStudents = await db.collection('users').find({ role: 'student' }).toArray();
    const paidStudents = [];
    const notPaidStudents = [];

    allStudents.forEach(student => {
      let hasPaid = false;
      let paymentRecord = null;

      if (student.payments) {
        if (event.type === 'mandatory' && student.payments.mandatory) {
          paymentRecord = student.payments.mandatory.find(p => 
            (p.id === eventId || p._id === eventId || p.id === event._id.toString() || p._id === event._id.toString()) && p.paid
          );
        } else if (event.type === 'optional' && student.payments.optional) {
          paymentRecord = student.payments.optional.find(p => 
            (p.id === eventId || p._id === eventId || p.id === event._id.toString() || p._id === event._id.toString()) && p.paid
          );
        }

        if (paymentRecord && paymentRecord.paid) {
          hasPaid = true;
        }
      }

      if (hasPaid) {
        paidStudents.push({
          usn: student.usn,
          name: student.name,
          email: student.email,
          utr: paymentRecord?.utr || 'N/A',
          screenshot: paymentRecord?.screenshot || null,
          paidDate: paymentRecord?.paidDate || new Date().toISOString()
        });
      } else {
        notPaidStudents.push({
          usn: student.usn,
          name: student.name,
          email: student.email
        });
      }
    });

    res.json({
      event: {
        id: event._id.toString(),
        title: event.title,
        type: event.type,
        amount: event.amount
      },
      paidStudents,
      notPaidStudents,
      totalPaid: paidStudents.length,
      totalNotPaid: notPaidStudents.length
    });
  } catch (error) {
    console.error('Get event payments error:', error);
    res.status(500).json({ error: 'Failed to get event payments: ' + error.message });
  }
});

// Get all students with their payment status (admin only)
app.get('/api/admin/students-payments', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const allStudents = await db.collection('users').find({ role: 'student' }).toArray();
    const allEvents = await db.collection('events').find({}).toArray();

    const studentsWithPayments = allStudents.map(student => {
      const studentPayments = {
        usn: student.usn,
        name: student.name,
        email: student.email,
        payments: []
      };

      if (student.payments) {
        // Process mandatory payments
        if (student.payments.mandatory) {
          student.payments.mandatory.forEach(payment => {
            const event = allEvents.find(e => 
              e._id.toString() === payment.id || 
              e._id.toString() === payment._id ||
              payment.id === e._id.toString() ||
              payment._id === e._id.toString()
            );
            if (event) {
              studentPayments.payments.push({
                eventId: event._id.toString(),
                eventTitle: event.title,
                eventType: 'mandatory',
                amount: event.amount,
                paid: payment.paid || false,
                utr: payment.utr || null,
                screenshot: payment.screenshot ? 'Yes' : 'No'
              });
            }
          });
        }

        // Process optional payments
        if (student.payments.optional) {
          student.payments.optional.forEach(payment => {
            const event = allEvents.find(e => 
              e._id.toString() === payment.id || 
              e._id.toString() === payment._id ||
              payment.id === e._id.toString() ||
              payment._id === e._id.toString()
            );
            if (event) {
              studentPayments.payments.push({
                eventId: event._id.toString(),
                eventTitle: event.title,
                eventType: 'optional',
                amount: event.amount,
                paid: payment.paid || false,
                utr: payment.utr || null,
                screenshot: payment.screenshot ? 'Yes' : 'No'
              });
            }
          });
        }
      }

      return studentPayments;
    });

    res.json({ students: studentsWithPayments });
  } catch (error) {
    console.error('Get students payments error:', error);
    res.status(500).json({ error: 'Failed to get students payments: ' + error.message });
  }
});

// ============= USER PROFILE ROUTES =============

// Get user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { password: 0 } } // Exclude password
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile: ' + error.message });
  }
});

// Update user profile
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, dob, phone, address, department, year, section } = req.body;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (dob) {
      const ddmmyyyyRegex = /^\d{8}$/;
      if (!ddmmyyyyRegex.test(dob)) {
        return res.status(400).json({ error: 'DOB must be in DDMMYYYY format' });
      }
      updateData.dob = dob;
      // Update password if DOB changed
      if (req.body.password) {
        updateData.password = req.body.password;
      }
    }
    if (phone) updateData.phone = phone.trim();
    if (address) updateData.address = address.trim();
    if (department) updateData.department = department.trim();
    if (year) updateData.year = year.trim();
    if (section) updateData.section = section.trim();

    updateData.updatedAt = new Date();

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(req.user.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get updated user
    const updatedUser = await db.collection('users').findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { password: 0 } }
    );

    res.json({ 
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile: ' + error.message });
  }
});

// Change password
app.put('/api/user/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const ddmmyyyyRegex = /^\d{8}$/;
    if (!ddmmyyyyRegex.test(newPassword)) {
      return res.status(400).json({ error: 'New password must be in DDMMYYYY format' });
    }

    const user = await db.collection('users').findOne({ _id: new ObjectId(req.user.id) });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    if (user.password !== currentPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    await db.collection('users').updateOne(
      { _id: new ObjectId(req.user.id) },
      { 
        $set: { 
          password: newPassword,
          updatedAt: new Date()
        } 
      }
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password: ' + error.message });
  }
});

// ============= ADMIN PAYMENT CONFIRMATION ROUTES =============

// Get all pending payments for admin review (admin only)
app.get('/api/admin/pending-payments', authenticateToken, async (req, res) => {
  console.log('🔍 GET /api/admin/pending-payments - Route hit');
  try {
    // Ensure JSON response
    res.setHeader('Content-Type', 'application/json');
    
    console.log('🔍 User role:', req.user?.role);
    if (req.user.role !== 'admin') {
      console.log('❌ Access denied - not admin');
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    console.log('✅ Admin access granted, fetching data...');

    const allStudents = await db.collection('users').find({ role: 'student' }).toArray();
    const allEvents = await db.collection('events').find({}).toArray();

    console.log(`📊 Found ${allStudents.length} students and ${allEvents.length} events`);
    
    // Create a map of event IDs for faster lookup
    const eventMap = new Map();
    allEvents.forEach(e => {
      const eventIdStr = e._id.toString();
      eventMap.set(eventIdStr, e);
      // Also map by string ID if different
      if (e.id && e.id !== eventIdStr) {
        eventMap.set(e.id.toString(), e);
      }
    });
    console.log(`🗺️  Created event map with ${eventMap.size} entries`);

    // Debug: Log sample student payment structure
    let sampleLogged = false;
    allStudents.forEach(student => {
      if (!sampleLogged && student.payments) {
        console.log('📋 Sample student payments structure:', JSON.stringify({
          mandatory: student.payments.mandatory?.slice(0, 2),
          optional: student.payments.optional?.slice(0, 2)
        }, null, 2));
        sampleLogged = true;
      }
    });

    const pendingPayments = [];
    let totalPaymentsChecked = 0;
    let paidPaymentsFound = 0;
    let pendingPaymentsFound = 0;
    let unmatchedPayments = 0;

    allStudents.forEach((student, studentIndex) => {
      if (student.payments) {
        // Process mandatory payments
        if (student.payments.mandatory && Array.isArray(student.payments.mandatory)) {
          student.payments.mandatory.forEach((payment, paymentIndex) => {
            totalPaymentsChecked++;
            const isPaid = payment.paid === true || payment.paid === 'true';
            const isPending = !payment.status || payment.status === 'pending';
            
            if (isPaid) {
              paidPaymentsFound++;
              if (isPending) {
                pendingPaymentsFound++;
                
                // Try multiple ID matching strategies
                let paymentId = null;
                if (payment._id) {
                  paymentId = payment._id.toString ? payment._id.toString() : String(payment._id);
                } else if (payment.id) {
                  paymentId = payment.id.toString ? payment.id.toString() : String(payment.id);
                }
                
                let event = null;
                if (paymentId) {
                  // Try direct match
                  event = eventMap.get(paymentId);
                  
                  // If not found, try ObjectId conversion
                  if (!event && payment._id) {
                    try {
                      const objId = new ObjectId(payment._id);
                      event = eventMap.get(objId.toString());
                    } catch (e) {
                      // Ignore conversion errors
                    }
                  }
                  
                  // If still not found, try matching against all events
                  if (!event) {
                    event = allEvents.find(e => {
                      const eventIdStr = e._id.toString();
                      return (
                        eventIdStr === paymentId ||
                        (payment._id && eventIdStr === payment._id.toString()) ||
                        (payment.id && eventIdStr === payment.id.toString()) ||
                        (e.id && e.id.toString() === paymentId)
                      );
                    });
                  }
                }
                
                if (event) {
                  // Include all event details in the response
                  pendingPayments.push({
                    studentId: student._id.toString(),
                    studentUSN: student.usn || 'N/A',
                    studentName: student.name || 'N/A',
                    studentEmail: student.email || 'N/A',
                    eventId: event._id.toString(),
                    eventTitle: event.title || 'Untitled Event',
                    eventType: 'mandatory',
                    eventAmount: event.amount || 0,
                    eventDescription: event.description || '',
                    eventTargetClass: event.targetClass || '',
                    eventPayeeName: event.payeeName || '',
                    eventPayeeUpiId: event.payeeUpiId || '',
                    eventQrCode: event.qrCode || null,
                    eventPoster: event.poster || null,
                    paymentId: paymentId || 'unknown',
                    utr: payment.utr || 'N/A',
                    screenshot: payment.screenshot || null,
                    paidDate: payment.paidDate || null,
                    status: payment.status || 'pending',
                    _event: event // Include full event object for debugging
                  });
                  console.log(`✅ Matched mandatory payment: Student ${student.usn || studentIndex}, Event: ${event.title}, Payment ID: ${paymentId}`);
                } else {
                  unmatchedPayments++;
                  console.log(`⚠️  Could not find event for mandatory payment. Student: ${student.usn || studentIndex}, Payment ID: ${paymentId}, Payment:`, JSON.stringify({
                    _id: payment._id,
                    id: payment.id,
                    paid: payment.paid,
                    status: payment.status
                  }, null, 2));
                }
              }
            }
          });
        }

        // Process optional payments
        if (student.payments.optional && Array.isArray(student.payments.optional)) {
          student.payments.optional.forEach((payment, paymentIndex) => {
            totalPaymentsChecked++;
            const isPaid = payment.paid === true || payment.paid === 'true';
            const isPending = !payment.status || payment.status === 'pending';
            
            if (isPaid) {
              paidPaymentsFound++;
              if (isPending) {
                pendingPaymentsFound++;
                
                // Try multiple ID matching strategies
                let paymentId = null;
                if (payment._id) {
                  paymentId = payment._id.toString ? payment._id.toString() : String(payment._id);
                } else if (payment.id) {
                  paymentId = payment.id.toString ? payment.id.toString() : String(payment.id);
                }
                
                let event = null;
                if (paymentId) {
                  // Try direct match
                  event = eventMap.get(paymentId);
                  
                  // If not found, try ObjectId conversion
                  if (!event && payment._id) {
                    try {
                      const objId = new ObjectId(payment._id);
                      event = eventMap.get(objId.toString());
                    } catch (e) {
                      // Ignore conversion errors
                    }
                  }
                  
                  // If still not found, try matching against all events
                  if (!event) {
                    event = allEvents.find(e => {
                      const eventIdStr = e._id.toString();
                      return (
                        eventIdStr === paymentId ||
                        (payment._id && eventIdStr === payment._id.toString()) ||
                        (payment.id && eventIdStr === payment.id.toString()) ||
                        (e.id && e.id.toString() === paymentId)
                      );
                    });
                  }
                }
                
                if (event) {
                  // Include all event details in the response
                  pendingPayments.push({
                    studentId: student._id.toString(),
                    studentUSN: student.usn || 'N/A',
                    studentName: student.name || 'N/A',
                    studentEmail: student.email || 'N/A',
                    eventId: event._id.toString(),
                    eventTitle: event.title || 'Untitled Event',
                    eventType: 'optional',
                    eventAmount: event.amount || 0,
                    eventDescription: event.description || '',
                    eventTargetClass: event.targetClass || '',
                    eventPayeeName: event.payeeName || '',
                    eventPayeeUpiId: event.payeeUpiId || '',
                    eventQrCode: event.qrCode || null,
                    eventPoster: event.poster || null,
                    paymentId: paymentId || 'unknown',
                    utr: payment.utr || 'N/A',
                    screenshot: payment.screenshot || null,
                    paidDate: payment.paidDate || null,
                    status: payment.status || 'pending',
                    _event: event // Include full event object for debugging
                  });
                  console.log(`✅ Matched optional payment: Student ${student.usn || studentIndex}, Event: ${event.title}, Payment ID: ${paymentId}`);
                } else {
                  unmatchedPayments++;
                  console.log(`⚠️  Could not find event for optional payment. Student: ${student.usn || studentIndex}, Payment ID: ${paymentId}, Payment:`, JSON.stringify({
                    _id: payment._id,
                    id: payment.id,
                    paid: payment.paid,
                    status: payment.status
                  }, null, 2));
                }
              } // End if (isPending)
            } // End if (isPaid)
          }); // End forEach optional payment
        } // End if (student.payments.optional)
      } // End if (student.payments)
    }); // End allStudents.forEach

    console.log(`📈 Statistics:`);
    console.log(`   Total payments checked: ${totalPaymentsChecked}`);
    console.log(`   Paid payments found: ${paidPaymentsFound}`);
    console.log(`   Pending payments found: ${pendingPaymentsFound}`);
    console.log(`   Unmatched payments: ${unmatchedPayments}`);
    console.log(`✅ Found ${pendingPayments.length} pending payments ready for review`);
    res.json({ pendingPayments });
  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({ error: 'Failed to get pending payments: ' + error.message });
  }
});

// Confirm or reject a payment (admin only)
app.put('/api/admin/confirm-payment', authenticateToken, async (req, res) => {
  console.log('🔍 PUT /api/admin/confirm-payment - Route hit');
  console.log('🔍 Request body:', req.body);
  
  const session = client.startSession();
  session.startTransaction();
  
  try {
    if (req.user.role !== 'admin') {
      console.log('❌ Access denied - not admin');
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { studentId, paymentId, status, eventType } = req.body;
    console.log('🔍 Processing confirmation:', { studentId, paymentId, status, eventType });

    if (!studentId || !paymentId || !status || !eventType) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['confirmed', 'rejected'].includes(status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'Invalid status. Must be "confirmed" or "rejected"' });
    }

    // Find the student with session
    const student = await db.collection('users').findOne(
      { _id: new ObjectId(studentId) },
      { session }
    );

    if (!student || !student.payments) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Student or payment not found' });
    }

    // Make a deep copy of the payments to avoid modifying the original
    const updatedPayments = JSON.parse(JSON.stringify(student.payments));
    const paymentArray = eventType === 'mandatory' ? updatedPayments.mandatory : updatedPayments.optional;
    
    // Find the payment to update
    const paymentIndex = paymentArray.findIndex(p => 
      (p._id && p._id.toString() === paymentId) || 
      (p.id && p.id.toString() === paymentId)
    );

    if (paymentIndex === -1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Update payment status and timestamps
    const now = new Date();
    paymentArray[paymentIndex].status = status;
    paymentArray[paymentIndex].updatedAt = now;
    
    if (status === 'confirmed') {
      paymentArray[paymentIndex].confirmedAt = now;
      paymentArray[paymentIndex].confirmedBy = req.user.id;
      paymentArray[paymentIndex].paid = true;
    } else if (status === 'rejected') {
      paymentArray[paymentIndex].rejectedAt = now;
      paymentArray[paymentIndex].rejectedBy = req.user.id;
      paymentArray[paymentIndex].paid = false;
    }

    // Update the student document with the modified payments
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(studentId) },
      { 
        $set: { 
          'payments.mandatory': updatedPayments.mandatory,
          'payments.optional': updatedPayments.optional,
          updatedAt: now
        }
      },
      { session }
    );

    if (result.matchedCount === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'Student not found' });
    }

    // If we got here, commit the transaction
    await session.commitTransaction();
    session.endSession();

    console.log('✅ Payment status updated successfully');
    res.json({ 
      success: true,
      message: `Payment ${status} successfully`,
      payment: paymentArray[paymentIndex]
    });
  } catch (error) {
    // If an error occurred, abort the transaction
    await session.abortTransaction();
    session.endSession();
    
    console.error('❌ Confirm payment error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to confirm payment: ' + error.message 
    });
  }
});

// 404 handler for API routes - return JSON instead of HTML
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  // Serve static files from the React app
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // The "catchall" handler: send back React's index.html file for any non-API routes
  app.use((req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return next();
    }
    // For all other routes, serve the React app
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Global error handler - ensure all errors return JSON
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error' 
  });
});

// Start server only after attempting DB connection
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  if (isConnected) {
    console.log(`✅ Database connected and ready`);
  } else {
    console.log(`⚠️  Server started but database connection failed`);
  }
});