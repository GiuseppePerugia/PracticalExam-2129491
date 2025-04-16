// public.js
const express = require('express');
const router = express.Router();
const courseModel = require('../models/courseModel');
const enrolmentModel = require('../models/enrolmentModel');
const bookingModel = require('../models/bookingModel');
const Datastore = require('nedb');
const path = require('path');



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

    // Ensure each course has its classes populated
    const coursesWithClasses = courses.map(course => {
      // If course doesn't have classes, generate them
      if (!course.classes) {
        course.classes = generateClasses(course);  // You may want to use your generateClasses method here
      }
      return course;
    });

    // Render the overview page with courses and their classes
    res.render('overview', {
      courses: coursesWithClasses || [],  // Pass courses with classes, otherwise an empty array
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
  const { username, email } = req.body; // Get username and email from the form data

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
      userName: username,
      userEmail: email, // Use the user's email from session
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

// Admin route to view classes for editing
router.get('/organiser/classes/:courseId', (req, res) => {
  const courseId = req.params.courseId;

  if (!req.session.user || req.session.user !== 'admin') {
    return res.redirect('/organiser/login');
  }

  // Fetch course data along with classes
  courseModel.get(courseId, (err, course) => {
    if (err || !course) {
      return res.status(404).send('Course not found');
    }

    // Render classes-admin view with course data
    res.render('classes-admin', {
      course
    });
  });
});

// Admin route to edit a class (location, time, etc.)
router.get('/organiser/classes/:courseId/edit/:classId', (req, res) => {
  const { courseId, classId } = req.params;

  if (!req.session.user || req.session.user !== 'admin') {
    return res.redirect('/organiser/login');
  }

  // Fetch course and class data
  courseModel.get(courseId, (err, course) => {
    if (err || !course) {
      return res.status(404).send('Course not found');
    }

    // Find the specific class in the course
    const classToEdit = course.classes.find(cls => cls._id === classId);
    if (!classToEdit) {
      return res.status(404).send('Class not found');
    }

    // Render the admin edit page
    res.render('class-edit', {
      course,
      class: classToEdit
    });
  });
});

// Admin route to save edited class details
router.post('/organiser/classes/:courseId/edit/:classId', (req, res) => {
  const { courseId, classId } = req.params;
  const { day, date, startTime, endTime, location, pricePerClass } = req.body;  // Include missing fields

  if (!req.session.user || req.session.user !== 'admin') {
    return res.redirect('/organiser/login');
  }

  // Update class details in the course
  courseModel.get(courseId, (err, course) => {
    if (err || !course) {
      return res.status(404).send('Course not found');
    }

    const classToUpdate = course.classes.find(cls => cls._id === classId);
    if (classToUpdate) {
      // Update the class fields
      classToUpdate.day = day;
      classToUpdate.date = date;
      classToUpdate.time = `${startTime} to ${endTime}`;  // Concatenate time to a single string
      classToUpdate.location = location;
      classToUpdate.pricePerClass = pricePerClass;

      // Save the updated course with updated class details
      courseModel.update(courseId, { classes: course.classes }, (err) => {
        if (err) {
          return res.status(500).send('Error saving changes');
        }

        // Redirect back to the class view after saving changes
        res.redirect(`/organiser/classes/${courseId}`);  // Redirect to the specific class page
      });
    } else {
      return res.status(404).send('Class not found');
    }
  });
});

// Edit class route
router.post('/organiser/edit-class/:id', (req, res) => {
  const classId = req.params.id;
  const { day, date, time, location, pricePerClass } = req.body;

  // Update the class details in the database
  bookingModel.updateClass(classId, { day, date, time, location, pricePerClass }, (err, updatedClass) => {
    if (err) {
      console.log('Error updating class:', err);
      return res.redirect(`/organiser/edit-class/${classId}`);
    }

    res.redirect(`/courses/classes/${updatedClass.courseId}`); // Redirect to the classes page of the course
  });
});

// Route to delete a class from a course
router.post('/courses/classes/:courseId/delete/:classId', (req, res) => {
  const { courseId, classId } = req.params;

  // Check if user is an admin
  if (!req.session.user || req.session.user !== 'admin') {
    return res.redirect('/organiser/login'); // Redirect if not admin
  }

  // Find the course by its ID
  courseModel.get(courseId, (err, course) => {
    if (err || !course) {
      return res.status(404).send('Course not found');
    }

    // Remove the class with the given classId
    const updatedClasses = course.classes.filter(classItem => classItem._id !== classId);

    // Update the course with the new list of classes
    courseModel.update(courseId, { classes: updatedClasses }, (err) => {
      if (err) {
        return res.status(500).send('Error deleting class');
      }

      // Redirect back to the course's class page after deletion
      res.redirect(`/organiser/classes/${courseId}`);
    });
  });
});

// Route to view participants for a specific class
router.get('/organiser/classes/:courseId/class-participants/:classId', (req, res) => {
  const { courseId, classId } = req.params;

  // Fetch the course and the class details
  courseModel.get(courseId, (err, course) => {
    if (err || !course) {
      return res.status(404).send('Course not found');
    }

    // Find the specific class by classId
    const selectedClass = course.classes.find(c => c._id === classId);

    if (!selectedClass) {
      return res.status(404).send('Class not found');
    }

    // Fetch the participants for the selected class
    bookingModel.getBookingsByClass(classId, (err, bookings) => {
      if (err) {
        return res.status(500).send('Error fetching participants');
      }

      // Pass the participants and class details to the view
      res.render('class-participants', {
        courseTitle: course.title, // Use course title for display
        classDetails: selectedClass, // Include the class details (day, date, time, etc.)
        participants: bookings // List of participants who booked the class
      });
    });
  });
});

// -- New impmenetations -------------------------------------------------------------------------------------------

// Route to show all users for admin
router.get('/organiser/manage-users', (req, res) => {
  if (!req.session.user || req.session.user !== 'admin') {
    return res.redirect('/organiser/login');
  }

  const usersDb = new Datastore({ filename: path.join(__dirname, '../db/users.db'), autoload: true });

  usersDb.find({}, (err, users) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).send('Error fetching users');
    }

    // Get the admin's user ID from the session
    const adminUserId = req.session.user === 'admin' ? 'adminUserId' : null;

    res.render('manage-users', {
      users: users || [],
      isAdmin: req.session.user === 'admin',  // Pass isAdmin flag to the template
      adminUserId: adminUserId  // Pass admin user ID to template
    });
  });
});

// Route to delete a user by ID
router.get('/organiser/delete-user/:userId', (req, res) => {
  if (!req.session.user || req.session.user !== 'admin') { // Ensure only admins can delete users
    return res.redirect('/organiser/login');
  }

  const userId = req.params.userId;

  // Fetch the users database
  const usersDb = new Datastore({ filename: path.join(__dirname, '../db/users.db'), autoload: true });

  // Delete user from the database
  usersDb.remove({ _id: userId }, {}, (err, numRemoved) => {
    if (err || numRemoved === 0) {
      console.error('Error deleting user:', err);
      return res.status(500).send('Error deleting user');
    }

    // After deletion, redirect to the manage users page
    res.redirect('/organiser/manage-users');
  });
});


module.exports = router;