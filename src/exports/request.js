const form = require('form-data');

const config = require('../config');
const helper = require('../helpers/helper');
const { PactumRequestError } = require('../helpers/errors');

const records = [];

const request = {

  FormData: form,

  setDefaultHeaders(key, value) {
    if (!key) {
      throw new PactumRequestError(`Invalid header key provided - ${key}`);
    }
    if (typeof key === 'string') {
      config.request.headers[key] = value;
    } else {
      if (!helper.isValidObject(key)) {
        throw new PactumRequestError(`Invalid headers provided - ${key}`);
      }
      Object.assign(config.request.headers, key);
    }
  },

  setDefaultTimeout(timeout) {
    if (typeof timeout !== 'number') {
      throw new PactumRequestError(`Invalid timeout provided - ${timeout}`);
    }
    config.request.timeout = timeout;
  },

  setBaseUrl(url) {
    if (typeof url !== 'string') {
      throw new PactumRequestError(`Invalid base url provided - ${url}`);
    }
    config.request.baseUrl = url;
  },

  removeDefaultHeader(key) {
    if (!key) {
      throw new PactumRequestError(`Invalid header key provided - ${key}`);
    }
    delete config.request.headers[key];
  },

  removeDefaultHeaders() {
    config.request.headers = {};
  },

  setDefaultRecorders(name, src, path) {
    records.push({ name, src, path });
  },

  getDefaultRecorders() {
    return records;
  }

};

module.exports = request;