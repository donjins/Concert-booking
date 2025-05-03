require('dotenv').config(); // Load environment variables

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
var crypto = require('crypto');
const session = require('express-session');


// Import Routes
var indexRouter = require('./routes/index');
const authRoutes = require('./routes/auth');      
var concertsRouter = require('./routes/concert'); 
var bookingsRouter = require('./routes/bookings'); 
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user'); 
const concertApiRoutes = require('./routes/api/concertApi')
const authApiRoutes = require('./routes/api/authApi')
const bookingApiRoutes = require('./routes/api/bookingsApi')

var app = express();

// Generate a secure JWT Secret Key (if not set in .env)
const generateSecretKey = () => crypto.randomBytes(32).toString('hex');
const JWT_SECRET = process.env.JWT_SECRET || generateSecretKey();
console.log("🔑 JWT Secret Key Loaded");

// Database Connection
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ DB Connection Error:", err));

// View Engine Setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors()); // Enable CORS for frontend
app.use(express.static(path.join(__dirname, 'public')));
const methodOverride = require('method-override')




app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));


// Routes
// app.use('/', indexRouter);      
app.use('/', authRoutes);   
app.use('/concerts', concertsRouter); 
app.use('/bookings', bookingsRouter); 
app.use('/admin', adminRoutes);
app.use('/user', userRoutes);
app.use('/concertApi', concertApiRoutes);
app.use('/authApi', authApiRoutes);
app.use('/bookingApi', bookingApiRoutes);

// In your app.js or server.js

// Handle 404 Errors
app.use(function(req, res, next) {
  next(createError(404));
});

// Error Handler

app.use(methodOverride('_method'));

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
