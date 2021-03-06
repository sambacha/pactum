const phin = require('phin');
const jqy = require('json-query');
const config = require('../config');
const helper = require('../helpers/helper');
const processor = require('../helpers/dataProcessor');
const log = require('../helpers/logger');
const mock = require('../exports/mock');
const handler = require('../exports/handler');
const stash = require('../exports/stash');
const reporter = require('../exports/reporter');
const request = require('../exports/request');

class Tosser {

  constructor(spec) {
    this.spec = spec;
    this.request = spec._request;
    this.state = spec._state;
    this.expect = spec._expect;
    this.stores = spec._stores;
    this.returns = spec._returns;
    this.recorders = spec._recorders;
    this.mockInteractions = spec.mockInteractions;
    this.pactInteractions = spec.pactInteractions;
    this.previousLogLevel = spec.previousLogLevel;
    this.response = {};
    this.mockIds = [];
    this.pactIds = [];
  }

  async toss() {
    this.spec.start = Date.now().toString();
    this.updateRequest();
    await this.setState()
    await this.addInteractionsToServer();
    await this.setResponse();
    await this.sleep(this.spec._waitDuration);
    this.setPreviousLogLevel();
    await this.removeInteractionsFromServer();
    this.recordData();
    this.validate();
    this.storeSpecData();
    return this.getOutput();
  }

  updateRequest() {
    processor.processMaps();
    processor.processTemplates();
    this.request = processor.processData(this.request);
    const query = helper.getPlainQuery(this.request.qs);
    if (query) {
      this.request.url = this.request.url + '?' + query;
    }
    setBaseUrl(this.request);
    this.request.timeout = this.request.timeout || config.request.timeout;
    setHeaders(this.request);
    setMultiPartFormData(this.request);
  }

  setState() {
    return this.state.set(this.spec);
  }

  async addInteractionsToServer() {
    const mockIdPromises = [];
    const pactIdPromises = [];
    for (let i = 0; i < this.mockInteractions.length; i++) {
      const raw = this.mockInteractions[i];
      mockIdPromises.push(mock.addMockInteraction(raw.interaction, raw.data));
    }
    for (let i = 0; i < this.pactInteractions.length; i++) {
      const raw = this.pactInteractions[i];
      pactIdPromises.push(mock.addPactInteraction(raw.interaction, raw.data));
    }
    this.mockIds = this.mockIds.concat(await Promise.all(mockIdPromises));
    this.pactIds = this.pactIds.concat(await Promise.all(pactIdPromises));
  }

  async setResponse() {
    this.response = await getResponse(this.request);
    const retryOptions = this.request.retryOptions;
    if (retryOptions) {
      const { count, delay, strategy } = retryOptions;
      let retry = false;
      for (let i = 0; i < count; i++) {
        if (typeof strategy === 'function') {
          retry = strategy(this.request, this.response);
        }
        if (typeof strategy === 'string') {
          const handlerFun = handler.getRetryHandler(strategy);
          const ctx = { req: this.request, res: this.response };
          retry = handlerFun(ctx);
        }
        if (retry) {
          await helper.sleep(delay);
          this.response = await getResponse(this.request);
        } else {
          break;
        }
      }
    }
    this.spec._response = this.response;
  }

  setPreviousLogLevel() {
    if (this.previousLogLevel) {
      log.setLevel(this.previousLogLevel);
    }
  }

  recordData() {
    const defaultRecorders = request.getDefaultRecorders();
    defaultRecorders.forEach(recorder => { recordData(recorder, this.spec) });
    this.recorders.forEach(recorder => { recordData(recorder, this.spec) });
  }

  async removeInteractionsFromServer() {
    if (this.mockIds.length > 0) {
      this.mockInteractions.length = 0;
      this.mockInteractions = this.mockInteractions.concat(await mock.getInteraction(this.mockIds));
      await mock.removeInteraction(this.mockIds);
    }
    if (this.pactIds.length > 0) {
      this.pactInteractions.length = 0;
      this.pactInteractions = this.pactInteractions.concat(await mock.getInteraction(this.pactIds));
      await mock.removeInteraction(this.pactIds);
    }
  }

  validate() {
    this.validateError();
    try {
      this.validateInteractions();
      this.validateResponse();
      this.spec.status = 'PASSED';
      helper.afterSpecReport(this.spec, reporter);
    } catch (error) {
      this.spec.status = 'FAILED';
      this.spec.failure = error.toString();
      helper.afterSpecReport(this.spec, reporter);
      const res = {
        statusCode: this.response.statusCode,
        headers: this.response.headers,
        body: this.response.json
      }
      log.warn('Request', this.request);
      log.warn('Response', res);
      throw error;
    }
  }

  validateError() {
    if (this.response instanceof Error) {
      this.spec.status = 'ERROR';
      this.spec.failure = this.response.toString();
      helper.afterSpecReport(this.spec, reporter);
      this.expect.fail(this.response);
    }
  }

  validateInteractions() {
    this.expect.validateInteractions(this.mockInteractions);
    this.expect.validateInteractions(this.pactInteractions);
  }

  validateResponse() {
    this.expect.validate(this.request, this.response);
  }

  storeSpecData() {
    for (let i = 0; i < this.stores.length; i++) {
      const store = this.stores[i];
      const specData = {};
      specData[store.name] = getPathValueFromSpec(store.path, this.spec);
      stash.addDataStore(specData);
    }
  }

  sleep(ms) {
    if (typeof ms === 'number') {
      return helper.sleep(ms);
    }
  }

  getOutput() {
    const outputs = [];
    for (let i = 0; i < this.returns.length; i++) {
      const _handler = this.returns[i];
      const ctx = { req: this.request, res: this.response };
      if (typeof _handler === 'function') {
        outputs.push(_handler(ctx));
      }
      if (typeof _handler === 'string') {
        const _customHandlerFun = handler.getReturnHandler(_handler);
        if (_customHandlerFun) {
          outputs.push(_customHandlerFun(ctx));
        } else {
          outputs.push(getPathValueFromSpec(_handler, this.spec));
        }
      }
    }
    if (outputs.length === 1) {
      return outputs[0];
    } else if (outputs.length > 1) {
      return outputs;
    } else {
      return this.response;
    }
  }

}

function setBaseUrl(request) {
  if (config.request.baseUrl && !request.url.startsWith('http')) {
    request.url = config.request.baseUrl + request.url;
  }
}

function setHeaders(request) {
  if (Object.keys(config.request.headers).length > 0) {
    if (!request.headers) {
      request.headers = {};
    }
    for (const prop in config.request.headers) {
      if (prop in request.headers) {
        continue;
      } else {
        request.headers[prop] = config.request.headers[prop];
      }
    }
  }
}

function setMultiPartFormData(request) {
  if (request._multiPartFormData) {
    request.data = request._multiPartFormData.getBuffer();
    const multiPartHeaders = request._multiPartFormData.getHeaders();
    if (!request.headers) {
      request.headers = multiPartHeaders;
    } else {
      for (const prop in multiPartHeaders) {
        request.headers[prop] = multiPartHeaders[prop];
      }
    }
    delete request._multiPartFormData;
  }
}

async function getResponse(req) {
  let res = {};
  const requestStartTime = Date.now();
  try {
    log.debug(`${req.method} ${req.url}`);
    res = await phin(req);
    res.json = helper.getJson(res.body);
  } catch (error) {
    log.warn('Error performing request', error);
    res = error;
  }
  res.responseTime = Date.now() - requestStartTime;
  return res;
}

function recordData(recorder, spec) {
  try {
    let { name, path } = recorder;
    spec.recorded[name] = getPathValueFromSpec(path, spec);
  } catch (error) {
    log.warn('Unable to record data');
    log.warn(error.toString());
  }
}

function getPathValueFromSpec(path, spec) {
  let data;
  if (path.startsWith('req.headers')) {
    path = path.replace('req.headers', '');
    data = spec._request.headers;
  } else if (path.startsWith('req.body')) {
    path = path.replace('req.body', '');
    data = spec._request.data;
  } else if (path.startsWith('res.headers')) {
    path = path.replace('res.headers', '');
    data = spec._response.headers;
  } else {
    path = path.replace('res.body', '');
    data = spec._response.json;
  }
  return jqy(path, { data }).value;
}

module.exports = Tosser;