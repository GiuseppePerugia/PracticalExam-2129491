// models/organiserModel.js
const Datastore = require('nedb');
const path = require('path');

// Setup for the organiser database
const db = new Datastore({ filename: path.join(__dirname, '../db/organisers.db'), autoload: true });

// Default organisers to populate the database (if required)
const defaultOrganisers = [
  { name: 'John Doe', role: 'Course Organiser', courses: ['courseId1', 'courseId2'] },
  { name: 'Jane Smith', role: 'Class Organiser', courses: ['courseId3', 'courseId4'] },
  { name: 'Giuseppe Perugia', role: 'Class Organiser', courses: ['courseId3', 'courseId4'] },
];

// Insert default organisers if the database is empty
db.count({}, (err, count) => {
  if (count === 0) {
    defaultOrganisers.forEach(organiser => {
      db.insert(organiser, (err, newOrganiser) => {
        if (err) console.log('Error inserting organiser:', err);
        else console.log('Organiser added:', newOrganiser);
      });
    });
  }
});

// Function to get all organisers
function getAllOrganisers(callback) {
  db.find({}, callback);
}

// Function to add a new organiser
function addOrganiser(name, role, courses, callback) {
  const newOrganiser = { name, role, courses };
  db.insert(newOrganiser, callback);
}

// Function to delete an organiser by ID
function deleteOrganiser(id, callback) {
  db.remove({ _id: id }, {}, callback);
}

module.exports = {
  getAllOrganisers,
  addOrganiser,
  deleteOrganiser
};
