/**
 * Created by andre (http://korve.github.io/) on 27.12.2014
 */
var q = require('q');
var restify = require('restify');
var extend = require('extend');
var auth = require('./auth');
var routes = require('./routes');
var db = require('./db');

module.exports.create = function (options) {

	var defaults = {
		auth: {
			expires: 3600 * 24,
			tokenEndpoint: '/token',
			wwwAuthenticateRealm: '180.io secure',
			clients: {
				official: { secret: 'Vtz5USZekdTt9Jul' }
			}
		},
		db: {
			name:	'180io'
		},
		restify: {
			name: '',
			version: require("../../package.json").version
		}
	};
	options = extend(true, defaults, options);

	var container = {};
	container.options = options;
	container.server = restify.createServer(container.options.restify);

	// TODO add trusted domains for CORS
	container.server.use(restify.authorizationParser());
	container.server.pre(restify.acceptParser(container.server.acceptable));
	container.server.use(restify.queryParser());
	container.server.use(restify.bodyParser({
		mapParams: false
	}));

	restify.CORS.ALLOW_HEADERS.push('accept');
	restify.CORS.ALLOW_HEADERS.push('sid');
	restify.CORS.ALLOW_HEADERS.push('lang');
	restify.CORS.ALLOW_HEADERS.push('origin');
	restify.CORS.ALLOW_HEADERS.push('withcredentials');
	restify.CORS.ALLOW_HEADERS.push('x-requested-with');
	restify.CORS.ALLOW_HEADERS.push('authorization');

	container.server.use(restify.CORS());
	container.server.use(restify.fullResponse());

	return db.init(container)
			.then(auth.configure)
			.then(routes.configure)
			.then(function () {
				container.server.on('listening', function () {
					console.log('%s listening at %s\n', container.server.name, container.server.url);
				});

				container.server.on('close', function () {
					console.log('%s closed\n', container.server.name);
					db.close().done();
				});

				return container.server;
			});
};