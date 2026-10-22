var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRoutes = require('./routes/authRoutes');
var apiRoutes = require('./routes/apiRoutes');
var alertRoutes = require('./routes/alertRoutes');
var zoneRoutes = require('./routes/zoneRoutes');
var sensorRoutes = require('./routes/sensorRoutes');
var farmRoutes = require('./routes/farmRoutes');
var featureRoutes = require('./routes/featureRoutes');

var app = express();

// Database connection
const connectDB = require('./config/db');
connectDB();

// Enable CORS
app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/features', featureRoutes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
