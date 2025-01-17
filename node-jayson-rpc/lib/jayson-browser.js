'use strict';

const extend = require('lodash/extend');
const isArray = require('lodash/isArray');
const isFunction = require('lodash/isFunction');
const isObject = require('lodash/isObject');
const isUndefined = require('lodash/isUndefined');
const negate = require('lodash/negate');
const uuid = require('uuid/v4');
const generateRequest = require('../generateRequest');

/**
 *  Constructor for a Jayson Browser Client that does not depend any node.js core libraries
 *  @class ClientBrowser
 *  @param {Function} callServer Method that calls the server, receives the stringified request and a regular node-style callback
 *  @param {Object} [options]
 *  @param {Function} [options.reviver] Reviver function for JSON
 *  @param {Function} [options.replacer] Replacer function for JSON
 *  @param {Number} [options.version=2] JSON-RPC version to use (1|2)
 *  @param {Function} [options.generator] Function to use for generating request IDs
 *  @return {ClientBrowser}
 */
const ClientBrowser = function (callServer, options) {
    if (!(this instanceof ClientBrowser)) {
        return new ClientBrowser(callServer, options);
    }

    const defaults = {
        reviver: null,
        replacer: null,
        generator: function () { return uuid(); },
        version: 2
    };

    this.options = extend(defaults, options || {});
    this.callServer = callServer;
};

module.exports = ClientBrowser;

/**
 *  Creates a request and dispatches it if given a callback.
 *  @param {String|Array} method A batch request if passed an Array, or a method name if passed a String
 *  @param {Array|Object} [params] Parameters for the method
 *  @param {String|Number} [id] Optional id. If undefined an id will be generated. If null it creates a notification request
 *  @param {Function} [callback] Request callback. If specified, executes the request rather than only returning it.
 *  @throws {TypeError} Invalid parameters
 *  @return {Object} JSON-RPC 1.0 or 2.0 compatible request
 */
ClientBrowser.prototype.request = function (method, params, id, callback) {
    const self = this;
    let request = null;

    // is this a batch request?
    const isBatch = isArray(method) && isFunction(params);

    if (this.options.version === 1 && isBatch) {
        throw new TypeError('JSON-RPC 1.0 does not support batching');
    }

    // is this a raw request?
    const isRaw = !isBatch && method && isObject(method) && isFunction(params);

    if (isBatch || isRaw) {
        callback = params;
        request = method;
    } else {
        if (isFunction(id)) {
            callback = id;
            // specifically undefined because "null" is a notification request
            id = undefined;
        }

        const hasCallback = isFunction(callback);

        try {
            request = generateRequest(method, params, id, {
                generator: this.options.generator,
                version: this.options.version
            });
        } catch (err) {
            if (hasCallback) {
                return callback(err);
            }
            throw err;
        }

        // no callback means we should just return a raw request
        if (!hasCallback) {
            return request;
        }

    }

    let message;
    try {
        message = JSON.stringify(request, this.options.replacer);
    } catch (err) {
        return callback(err);
    }

    this.callServer(message, function (err, response) {
        self._parseResponse(err, response, callback);
    });

    // always return the raw request
    return request;
};

/**
 * Parses a response from a server
 * @param {Object} err Error to pass on that is unrelated to the actual response
 * @param {String} responseText JSON-RPC 1.0 or 2.0 response
 * @param {Function} callback Callback that will receive different arguments depending on the amount of parameters
 * @private
 */
ClientBrowser.prototype._parseResponse = function (err, responseText, callback) {
    if (err) {
        callback(err);
        return;
    }

    if (!responseText) {
        // empty response text, assume that is correct because it could be a
        // notification which jayson does not give any body for
        return callback();
    }

    let response;
    try {
        response = JSON.parse(responseText, this.options.reviver);
    } catch (err) {
        return callback(err);
    }

    if (callback.length === 3) {
        // if callback length is 3, we split callback arguments on error and response

        // is batch response?
        if (isArray(response)) {

            // neccesary to split strictly on validity according to spec here
            const isError = function (res) { return !isUndefined(res.error); };

            return callback(null, response.filter(isError), response.filter(negate(isError)));

        } else {

            // split regardless of validity
            return callback(null, response.error, response.result);

        }

    }

    callback(null, response);
};
