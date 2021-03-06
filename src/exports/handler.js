const { PactumHandlerError } = require('../helpers/errors');
const config = require('../config');

const specHandlers = {};
const expectHandlers = {};
const retryHandlers = {};
const returnHandlers = {};
const stateHandlers =  {};
const dataHandlers = {};
const mockInteractionHandlers = {};
const pactInteractionHandlers = {};
const assertHandlers = {};

const handler = {

  addSpecHandler(name, func) {
    isValidHandler(name, func);
    specHandlers[name] = func;
  },

  getSpecHandler(name) {
    if (specHandlers[name]) return specHandlers[name];
    throw new PactumHandlerError(`Spec Handler Not Found - '${name}'`);
  },

  addExpectHandler(name, func) {
    isValidHandler(name, func);
    expectHandlers[name] = func;
  },

  getExpectHandler(name) {
    if (expectHandlers[name]) return expectHandlers[name];
    throw new PactumHandlerError(`Expect Handler Not Found - '${name}'`);
  },

  addRetryHandler(name, func) {
    isValidHandler(name, func);
    retryHandlers[name] = func;
  },

  getRetryHandler(name) {
    if (retryHandlers[name]) return retryHandlers[name];
    throw new PactumHandlerError(`Retry Handler Not Found - '${name}'`);
  },

  addReturnHandler(name, func) {
    isValidHandler(name, func);
    returnHandlers[name] = func;
  },

  getReturnHandler(name) {
    return returnHandlers[name];
  },

  addStateHandler(name, func) {
    isValidHandler(name, func);
    stateHandlers[name] = func;
  },

  getStateHandler(name) {
    if (stateHandlers[name]) return stateHandlers[name];
    throw new PactumHandlerError(`State Handler Not Found - '${name}'`);
  },

  addDataFunHandler(name, func) {
    isValidHandler(name, func);
    dataHandlers[name] = func;
    config.data.ref.fun.enabled = true;
  },

  getDataFunHandler(name) {
    if (dataHandlers[name]) return dataHandlers[name];
    throw new PactumHandlerError(`Data Handler Not Found - '${name}'`);
  },

  addMockInteractionHandler(name, func) {
    isValidHandler(name, func);
    mockInteractionHandlers[name] = func;
  },

  getMockInteractionHandler(name) {
    if (mockInteractionHandlers[name]) return mockInteractionHandlers[name];
    throw new PactumHandlerError(`Mock Interaction Handler Not Found - '${name}'`);
  },

  addPactInteractionHandler(name, func) {
    isValidHandler(name, func);
    pactInteractionHandlers[name] = func;
  },

  getPactInteractionHandler(name) {
    if (pactInteractionHandlers[name]) return pactInteractionHandlers[name];
    throw new PactumHandlerError(`Pact Interaction Handler Not Found - '${name}'`);
  },

  addAssertHandler(name, func) {
    isValidHandler(name, func);
    assertHandlers[name] = func;
  },

  getAssertHandler(name) {
    if (assertHandlers[name]) return assertHandlers[name];
    throw new PactumHandlerError(`Assert Handler Not Found - '${name}'`);
  }

}

function isValidHandler(name, func) {
  if (typeof name !== 'string' || name === '') {
    throw new PactumHandlerError('`name` is required');
  }
  if (typeof func !== 'function') {
    throw new PactumHandlerError('`func` is required');
  }
}

module.exports = handler;