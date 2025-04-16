const Datastore = require('nedb');
const path = require('path');
const { v4: uuidv4 } = require('uuid');  // Import uuid to generate unique IDs

const db = new Datastore({ filename: path.join(__dirname, '../db/courses.db'), autoload: true });

// Add default courses with categories, image URLs, price, days, and time
const defaultCourses = [
  { 
    title: 'Salsa', 
    description: 'Learn Latin rhythm and movement.',
    price: '180', 
    days: 'Monday, Wednesday',
    time: '6:00pm to 7:30pm',
    category: 'Latin', 
    image: '/images/latin.jpg',
    location: 'Studio A, 10 example st., EH1 111, Edinburgh',
    numberOfClasses: 7,
    startDate: '2025-03-25',
    endDate: '2025-05-06'
  },
  { 
    title: 'Hip Hop', 
    description: 'Urban style dance techniques.',
    price: '150',  
    days: 'Tuesday, Thursday',
    time: '5:00pm to 6:30pm',
    category: 'Urban', 
    image: '/images/urban.jpg',
    location: 'Studio B, 5 example avenue, G1 111, Glasgow',
    numberOfClasses: 8,
    startDate: '2025-04-15', 
    endDate: '2025-06-05'
  },
  { 
    title: 'Ballet', 
    description: 'Classical dance for balance and grace.',
    price: '220',  
    days: 'Monday, Friday',
    time: '7:00pm to 8:30pm',
    category: 'Classical', 
    image: '/images/classical.jpg',
    location: 'Studio A, 10 example st., EH1 111, Edinburgh',
    numberOfClasses: 10,
    startDate: '2025-04-14', 
    endDate: '2025-06-06'
  },
  { 
    title: 'Jazz Funk', 
    description: 'A mix of jazz, hip hop, and street styles.',
    price: '130',  
    days: 'Wednesday, Friday',
    time: '8:00pm to 9:30pm',
    category: 'Jazz', 
    image: '/images/jazz.jpg',
    location: 'Studio C, 15 example st., PA1 111, Pasley',
    numberOfClasses: 8,
    startDate: '2025-04-16', 
    endDate: '2025-05-30'
  },
  { 
    title: 'Contemporary', 
    description: 'Expressive movement and floor work.',
    price: '180',  
    days: 'Monday, Wednesday',
    time: '5:30pm to 7:00pm',
    category: 'Modern', 
    image: '/images/modern.jpg',
    location: 'Studio B, 5 example avenue, G1 111, Glasgow',
    numberOfClasses: 5,
    startDate: '2025-04-13',
    endDate: '2025-05-21'
  }
];

// Insert default courses if database is empty
db.count({}, (err, count) => {
  if (count === 0) {
    defaultCourses.forEach(course => {
      // Ensure course has an ID
      db.insert(course, (err, insertedCourse) => {
        if (err) {
          console.log('Error inserting course:', err);
        } else {
          // After inserting course, generate and attach classes
          const classes = generateClasses(insertedCourse);  // Generate classes with course ID
          insertedCourse.classes = classes;  // Attach classes to course
          
          // Update the course in the database with the classes
          db.update({ _id: insertedCourse._id }, { $set: { classes: classes } }, {}, (err, numReplaced) => {
            if (err) {
              console.log('Error updating classes for course:', err);
            } else {
              console.log('Course added with classes:', insertedCourse);
            }
          });
        }
      });
    });
  }
});

// Create a new course
function create(title, description, price, days, time, category, image, location, numberOfClasses, startDate, endDate, callback) {
  const course = { title, description, price, days, time, category, image, location, numberOfClasses, startDate, endDate };

  db.insert(course, (err, newCourse) => {
    if (err) return callback(err);

    // Generate classes for the new course after it is inserted
    const classes = generateClasses(newCourse);
    newCourse.classes = classes; // Attach classes to the course

    // Save the classes into the course document in the database
    db.update({ _id: newCourse._id }, { $set: { classes: classes } }, {}, (err, numReplaced) => {
      if (err) {
        console.log('Error updating classes for course:', err);
      } else {
        console.log('Classes successfully added for course:', newCourse.title);
      }
    });

    callback(null, newCourse);
  });
}

// Get all courses
function getAll(callback) {
  db.find({}, callback);
}

// Get one course by ID
function get(id, callback) {
  db.findOne({ _id: id }, (err, course) => {
    if (err) return callback(err);

    // If classes are not loaded, generate and insert them
    if (course && !course.classes) {
      const classes = generateClasses(course); // Generate classes if they don't exist
      course.classes = classes; // Add classes to course object

      // Insert the generated classes into the course document
      db.update({ _id: course._id }, { $set: { classes: classes } }, {}, (err, numReplaced) => {
        if (err) {
          console.log('Error updating classes for course:', err);
        } else {
          console.log('Classes successfully added for course:', course.title);
        }
      });
    }

    // Return the course (either with or without generated classes)
    callback(null, course);
  });
}

function generateClasses(course) {

  const startDate = new Date(course.startDate);
  const endDate = new Date(course.endDate);
  const daysArray = Array.isArray(course.days) ? course.days : course.days.split(', ');
  const classes = [];
  let currentDate = startDate;
  let classCount = 0;

  // Calculate price per class (with 10% added)
  const price = parseFloat(course.price);  // Convert price to a number
  const numberOfClasses = course.numberOfClasses;
  let pricePerClass = (price / numberOfClasses) * 1.10; // Add 10% to the price per class
  pricePerClass = pricePerClass.toFixed(2); // Format price per class with two decimal places

  while (currentDate <= endDate && classCount < course.numberOfClasses) {
    const dayOfWeek = currentDate.getDay();
    if (daysArray.includes(getDayName(dayOfWeek))) {
      // Create class objects and set the courseId and pricePerClass properly
      classes.push({
        _id: uuidv4(),  // Generate a unique ID for each class
        courseId: course._id,  // Link the class to the course
        day: getDayName(dayOfWeek),
        date: currentDate.toISOString().split('T')[0],  // Format date as 'yyyy-mm-dd'
        time: course.time,
        location: course.location,
        pricePerClass: pricePerClass  // Add price per class to each class
      });
      classCount++;
    }
    currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
  }

  return classes;
}

// Helper function to convert day number to string
function getDayName(dayIndex) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
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