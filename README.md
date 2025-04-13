# Dance Class Booking System

A full-stack web application built for the Practical Coursework of Web Application Development 2. This system allows users to browse and enrol in dance courses, while organisers can manage courses and view enrolments.

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
- Node.js v18.x (used in class)

### Install and run:
```bash
npm install
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

### Public Users:
- View available dance courses
- Enrol via login (username + password + password confirmation)

### Organisers:
- Login securely
- Add/edit/delete courses
- View enrolment list per course

---

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

## Student Info
**Name:** Giuseppe Perugia  
**ID:** 2129491  
**Module:** Web Application Development 2 (2024/25)

---

## Notes
- No external frameworks or tools used beyond weekly material.
- No use of `nvm`, `jest`, or frontend JS frameworks — consistent with syllabus.

---

_This project is submitted for academic purposes only._