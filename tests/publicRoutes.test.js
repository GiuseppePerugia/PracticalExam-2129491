// tests/publicRoutes.test.js
// Based on Week 6: Mocha + Chai HTTP
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app'); // Assumes app exports the Express instance

chai.use(chaiHttp);
const expect = chai.expect;

// Sample public route tests
describe('Public Routes', () => {

  it('should load the home page', (done) => {
    chai.request(app)
      .get('/')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.text).to.include('Welcome');
        done();
      });
  });

  it('should load the course list page', (done) => {
    chai.request(app)
      .get('/courses')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.text).to.include('Dance Courses');
        done();
      });
  });

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