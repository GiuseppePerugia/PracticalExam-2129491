// models/enrolmentModel.js
const Datastore = require('nedb');
const path = require('path');
const userModel = require('./userModel'); // Import user model to fetch user details

const db = new Datastore({
  filename: path.join(__dirname, '../db/enrolments.db'),
  autoload: true
});

// Add a new enrolment
function addEnrolment(data, callback) {
  db.insert(data, callback);
}

// Get all enrolments for a specific user
function getEnrolmentsByUser(username, callback) {
  db.find({ username }, callback);
}

// Get all enrolments for a course, with user details
function getEnrolmentsByCourse(courseId, callback) {
  db.find({ courseId }, (err, enrolments) => {
    if (err) return callback(err);

    // Fetch user details for each enrolment
    const userPromises = enrolments.map((enrolment) => {
      return new Promise((resolve, reject) => {
        userModel.findUser(enrolment.username, (err, user) => {
          if (err || !user) return reject(err);
          enrolment.user = user;  // Attach user details to the enrolment
          resolve(enrolment);
        });
      });
    });

    // Once all users' details are fetched, pass the final result
    Promise.all(userPromises)
      .then((enrolmentsWithDetails) => callback(null, enrolmentsWithDetails))
      .catch(callback);  // Handle any errors
  });
}

// Optional: get all enrolments
function getAllEnrolments(callback) {
  db.find({}, callback);
}

module.exports = {
  addEnrolment,
  getEnrolmentsByUser,
  getEnrolmentsByCourse,  // Modified to include user details
  getAllEnrolments
};