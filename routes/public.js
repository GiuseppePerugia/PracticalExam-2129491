// public.js
const express = require('express');
const router = express.Router();
const courseModel = require('../models/courseModel');
const enrolmentModel = require('../models/enrolmentModel');
const bookingModel = require('../models/bookingModel');


// Home page route
router.get('/', (req, res) => {
  res.render('home');
});

// Overview route (About Us page)
router.get('/overview', (req, res) => {
  // Fetch courses from the database
  courseModel.getAll((err, courses) => {
    if (err) {
      console.error('Error loading courses:', err);
      return res.status(500).send('Error loading courses');
    }

    // Debug log: Print out the courses to check if they are fetched correctly
    console.log('Courses:', courses);

    // Check if courses exist and locations are available
    res.render('overview', {
      courses: courses || [],  // Pass courses if available, otherwise an empty array
    });
  });
});

router.get('/courses', (req, res) => {
  const username = req.session.user; // Get logged-in user

  // Fetch all courses
  courseModel.getAll((err, courses) => {
    if (err) {
      console.error('Error fetching courses:', err);
      return res.render('courses', { error: 'Could not load courses' });
    }

    // If the user is logged in, get their enrolment status
    if (username) {
      enrolmentModel.getEnrolmentsByUser(username, (err, enrolments) => {
        if (err) {
          console.error('Error fetching enrolments:', err);
          return res.render('courses', { error: 'Could not fetch enrolments' });
        }

        // Mark each course with enrolment status (if the user is enrolled)
        courses = courses.map(course => {
          const isEnrolled = enrolments.some(enrolment => enrolment.courseId === course._id);
          return { ...course, enrolled: isEnrolled };
        });

        // Generate class dates dynamically based on start and end date for each course
        courses = courses.map(course => {
          const startDate = new Date(course.startDate);
          const endDate = new Date(course.endDate);

          const classDates = [];
          let date = startDate;

          while (date <= endDate) {
            const dayOfWeek = date.getDay();
            if (course.days.includes(getDayName(dayOfWeek))) {
              classDates.push({
                day: getDayName(dayOfWeek),
                date: new Date(date), // New Date object to preserve data
                time: course.time,
                location: course.location
              });
            }
            date.setDate(date.getDate() + 1); // Move to the next day
          }

          return { ...course, classDates };
        });

        // Render the courses page, passing the courses with enrolment status and class dates
        res.render('courses', { courses });
      });
    } else {
      // If no user is logged in, simply render the courses without enrolment status
      res.render('courses', { courses });
    }
  });
});

function getDayName(dayIndex) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
}

// Enrolment form (GET)
router.get('/courses/enrol/:id', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/organiser/login');
  }

  const id = req.params.id;
  courseModel.get(id, (err, course) => {
    if (err || !course) {
      return res.status(404).send('Course not found');
    }
    res.render('enrol', { course });
  });
});

// Enrolment form (POST) - Save to DB
router.post('/courses/enrol/:id', (req, res) => {
  const username = req.session.user;
  const courseId = req.params.id;

  // Check if user is already enrolled
  enrolmentModel.getEnrolmentsByUser(username, (err, userCourses) => {
    if (err) return res.status(500).send('Error checking enrolments');

    const alreadyEnrolled = userCourses.some((enrolment) => enrolment.courseId === courseId);
    if (alreadyEnrolled) {
      return res.redirect('/organiser/dashboard');  // Redirect to dashboard if already enrolled
    }

    // Enrol the user in the course
    enrolmentModel.addEnrolment({ courseId, username }, (err) => {
      if (err) {
        return res.status(500).send('Error enrolling in course');
      }
      res.redirect('/organiser/dashboard');  // Redirect to dashboard after successful enrolment
    });
  });
});

// Admin's dashboard
router.get('/organiser/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/organiser/login');
  }

  const isAdmin = req.session.user === 'admin';  // Check if user is admin

  courseModel.getAll((err, courses) => {
    if (err) return res.render('dashboard', { error: 'Could not load courses' });

    // Mark enrolled courses
    enrolmentModel.getEnrolmentsByUser(req.session.user, (err, enrolments) => {
      if (err) {
        console.log('Error fetching enrolments:', err);
        return res.render('dashboard', { error: 'Error fetching enrolments' });
      }

      const updatedCourses = courses.map(course => {
        const enrolled = enrolments.some(e => e.courseId === course._id);
        return { ...course, enrolled };
      });

      res.render('dashboard', { courses: updatedCourses, isAdmin });
    });
  });
});

// View Classes for a Course
router.get('/courses/classes/:id', (req, res) => {
  const courseId = req.params.id;

  // Find the course and get the classes dynamically
  courseModel.get(courseId, (err, course) => {
    if (err || !course) {
      return res.status(404).send('Course not found');
    }

    // Pass the course and the session to the template
    res.render('classes', { 
      course,
      session: req.session // Pass session data to check if user is logged in
    });
  });
});

// Handle class booking (POST)
router.post('/courses/classes/:courseId/booking/:classId', (req, res) => {
  const { courseId, classId } = req.params;

  if (!req.session.user) {
    return res.redirect('/organiser/login');
  }

  // Logic to check if user is already booked for this class
  bookingModel.getBookingsByClass(classId, (err, bookings) => {
    if (err) {
      return res.status(500).send('Error checking bookings');
    }

    const alreadyBooked = bookings.some(booking => booking.userEmail === req.session.user.email);
    if (alreadyBooked) {
      return res.redirect(`/courses/classes/${courseId}`); // Redirect if already booked
    }

    // Otherwise, proceed with booking logic
    const booking = {
      courseId,
      classId,
      userEmail: req.session.user.email, // Use the user's email from session
      bookedAt: new Date()
    };

    // Add the booking to the database
    bookingModel.addBooking(booking, (err, newBooking) => {
      if (err) {
        return res.status(500).send('Error booking the class');
      }

      res.redirect(`/courses/classes/${courseId}`); // Redirect back to the course's class page
    });
  });
});

// Route to display class booking form
router.get('/courses/classes/:courseId/class-booking/:classId', (req, res) => {
  const { courseId, classId } = req.params;

  // Check if user is logged in (check session)
  if (!req.session.user) {
    // If not logged in, redirect to login page
    return res.redirect('/organiser/login');
  }

  // Get course details to display on the booking page
  courseModel.get(courseId, (err, course) => {
    if (err || !course) {
      return res.status(404).send('Course not found');
    }

    // Check if user is already booked for this class
    bookingModel.getBookingsByClass(classId, (err, bookings) => {
      if (err) {
        return res.status(500).send('Error checking bookings');
      }

      const alreadyBooked = bookings.some(booking => booking.userEmail === req.session.user.email);
      if (alreadyBooked) {
        return res.render('class-booking', {
          course,
          classId,
          alreadyBooked: true
        });
      }

      // Otherwise, show the booking form for the class
      res.render('class-booking', {
        course,
        classId,
        alreadyBooked: false
      });
    });
  });
});

module.exports = router;