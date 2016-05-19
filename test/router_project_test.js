const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const request = chai.request;
const mongoose = require('mongoose');
const port = process.env.PORT = 1234;
process.env.MONGODB_URI = 'mongodb://localhost/project_test_db';
process.env.APP_SECRET = 'mysecret';
const server = require(__dirname + '/../server');
const Project = require(__dirname + '/../models/project');

describe('the server', () => {
  before((done) => {
    server.listen(port, () => {
      done();
    });
  });
  after((done) => {
    server.close(() => {
      done();
    });
  });
  describe('The POST method', () => {
    before((done) => {
      request('localhost:' + port)
      .post('/api/signup')
      .send({ username: 'test', password: 'test' })
      .end((err, res) => {
        if (err) throw err;
        this.newToken = res.body.token;
        done();
      });
    });
    after((done) => {
      mongoose.connection.db.dropDatabase(() => {
        done();
      });
    });
    it('should create a project', (done) => {
      request('localhost:' + port)
      .post('/api/projects')
      .set({ 'token': this.newToken })
      .send({
        name: 'project test',
        author: 'tester testerson',
        authorUrl: 'www.tests.com',
        body: 'I like tests',
        img: 'test.jpg'
      })
      .end((err, res) => {
        expect(err).to.eql(null);
        expect(res.body.name).to.eql('project test');
        expect(res.body.author).to.eql('tester testerson');
        expect(res.body.authorUrl).to.eql('www.tests.com');
        expect(res.body.body).to.eql('I like tests');
        expect(res.body.img).to.eql('test.jpg');
        done();
      });
    });
  });

  describe('The GET method', () => {
    it('should get all the project', (done) => {
      request('localhost:' + port)
      .get('/api/projects')
      .end((err, res) => {
        expect(err).to.eql(null);
        expect(Array.isArray(res.body)).to.eql(true);
        expect(res.body.length).to.eql(0);
        done();
      });
    });
  });

  describe('routes that need projects in the DB', () => {
    beforeEach((done) => {
      request('localhost:' + port)
      .post('/api/signup')
      .send({ username: 'test', password: 'test' })
      .end((err, res) => {
        if (err) throw err;
        this.newToken = res.body.token;
        done();
      });
    });
    beforeEach((done) => {
      var newProject = new Project({
        name: 'project test',
        author: 'tester testerson',
        authorUrl: 'www.tests.com',
        body: 'I like tests',
        img: 'test.jpg'
      });
      newProject.save((err, data) => {
        if (err) console.log(err);
        this.project = data;
        done();
      });
    });
    afterEach((done) => {
      this.project.remove((err) => {
        if (err) console.log(err);
        done();
      });
    });
    after((done) => {
      mongoose.connection.db.dropDatabase(() => {
        done();
      });
    });

    it('should change the project\'s indentity on a PUT request', (done) => {
      request('localhost:' + port)
      .put('/api/projects/' + this.project._id)
      .set({ 'token': this.newToken })
      .send({
        name: 'project test 2',
        author: 'tester testerson 2',
        authorUrl: 'www.tests.com 2',
        body: 'I like tests 2',
        img: 'test2.jpg'
      })
      .end((err, res) => {
        expect(err).to.eql(null);
        expect(res.body.msg).to.eql('update made!');
        done();
      });
    });

    it('should remove the project on a DELETE request', (done) => {
      request('localhost:' + port)
      .delete('/api/projects/' + this.project._id)
      .set({ 'token': this.newToken })
      .end((err, res) => {
        expect(err).to.eql(null);
        expect(res.body.msg).to.eql('project deleted!');
        done();
      });
    });

    describe('server error', () => {
      it('should err on a bad request', (done) => {
        request('localhost:' + port)
        .get('/badroute')
        .end((err, res) => {
          expect(err).to.not.eql(null);
          expect(res.text).to.eql('Error 404 File not found');
          done();
        });
      });
    });
  });
});
