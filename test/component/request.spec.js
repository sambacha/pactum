const pactum = require('../../src/index');
const request = pactum.request;
const config = require('../../src/config');
const expect = require('chai').expect;

describe('Request', () => {

  it('with baseurl', async () => {
    request.setBaseUrl('http://localhost:9393');
    await pactum.spec()
      .useMockInteraction({
        withRequest: {
          method: 'GET',
          path: '/users'
        },
        willRespondWith: {
          status: 200
        }
      })
      .get('/users')
      .expectStatus(200);
  });

  it('with baseurl override', async () => {
    request.setBaseUrl('http://localhost:9392');
    await pactum.spec()
      .useMockInteraction({
        withRequest: {
          method: 'GET',
          path: '/users'
        },
        willRespondWith: {
          status: 200
        }
      })
      .get('http://localhost:9393/users')
      .expectStatus(200);
  });

  it('with default header', async () => {
    request.setBaseUrl('http://localhost:9393');
    request.setDefaultHeaders('x', 'a');
    await pactum.spec()
      .useMockInteraction({
        withRequest: {
          method: 'GET',
          path: '/users',
          headers: {
            'x': 'a'
          }
        },
        willRespondWith: {
          status: 200
        }
      })
      .get('http://localhost:9393/users')
      .expectStatus(200);
  });

  it('with override default header to empty value', async () => {
    request.setBaseUrl('http://localhost:9393');
    request.setDefaultHeaders('x', 'a');
    await pactum.spec()
      .useMockInteraction({
        withRequest: {
          method: 'GET',
          path: '/users',
          headers: {
            'x': ''
          }
        },
        willRespondWith: {
          status: 200
        }
      })
      .get('http://localhost:9393/users')
      .withHeaders('x', '')
      .expectStatus(200);
  });

  it('with override default header', async () => {
    request.setBaseUrl('http://localhost:9393');
    request.setDefaultHeaders('x', 'a');
    await pactum.spec()
      .useMockInteraction({
        withRequest: {
          method: 'GET',
          path: '/users',
          headers: {
            'x': 'b'
          }
        },
        willRespondWith: {
          status: 200
        }
      })
      .get('http://localhost:9393/users')
      .withHeaders('x', 'b')
      .expectStatus(200);
  });

  afterEach(() => {
    config.request.baseUrl = '';
    config.request.headers = {};
  });

});