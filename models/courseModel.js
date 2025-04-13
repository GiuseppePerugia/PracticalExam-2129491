// models/courseModel.js
const Datastore = require('nedb');
const path = require('path');

const db = new Datastore({ filename: path.join(__dirname, '../db/courses.db'), autoload: true });

// Add default courses with categories, image URLs, price, days, and time
const defaultCourses = [
  { 
    title: 'Salsa', 
    description: 'Learn Latin rhythm and movement.',
    price: '180',  // Example price
    days: 'Monday, Wednesday',
    time: '6:00pm to 7:30pm',
    category: 'Latin', 
    image: '/images/latin.jpg',
    location: 'Studio A, 10 example st., EH1 111, Edinburgh',
    numberOfClasses: 7,
    startDate: '2025-03-25', // Start date for Salsa
    endDate: '2025-05-06' // End date for Salsa (adjusted to fit the class schedule)
  },
  { 
    title: 'Hip Hop', 
    description: 'Urban style dance techniques.',
    price: '150',  // Example price
    days: 'Tuesday, Thursday',
    time: '5:00pm to 6:30pm',
    category: 'Urban', 
    image: '/images/urban.jpg',
    location: 'Studio B, 5 example avenue, G1 111, Glasgow',
    numberOfClasses: 8,
    startDate: '2025-04-15', // Start date
    endDate: '2025-06-05' // End date
  },
  { 
    title: 'Ballet', 
    description: 'Classical dance for balance and grace.',
    price: '220',  // Example price
    days: 'Monday, Friday',
    time: '7:00pm to 8:30pm',
    category: 'Classical', 
    image: '/images/classical.jpg',
    location: 'Studio A, 10 example st., EH1 111, Edinburgh',
    numberOfClasses: 10,
    startDate: '2025-04-14', // Start date
    endDate: '2025-06-06' // End date
  },
  { 
    title: 'Jazz Funk', 
    description: 'A mix of jazz, hip hop, and street styles.',
    price: '130',  // Example price
    days: 'Wednesday, Friday',
    time: '8:00pm to 9:30pm',
    category: 'Jazz', 
    image: '/images/jazz.jpg',
    location: 'Studio C, 15 example st., PA1 111, Pasley',
    numberOfClasses: 8,
    startDate: '2025-04-16', // Start date
    endDate: '2025-05-30' // End date
  },
  { 
    title: 'Contemporary', 
    description: 'Expressive movement and floor work.',
    price: '180',  // Example price
    days: 'Monday, Wednesday',
    time: '5:30pm to 7:00pm',
    category: 'Modern', 
    image: '/images/modern.jpg',
    location: 'Studio B, 5 example avenue, G1 111, Glasgow',
    numberOfClasses: 5,
    startDate: '2025-04-13', // Start date (Monday)
    endDate: '2025-05-21' // End date (Wednesday)
  }
];

// Check if the courses exist before inserting the default courses
db.count({}, (err, count) => {
  if (count === 0) {
    db.insert(defaultCourses, () => {
      console.log('Default courses added to DB');
    });
  }
});

// Create new course
function create(title, description, price, days, time, category, image, location, numberOfClasses, startDate, endDate, callback) {
  const course = { title, description, price, days, time, category, image, location, numberOfClasses, startDate, endDate };
  db.insert(course, callback);
}

// Get all courses
function getAll(callback) {
  db.find({}, callback);
}

// Get one course by ID
function get(id, callback) {
  db.findOne({ _id: id }, (err, course) => {
    if (err) return callback(err);

    // Calculate price per class
    if (course && course.price && course.numberOfClasses) {
      const price = parseFloat(course.price); // Convert price to a number
      const numberOfClasses = course.numberOfClasses;
      let pricePerClass = (price / numberOfClasses) * 1.10; // Add 5% to the price per class
      
      // Format price per class with two decimal places before passing to template
      pricePerClass = pricePerClass.toFixed(2); // Now pricePerClass is formatted
      
      // Assign formatted price per class to the course object
      course.pricePerClass = pricePerClass;
    }

    // Log course data to check if the start and end dates are correct
    console.log("Course Data: ", course);

    // Generate classes based on days, start date, and number of classes
    if (course && course.days && course.startDate && course.endDate) {
      const startDate = new Date(course.startDate);
      const endDate = new Date(course.endDate);
      const daysArray = course.days.split(', ');  // Split days string into an array
      const classes = [];

      let currentDate = startDate;
      let classCount = 0;

      // Calculate class dates
      while (currentDate <= endDate && classCount < course.numberOfClasses) {
        const dayOfWeek = currentDate.getDay(); // Get the day of the week (0: Sunday, 1: Monday, etc.)

        if (daysArray.includes(getDayName(dayOfWeek))) {
          // Log each class being added
          console.log("Adding class: ", {
            day: getDayName(dayOfWeek),
            date: currentDate.toISOString().split('T')[0], // Format date as 'yyyy-mm-dd'
            time: course.time,
            location: course.location,
            pricePerClass: course.pricePerClass // Add price per class to each class
          });

          classes.push({
            day: getDayName(dayOfWeek),
            date: currentDate.toISOString().split('T')[0], // Format date as 'yyyy-mm-dd'
            time: course.time,
            location: course.location,
            pricePerClass: course.pricePerClass // Include price per class
          });

          classCount++;
        }
        currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
      }

      course.classes = classes;
    }

    // Log the final classes array to verify correct class dates
    console.log("Generated Classes: ", course.classes);

    callback(null, course);
  });
}

// Helper function to add days to a date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Helper function to convert day number to string
function getDayName(dayNumber) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber];
}

// Update course
function update(id, updatedData, callback) {
  db.update({ _id: id }, { $set: updatedData }, {}, callback);
}

// Delete course
function remove(id, callback) {
  db.remove({ _id: id }, {}, callback);
}

module.exports = {
  create,
  getAll,
  get,
  update,
  remove
};
