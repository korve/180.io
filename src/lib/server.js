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
			'host': 'localhost',
			'db':	'180io'
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
	container.server.pre(restify.acceptParser(container.server.acceptable));
	container.server.use(restify.queryParser());
	container.server.use(restify.bodyParser({
		mapParams: false
	}));
	container.server.use(restify.authorizationParser());

	restify.CORS.ALLOW_HEADERS.push('accept');
	restify.CORS.ALLOW_HEADERS.push('sid');
	restify.CORS.ALLOW_HEADERS.push('lang');
	restify.CORS.ALLOW_HEADERS.push('origin');
	restify.CORS.ALLOW_HEADERS.push('withcredentials');
	restify.CORS.ALLOW_HEADERS.push('x-requested-with');
	restify.CORS.ALLOW_HEADERS.push('authorization');

	container.server.use(restify.CORS());
	container.server.use(restify.fullResponse());

	//function unknownMethodHandler(req, res) {
	//	if (req.method.toLowerCase() === 'options') {
	//		var allowHeaders = ['Accept', 'Accept-Version', 'Content-Type', 'Api-Version', 'Origin', 'X-Requested-With', 'Authorization'];
	//
	//		if (res.methods.indexOf('OPTIONS') === -1) res.methods.push('OPTIONS');
	//
	//		res.header('Access-Control-Allow-Credentials', true);
	//		res.header('Access-Control-Allow-Headers', allowHeaders.join(', '));
	//		res.header('Access-Control-Allow-Methods', res.methods.join(', '));
	//		res.header('Access-Control-Allow-Origin', req.headers.origin);
	//
	//		return res.send(204);
	//	}
	//	else
	//		return res.send(new restify.MethodNotAllowedError());
	//}
	//
	//container.server.on('MethodNotAllowed', unknownMethodHandler);

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