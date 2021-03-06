const expect = require('chai').expect;
const pactum = require('../../src/index');
const handler = pactum.handler;
const reporter = pactum.reporter;
const jr = require('../../src/plugins/json.reporter');

describe('E2E', () => {

  before(() => {
    jr.reset();
    handler.addMockInteractionHandler('get user', () => {
      return {
        withRequest: {
          method: 'GET',
          path: '/api/users/1'
        },
        willRespondWith: {
          status: 200,
          body: {
            id: 1
          }
        }
      }
    });
    handler.addMockInteractionHandler('save user', () => {
      return {
        withRequest: {
          method: 'POST',
          path: '/api/users'
        },
        willRespondWith: {
          status: 200
        }
      }
    });
    handler.addMockInteractionHandler('delete user', () => {
      return {
        withRequest: {
          method: 'DELETE',
          path: '/api/users/1'
        },
        willRespondWith: {
          status: 200
        }
      }
    });
    handler.addSpecHandler('User.AddUser', (ctx) => {
      const spec = ctx.spec;
      spec.useMockInteraction('save user');
      spec.post('http://localhost:9393/api/users');
      spec.expectStatus(200);
    });
    handler.addSpecHandler('User.DeleteUser', (ctx) => {
      const spec = ctx.spec;
      spec.useMockInteraction('delete user');
      spec.delete('http://localhost:9393/api/users/1');
      spec.expectStatus(200);
    });
    handler.addSpecHandler('User.GetUser', (ctx) => {
      const spec = ctx.spec;
      spec.useMockInteraction('get user');
      spec.get('http://localhost:9393/api/users/1');
      spec.expectStatus(200);
    });
    reporter.enableJsonReporter();
  });

  describe('E2E - All Passed', () => {

    before(() => {
      this.e2e = pactum.e2e('Add User All Passed');
    });

    it('save user', async () => {
      await this.e2e.step('Save User')
        .spec()
        .useMockInteraction('save user')
        .post('http://localhost:9393/api/users')
        .expectStatus(200)
        .clean()
        .useMockInteraction('delete user')
        .delete('http://localhost:9393/api/users/1')
        .expectStatus(200);
    });

    it('get user', async () => {
      await this.e2e.step('Get User')
        .spec()
        .useMockInteraction('get user')
        .get('http://localhost:9393/api/users/1')
        .expectStatus(200);
    });

    it('clean up', async () => {
      await this.e2e.cleanup();
    });

  });

  describe('E2E - First Step Failed', () => {

    before(() => {
      this.e2e = pactum.e2e('Add User First Step Failed');
    });

    it('save user', async () => {
      let err;
      try {
        await this.e2e.step('Save User')
          .spec()
          .useMockInteraction('save user')
          .post('http://localhost:9393/api/users')
          .expectStatus(400)
          .clean()
          .useMockInteraction('delete user')
          .delete('http://localhost:9393/api/users/1')
          .expectStatus(200);
      } catch (error) {
        err = error;
      }
      expect(err).not.undefined;
    });

    it('should skip this `e2e.step`', async () => {
      await this.e2e.step('Get User')
        .spec()
        .useMockInteraction('get user')
        .get('http://localhost:9393/api/users/1')
        .expectStatus(400);
    });

    it('clean up', async () => {
      await this.e2e.cleanup();
    });

  });

  describe('E2E - One Clean Up Failed', () => {

    before(() => {
      this.e2e = pactum.e2e('Add Multiple Users');
    });

    it('save user one', async () => {
      await this.e2e.step('Save User One')
        .spec()
        .useMockInteraction('save user')
        .post('http://localhost:9393/api/users')
        .expectStatus(200)
        .clean()
        .useMockInteraction('delete user')
        .delete('http://localhost:9393/api/users/1')
        .expectStatus(200);
    });

    it('save user two', async () => {
      await this.e2e.step('Save User One')
        .spec()
        .useMockInteraction('save user')
        .post('http://localhost:9393/api/users')
        .expectStatus(200)
        .clean()
        .useMockInteraction('delete user')
        .delete('http://localhost:9393/api/users/1')
        .expectStatus(400);
    });

    it('get user', async () => {
      await this.e2e.step('Get User')
        .spec()
        .useMockInteraction('get user')
        .get('http://localhost:9393/api/users/1')
        .expectStatus(200);
    });

    it('clean up', async () => {
      let err;
      try {
        await this.e2e.cleanup();
      } catch (error) {
        err = error;
      }
      expect(err).not.undefined;
    });

  });

  describe('E2E - All Clean Ups Failed', () => {

    before(() => {
      this.e2e = pactum.e2e('Add Multiple Users');
    });

    it('save user one', async () => {
      await this.e2e.step('Save User One')
        .spec()
        .useMockInteraction('save user')
        .post('http://localhost:9393/api/users')
        .expectStatus(200)
        .clean()
        .useMockInteraction('delete user')
        .delete('http://localhost:9393/api/users/1')
        .expectStatus(400);
    });

    it('save user two', async () => {
      await this.e2e.step('Save User Two')
        .spec()
        .useMockInteraction('save user')
        .post('http://localhost:9393/api/users')
        .expectStatus(200)
        .clean()
        .useMockInteraction('delete user')
        .delete('http://localhost:9393/api/users/1')
        .expectStatus(400);
    });

    it('get user', async () => {
      await this.e2e.step('Get User')
        .spec()
        .useMockInteraction('get user')
        .get('http://localhost:9393/api/users/1')
        .expectStatus(200);
    });

    it('clean up', async () => {
      let err;
      try {
        await this.e2e.cleanup();
      } catch (error) {
        err = error;
      }
      expect(err).not.undefined;
    });

  });

  describe('E2E - Using Spec Handlers', () => {

    before(() => {
      this.e2e = pactum.e2e('Add User All Clean Ups Failed');
    });

    it('save user', async () => {
      await this.e2e
        .step('Save User')
        .spec('User.AddUser')
        .clean('User.DeleteUser');
    });

    it('get user', async () => {
      await this.e2e
        .step('Get User')
        .spec('User.GetUser');
    });

    it('clean up', async () => {
      await this.e2e.cleanup();
    });

  });

  describe('E2E - Multiple Specs in a single Step', () => {

    before(() => {
      this.e2e = pactum.e2e('Add User Multiple Specs');
    });

    it('save & get & delete user', async () => {
      const step = this.e2e.step('User Workflow');
      await step.spec('User.AddUser');
      await step.spec('User.GetUser');
      await step.spec('User.DeleteUser');
    });

  });

  describe('E2E - Multiple Specs in a single Step & a clean', () => {

    before(() => {
      this.e2e = pactum.e2e('Add User Single Step & Clean');
    });

    it('save & get & delete user', async () => {
      const step = this.e2e.step('User Workflow');
      await step.spec('User.AddUser');
      await step.spec('User.GetUser');
      await step.clean('User.DeleteUser');
    });

    it('cleanup', async () => {
      await this.e2e.cleanup();
    });

  });

  describe('E2E - One step fails in a step', () => {

    before(() => {
      this.e2e = pactum.e2e('Add User One Step Fails');
    });

    it('save & get & delete user', async () => {
      let err;
      try {
        const step = this.e2e.step('User Workflow');
        await step.spec('User.AddUser');
        await step.spec('User.GetUser').expectStatus(400);
        await step.spec('User.DeleteUser');
      } catch (error) {
        err = error;
      }
      expect(err).not.undefined;
    });

    it('should skip this `e2e.step`', async () => {
      const step = this.e2e.step('User Workflow');
      await step.spec('User.AddUser');
      await step.spec('User.GetUser').expectStatus(400);
      step.clean('User.DeleteUser');
    });

    it('cleanup', async () => {
      await this.e2e.cleanup();
    });

  });

  after(() => {
    reporter.end();
    reporter.get().length = 0;
  });

});