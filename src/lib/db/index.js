/**
 * Created by andre (http://korve.github.io/) on 27.12.2014
 */

var util = require('util');
var q = require('q');
var extend = require('extend');
var mongoose = require('mongoose');

module.exports.init = function (container) {
	var defaults = {
		host: 'localhost',
		port: '27017',
		name: null
	};
	container.options.db = extend(defaults, container.options.db);

	if(!container.options.db)
		throw new Error('\'db\' option is required for db.init()');

	var connStr = util.format('mongodb://%s:%d/%s',
		container.options.db.host,
		container.options.db.port,
		container.options.db.name
	);
	mongoose.connect(connStr);

	return q.when(mongoose.connection)
		.then(function (conn) {
			return q.promise(function (resolve, reject) {
				conn.on('error', function (err) {
					reject(err);
				});
				conn.once('open', function () {
					resolve(conn);
				});
			});
		})
		.then(function (conn) {
			// add db property to server to make it globally accessible
			container.db = conn;
			return container;
		});
};

module.exports.close = function () {
	return q.promise(function (resolve, reject) {
		mongoose.disconnect(function (err) {
			if(err) return reject(err);
			resolve();
		});
	})
};