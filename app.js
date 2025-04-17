// Strictly using concepts from Weeks 1–10
const express = require('express');
const mustacheExpress = require('mustache-express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const Datastore = require('nedb');

// Create the app
const app = express();
const PORT = process.env.PORT || 3000;

// NeDB database setup for courses
const courseDb = new Datastore({ 
  filename: path.join(__dirname, 'db', 'courses.db'), 
  autoload: true 
});

// Mustache setup (Week 5)
const mustache = mustacheExpress();

// Define Mustache helpers
mustache.tags = ['{{', '}}'];  // Specify custom delimiters
mustache.helpers = {
  eq: (a, b) => a === b  // Helper to check equality
};

app.engine('mustache', mustache);
app.set('view engine', 'mustache');
app.set('views', path.join(__dirname, 'views'));

// Static files (Week 4)
app.use(express.static(path.join(__dirname, 'public')));

// Serve Bootstrap CSS and JS from node_modules
app.use('/css', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'css')));
app.use('/js', express.static(path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'js')));

// Middleware (Week 2)
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // For parsing application/json


// Session (Week 8)
app.use(session({
  secret: 'supersecretkey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Example middleware to expose user session to views
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// Routes setup (Week 2 + Week 5 MVC)
const publicRoutes = require('./routes/public');
const organiserRoutes = require('./routes/organiser');

app.use('/', publicRoutes);
app.use('/organiser', organiserRoutes);

// 404 handler (Week 7)
app.use((req, res) => {
  res.status(404).render('404');
});

// Start the server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
} else {
  module.exports = app;
}