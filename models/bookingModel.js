// models/bookingModel.js
const Datastore = require('nedb');
const path = require('path');

// Create a new NeDB database for bookings
const db = new Datastore({ filename: path.join(__dirname, '../db/bookings.db'), autoload: true });

// Function to get bookings by class
function getBookingsByClass(classId, callback) {
  db.find({ classId }, callback);
}

// Function to add a new booking
function addBooking(booking, callback) {
  db.insert(booking, callback);
}

// Function to get bookings by user email
function getBookingsByUser(userEmail, callback) {
  db.find({ userEmail }, callback);
}

function updateClass(classId, updateData, callback) {
  db.update({ _id: classId }, { $set: updateData }, {}, (err, numReplaced) => {
    if (err) return callback(err);
    callback(null, { ...updateData, _id: classId });
  });
}

module.exports = {
  getBookingsByClass,
  addBooking,
  getBookingsByUser,
  updateClass
};