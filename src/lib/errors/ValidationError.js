/**
 * Created by andre (http://korve.github.io/) on 29.12.2014
 */

var restify = require('restify');
var util = require('util');

function ValidationError(message, errors) {
	restify.RestError.call(this, {
		restCode: 'ValidationError',
		statusCode: 400,
		message: message,
		constructorOpt: ValidationError
	});
	this.name = 'ValidationError';
	this.body.errors = errors; //<--- notice this line
}

util.inherits(ValidationError, restify.RestError);

module.exports = ValidationError;