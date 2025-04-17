# Full public repo at https://github.com/GiuseppePerugia/PracticalExam-2129491

# Some Items are missing when connecting to the submission link

# Dance Class Management System

This project is a web application that allows users to view, book, and enroll in various dance courses, book classes as well as for administrators to manage users, oraganisers, classes and courses. The backend is powered by Node.js, and it utilizes several databases to handle different aspects of the system.

---

## Based On
Course content from **Weeks 1–10**, including:
- Node.js & Express (Week 1–2)
- NeDB database integration (Week 3)
- Mustache view engine and layouts (Week 4–5)
- MVC pattern and CRUD logic (Week 5)
- Security and authentication (Week 6–8)
- Input validation, routing, and testing (Week 6, 7)
- Framework comparisons (Week 10)

---

## How to Run the App

### Requirements:
Before running the application, ensure you have Node.js installed on your system. You can download it [here](https://nodejs.org).
- Node.js v18.x (used in class)

### Install and run:
```bash
npm install
npm install express
npm install uuid
npm start
```
App will run at: `http://localhost:3000`

To run tests:
```bash
npm test
```

---

## Organiser Credentials
Default login credentials for testing:
```
Username: admin
Password: password
```
Stored securely with `bcrypt` (Week 8).

---

## Folder Structure
```
├── app.js               # Main entry point
├── models/              # NeDB models (courses, users, enrolments)
├── routes/              # Express route handlers
├── views/               # Mustache templates
├── test/                # Mocha + Chai tests
├── db/                  # Auto-created NeDB files and hardcoded courses
├── public/              # Static assets (e.g., style.css)
```

---

## Features

### For Users:
- **Browse Courses and classes**:  
  Users can view a list of available dance courses with details such as description, schedule, location, price, and category and navigate on classes within the course.

- **Book Courses and Classes**:  
  Users can either enrol in a course, which is a collection of classes or book individual classes. They will see the available dates for each class and can confirm their booking.

- **Login/Signup**:  
  Users can register for an account, log in, and securely manage their bookings.

- **Discount on Enrolment**:  
  If a user enrolls in the full course, they receive a 10% discount on each class within that course.

### For Admins:
- **Manage Users**:  
  Admins can view and delete users. This allows better control over the system.

- **Manage Courses and Classes**:  
  Admins can add new courses, edit existing ones, and delete courses. Each course can have multiple classes with specific dates, times, and locations. Aminds can also delete or edit single classes.

- **Manage Organisers**:  
  Admins can manage organisers (responsible for specific courses) by adding or deleting their information.

## Technologies Used
- **Node.js** for server-side functionality.
- **Express.js** for routing and middleware handling.
- **NeDB** for local database management.
- **UUID** for generating unique IDs for classes and bookings.
- **bcrypt** for hashing passwords.

## Security
- Passwords hashed with `bcrypt`
- Access control with session middleware (Week 8)
- Input validation on all forms (Week 7)
- Protected organiser dashboard

---

## Testing
Tested using **Mocha** + **Chai** + **chai-http**:
- Homepage loads
- Course list loads
- 404 error renders correctly

Test results can be verified with:
```bash
npm test
```

---

## Dependencies
- `express`
- `nedb`
- `mustache-express`
- `bcrypt`
- `express-session`
- `body-parser`
- `mocha`, `chai`, `chai-http` (for testing)

---

# Database Structure

## `bookings.db`
Stores booking information for each class.

### Fields:
- **_id** (UUID): Unique identifier for each booking.
- **courseId**: ID of the course the class belongs to.
- **classId**: ID of the class that is being booked.
- **userEmail**: Email of the user who made the booking.
- **bookedAt**: Timestamp when the booking was made.

---

## `courses.db`
Stores course information along with the class details.

### Fields:
- **_id** (UUID): Unique identifier for each course.
- **title**: Name of the course.
- **description**: A short description of the course.
- **category**: Category of the course (e.g., Latin, Jazz).
- **price**: Price of the course.
- **days**: Days the course is held (e.g., Monday, Wednesday).
- **time**: Time slot for the course.
- **startDate & endDate**: The duration of the course.
- **classes**: Array of classes for the course, each containing:
  - **_id** (UUID): Unique class identifier.
  - **courseId**: ID of the associated course.
  - **day**, **date**, **time**, **location**: Class-specific details.

---

## `enrolments.db`
Tracks user enrollments in courses.

### Fields:
- **_id** (UUID): Unique identifier for each enrollment.
- **courseId**: ID of the enrolled course.
- **userEmail**: Email of the enrolled user.

---

## `organisers.db`
Stores organiser details.

### Fields:
- **_id** (UUID): Unique identifier for each organiser.
- **name**: Name of the organiser.
- **role**: Role of the organiser.
- **courses**: Array of courses the organiser manages.

---

## `users.db`
Stores user account information.

### Fields:
- **_id** (UUID): Unique identifier for each user.
- **username**: Username for login.
- **email**: User's email.
- **password**: Hashed password.
- **firstName & lastName**: Personal details of the user.

---

# Routes

### User Routes:
- **/**: Home page
- **/courses**: View all courses
- **/courses/classes/:courseId**: View classes for a specific course
- **/courses/classes/:courseId/booking/:classId**: Book a class

### Admin Routes:
- **/organiser/login**: Login page for the admin
- **/organiser/dashboard**: Admin dashboard
- **/organiser/add-course**: Add a new course
- **/organiser/edit-course/:id**: Edit a course
- **/organiser/delete-course/:id**: Delete a course
- **/organiser/manage-users**: Manage users
- **/organiser/logout**: Logout the admin

---

# Future Improvements

- Add email notifications for bookings and enrollments.
- Improve user authentication and session management.
- Add more detailed error handling and logging.
- Implement a more robust admin interface.
- Improve naming convention.
- Improve coursework editing.
- Assign organisers to Courses and Classes.

---

# Conclusion

This Dance Class Management System provides a comprehensive solution for both users and admins to manage dance courses and classes effectively. With the use of a simple local database, it enables functionality for viewing, enrolling, and booking classes with ease.

## Student Info
**Name:** Giuseppe Perugia  
**ID:** 2129491  
**Module:** Web Application Development 2 (2024/25)

---

## Notes
- No external frameworks or tools used beyond weekly material.
- No use of `nvm`, `jest`, or frontend JS frameworks — consistent with syllabus.

---
