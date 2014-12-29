/**
 * Created by andre (http://korve.github.io/) on 27.12.2014
 */

var restify = require('restify'),
	User = require('../db/user');

module.exports = function (container) {
	var server = container.server;

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
	server.post('/user/:handle', function (req, res, next) {
		var handle = req.params.handle;

		User.findOne({ handle: handle })
			.exec(function (err, user) {
				if (user !== null)
				{
					/**
					 * Update user.
					 * Only allowed for own user and when signed in.
					 */
					if (!req.user)
						return res.sendUnauthenticated();

					if(handle !== user.handle)
						return next(new restify.errors.NotAuthorizedError());

					user.save(req.body, function (err) {

						res.send({
							handle: user.handle,
							imageUrl: user.imageUrl
						});
						next();
					});
				}
				else
				{
					/**
					 * Can not register when already logged in
					 */
					if(req.user)
						return next(new restify.errors.NotAuthorizedError());

					if( ! req.body.username || ! req.body.email || ! req.body.password)
						return next(new restify.errors.InvalidContentError());

					/**
					 * Create new user
					 */
					user = new User(req.body);
					user.save(function (err) {
						if(err)
							return next(new restify.errors.InvalidContentError());

						res.send({
							handle: user.handle,
							imageUrl: user.imageUrl
						});
						next();
					});
				}
			});


		// user can only save if logged in
		//if (!req.user) {
		//	return res.sendUnauthenticated();
		//}

		//if(req.params.handle !== user.handle)
		//	return next(new restify.errors.NotAuthorizedError());
		//
		//User.findOne({ handle: req.params.handle})
		//	.exec(function (err, user) {
		//		if( ! user)
		//			return next(new restify.errors.ResourceNotFoundError());
		//
		//		// only send publicly available data
		//		res.send({
		//			handle: user.handle,
		//			imageUrl: user.imageUrl
		//		});
		//		next();
		//	});

		//if(req.params.handle)
		//	user.handle = req.params.handle;
		//
		//if(req.params.imageUrl)
		//	user.imageUrl = req.params.imageUrl;
		//
		//user.save(function (err) {
		//	if(err)
		//		return next(new restify.errors.InvalidContentError());
		//
		//	res.send({
		//		handle: user.handle,
		//		imageUrl: user.imageUrl
		//	});
		//	next();
		//});
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