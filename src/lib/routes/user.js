/**
 * Created by andre (http://korve.github.io/) on 27.12.2014
 */

var _ = require('underscore'),
	restify = require('restify'),
	User = require('../db/user'),
	ValidationError = require('../errors/ValidationError');

module.exports = function (container) {
	var server = container.server;

	server.get('/user', function (req, res, next) {
		if (!req.user)
			return res.sendUnauthenticated();

		res.send({
			handle: req.user.handle,
			name: req.user.name,
			imageUrl: req.user.imageUrl
		});
		next();
	});

	server.get('/user/:handle', function (req, res, next) {

		if( ! req.params.handle)
			return next(new restify.errors.ResourceNotFoundError());

		User.findOne({ handle: req.params.handle})
			.exec(function (err, user) {
				if( ! user)
					return next(new restify.errors.ResourceNotFoundError());

				// only send publicly available data
				res.send({
					handle: user.handle,
					imageUrl: user.imageUrl
				});
				next();
			});
	});

	/**
	 * Used for signing up
	 */
	server.post('/user', function (req, res, next) {

		var data = _.pick(req.body, 'name', 'email', 'password');

		var user = new User(data);
		user.save(function (err) {

			if(err)
			{
				res.send(400, new ValidationError("", err.errors));
				return next();
			}

			res.send({
				email: user.email,
				name: user.name,
				handle: user.handle
			});
			next();
		});

	});

	/**
	 * Updating a user
	 */
	server.post('/user/:handle', function (req, res, next) {
		var handle = req.params.handle;

		if (!req.user)
			return res.sendUnauthenticated();

		if(handle !== user.handle)
			return next(new restify.errors.NotAuthorizedError());

		req.user.save(req.body, function (err) {

			res.send({
				handle: user.handle,
				imageUrl: user.imageUrl
			});
			next();
		});
	});

	/**
	 * logout is not needed but encouraged to keep the authToken table
	 * clean
	 */
	//server.get('/user/logout', function (req, res, next) {
	//	if (!req.user || !req.authToken) {
	//		return res.sendUnauthenticated();
	//	}
	//
	//	req.authToken.remove();
	//	res.send();
	//	next();
	//});
};