const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const courseModel = require('../models/courseModel');
const enrolmentModel = require('../models/enrolmentModel');

// Middleware to ensure the user is logged in
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/organiser/login');
  }
  next();
}

// Middleware to ensure the user is an admin
function requireAdmin(req, res, next) {
  if (req.session.user !== 'admin') {
    return res.status(403).send('Access denied');
  }
  next();
}

// Login route
router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  userModel.findUser(username, (err, user) => {
    if (err || !user) {
      return res.render('login', { error: 'User not found' });
    }
    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        req.session.user = username;
        res.redirect('/organiser/dashboard');
      } else {
        res.render('login', { error: 'Incorrect password' });
      }
    });
  });
});

// Register route
router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/register', (req, res) => {
  const { username, email, firstName, lastName, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.render('register', { error: 'Passwords do not match' });
  }

  userModel.findUser(username, (err, existingUser) => {
    if (existingUser) {
      return res.render('register', { error: 'Username or email already exists' });
    }

    userModel.createUser(username, email, firstName, lastName, password, (err, newUser) => {
      if (err) {
        return res.render('register', { error: 'Error creating user: ' + err });
      }
      req.session.user = newUser.username;
      res.redirect('/organiser/dashboard');
    });
  });
});

// Dashboard route
router.get('/dashboard', requireLogin, (req, res) => {
  const username = req.session.user;
  const isAdmin = username === 'admin';

  courseModel.getAll((err, courses) => {
    if (err) return res.status(500).send('Error loading courses');

    res.render('dashboard', {
      username,
      isAdmin,
      courses
    });
  });
});

// Add course route (Admin only)
router.get('/add-course', requireLogin, requireAdmin, (req, res) => {
  res.render('add-course');
});

router.post('/add-course', requireLogin, requireAdmin, (req, res) => {
  const { title, description, category, price, days, startTime, endTime, location, startDate, endDate, numberOfClasses } = req.body;

  // Ensure days is always an array, even if no checkboxes are checked
  const selectedDays = Array.isArray(days) ? days : (days ? [days] : []);

  // Ensure no empty fields
  if (!title || !description || !category || !price || selectedDays.length === 0 || !startTime || !endTime || !location || !startDate || !endDate || !numberOfClasses) {
    return res.render('add-course', { error: 'All fields are required.' });
  }

  // Construct the time as startTime to endTime
  const time = `${startTime} to ${endTime}`;

  // Dynamically assign image based on category
  const image = `/images/${category.toLowerCase()}.jpg`;
  
  // Convert the start and end date from string to Date object
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  // Pass numberOfClasses to create function
  courseModel.create(title, description, price, selectedDays, time, category, image, location, numberOfClasses, startDateObj, endDateObj, (err) => {
    if (err) {
      return res.render('add-course', { error: 'Error creating course.' });
    }
    res.redirect('/organiser/dashboard');
  });
});


// Edit course route (Admin only)
router.get('/edit-course/:id', requireLogin, requireAdmin, (req, res) => {
  const courseId = req.params.id;

  courseModel.get(courseId, (err, course) => {
    if (err || !course) {
      return res.status(404).send('Course not found');
    }

    // Create category flags for the select dropdown
    const categoryFlags = {
      Urban: course.category === 'Urban',
      Classical: course.category === 'Classical',
      Latin: course.category === 'Latin',
      Jazz: course.category === 'Jazz',
      Modern: course.category === 'Modern',
      Pop: course.category === 'Pop',
      World: course.category === 'World',
      Rhythmic: course.category === 'Rhythmic',
    };
    
    // Create flags for each day based on whether it's included in the course's days
    const daysFlags = {
      Monday: course.days.includes("Monday"),
      Tuesday: course.days.includes("Tuesday"),
      Wednesday: course.days.includes("Wednesday"),
      Thursday: course.days.includes("Thursday"),
      Friday: course.days.includes("Friday"),
    };

    // Create flags for time (split the course time into start and end time)
    let startTime = '';
    let endTime = '';
    if (course.time && course.time.includes(' to ')) {
      const timeParts = course.time.split(' to ');
      startTime = timeParts[0] || '';
      endTime = timeParts[1] || '';
    }

    res.render('edit-course', { 
      course, 
      categoryFlags,
      daysFlags,
      startTime,
      endTime
    });
  });
});

router.post('/edit-course/:id', requireLogin, requireAdmin, (req, res) => {
  const courseId = req.params.id;
  const { title, description, category, price, days, startTime, endTime, location, startDate, endDate, numberOfClasses } = req.body;

  // Log the form data to check if 'numberOfClasses' is being passed correctly
  console.log('Form data:', req.body);  // Check if 'numberOfClasses' is in the request

  // Combine start time and end time
  const time = `${startTime} to ${endTime}`;

  // Assign image based on category
  const image = `/images/${category.toLowerCase()}.jpg`;

  // Convert the start and end date from string to Date object
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  // Update course with the new data, including 'numberOfClasses'
  courseModel.update(courseId, { 
    title, 
    description, 
    price, 
    days, 
    time, 
    category, 
    image, 
    location, 
    startDate: startDateObj, 
    endDate: endDateObj, 
    numberOfClasses 
  }, (err) => {
    if (err) {
      return res.status(500).send('Error updating course');
    }
    res.redirect('/organiser/dashboard');
  });
});

// Delete course route (Admin only)
router.get('/delete-course/:id', requireLogin, requireAdmin, (req, res) => {
  const courseId = req.params.id;

  courseModel.remove(courseId, (err) => {
    if (err) {
      return res.status(500).send('Error deleting course');
    }
    res.redirect('/organiser/dashboard');
  });
});

// View Enrolments for a Course (Admin only)
router.get('/enrolments/:id', requireLogin, requireAdmin, (req, res) => {
  const courseId = req.params.id;

  // Find the course
  courseModel.get(courseId, (err, course) => {
    if (err || !course) {
      return res.status(404).send('Course not found');
    }

    // Get users enrolled in this course
    enrolmentModel.getEnrolmentsByCourse(courseId, (err, enrolments) => {
      if (err) {
        return res.status(500).send('Error fetching enrolments');
      }

      // Render the enrolments page and pass the course and enrolment data
      res.render('enrolments', { course, enrolments });
    });
  });
});

// Logout route
router.get('/logout', requireLogin, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.redirect('/');  // Redirect to home page after logout
  });
});

module.exports = router;