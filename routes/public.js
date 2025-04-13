// public.js
const express = require('express');
const router = express.Router();
const courseModel = require('../models/courseModel');
const enrolmentModel = require('../models/enrolmentModel');

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

// Book button should redirect to login if not logged in
router.get('/courses/classes/:id/book', (req, res) => {
  if (!req.session.user) {
    // If not logged in, redirect to login page
    return res.redirect('/organiser/login');
  }

  const courseId = req.params.id;

  // Proceed with booking after checking user login
  // Logic to enroll the user in the course or mark the class as booked can go here

  res.redirect(`/courses/classes/${courseId}`); // Redirect back to class page
});

module.exports = router;