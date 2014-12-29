/**
 * Created by andre (http://korve.github.io/) on 27.12.2014
 */
var restify = require('restify');
var restifyOAuth2 = require('restify-oauth2');
var cryptoUtil = require('./util/crypto');
var User = require('./db/user');
var AuthToken = require('./db/authToken');

module.exports.configure = function (container) {
	var options = container.options.auth;

	if( ! options.clients)
		throw new Error('clients must be provided for the oauth2 api');

	// ropc validates api clients and lets their users
	// authenticate with a username+password
	restifyOAuth2.ropc(container.server, {
		tokenEndpoint: options.tokenEndpoint,
		tokenExpirationTime: options.expires,
		wwwAuthenticateRealm: options.wwwAuthenticateRealm,
		hooks: {
			validateClient: function (clientCreds, req, cb) {
				var isValid = typeof options.clients[clientCreds.clientId] !== 'undefined'
					&& options.clients[clientCreds.clientId].secret === clientCreds.clientSecret;

				cb(null, isValid);
			},
			/**
			 * Checks if a cc login is valid
			 * @param userCreds 	{ clientId, clientSecret }
			 * @param req		the client request
			 * @param cb		callback when the validation has finished
			 * @returns {boolean}
			 */
			grantUserToken: function (userCreds, req, cb) {
				User.findOne({ email: userCreds.email }, function (err, user) {

					if(err)
						return cb(null, err);

					if(!user)
						return cb(null, false)

					// compare the two
					var passwordInfo = cryptoUtil.passwordInfo(user.password);
					cryptoUtil.hashPassword(userCreds.password, passwordInfo.salt, passwordInfo.iterations)
						.then(function (password) {
							if(password !== user.password)
							{
								// password mismatch
								return cb(null, false)
							}

							var expires = new Date();
							expires.setSeconds(expires.getSeconds() + options.expires);

							var authToken = new AuthToken({
								_user: user._id,
								token: cryptoUtil.generateToken(),
								expires: expires
							});
							authToken.save(function (err) {
								if(err)
									return cb(err, false);

								cb(null, authToken.token);
							});

						})
						.catch(function (err) {

							cb(err, false);
						})
						.done();
				});
			},
			/**
			 * Checks if a token authentication is valid
			 * @param token
			 * @param req
			 * @param cb		callback when the validation has finished
			 */
			authenticateToken: function(token, req, cb) {
				AuthToken.findOne({ token: token })
					.populate('_user')
					.exec(function (err, authToken) {
						if(err)
							return cb(null, err);

						if(!authToken)
							return cb(null, false);

						var now = new Date().getTime();
						var diff = authToken.expires.getTime() - now;

						if(diff < 0)
						{
							return authToken.remove(function () {
								cb(null, false);
							});
						}

						req.authToken = authToken;
						req.user = authToken._user;
						cb(null, true);
					});
			}
		}
	});

	return container;
};