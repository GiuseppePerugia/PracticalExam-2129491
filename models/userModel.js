const Datastore = require('nedb');
const bcrypt = require('bcrypt');

const db = new Datastore({ filename: 'db/users.db', autoload: true });

// Add default admin user if none exists
const defaultAdmin = {
  username: 'admin',
  password: 'password',
  email: 'admin@danceacademy.com' // Add an example email
};

db.count({}, (err, count) => {
  if (count === 0) {
    bcrypt.hash(defaultAdmin.password, 10, (err, hash) => {
      db.insert({ username: defaultAdmin.username, password: hash, email: defaultAdmin.email });
      console.log('Default admin user created');
    });
  }
});

// Find user by username or email
function findUser(identifier, callback) {
  db.findOne({ $or: [{ username: identifier }, { email: identifier }] }, callback);
}

function createUser(username, email, firstName, lastName, password, callback) {
  // Check if the user already exists (either by username or email)
  db.findOne({ $or: [{ username }, { email }] }, (err, existingUser) => {
    if (err) {
      console.error('Error checking for existing user:', err);
      return callback(err);
    }
    
    if (existingUser) {
      console.log('User already exists:', existingUser);
      return callback('User already exists');
    }

    // Hash the password before saving the user
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        console.error('Error hashing password:', err);
        return callback(err);
      }
      
      const newUser = { username, email, firstName, lastName, password: hash };
      
      // Insert new user into the database
      db.insert(newUser, (err) => {
        if (err) {
          console.error('Error inserting user into DB:', err);
          return callback(err);
        }
        
        console.log('User created successfully:', newUser);
        callback(null, newUser);  // Return the new user object
      });
    });
  });
}

module.exports = {
  findUser,
  createUser,
};