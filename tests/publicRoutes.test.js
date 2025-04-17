const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app'); // Assuming app.js is exporting your Express instance

chai.use(chaiHttp);
const expect = chai.expect;

describe('Public Routes', () => {
  
  // Test Home Page
  it('should load the home page', (done) => {
    chai.request(app)
      .get('/')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.text).to.include('Welcome');
        done();
      });
  });

  // Test Courses Page
  it('should load the courses page', (done) => {
    chai.request(app)
      .get('/courses')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.text).to.include('Dance Courses');
        done();
      });
  });

  // Test 404 for an unknown page
  it('should return 404 for unknown pages', (done) => {
    chai.request(app)
      .get('/not-a-real-page')
      .end((err, res) => {
        expect(res).to.have.status(404);
        expect(res.text).to.include('Page Not Found');
        done();
      });
  });

});