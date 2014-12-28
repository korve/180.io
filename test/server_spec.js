(function() {
	"use strict";

	var q = require('q'),
		chai = require("chai"),
		chaiAsPromised = require("chai-as-promised"),
		request = require('supertest'),
		restify = require('restify'),
		User = require('../src/lib/db/user'),
		AuthToken = require('../src/lib/db/authToken');

	chai.use(chaiAsPromised);

	describe("API tests", function(){
		var server, port, options;
		var mockUser, mockUserPassword;

		port = 9000;

		options = {
			restify: {
				name: '180.io testing server',
				version: '1.0.0'
			},
			auth: {
				tokenEndpoint: '/token',
				wwwAuthenticateRealm: '180.io testing',
				clients: {
					testing: { secret: '123456' }
				}
			}
		};

		beforeEach(function (done) {
			require('../src/lib/server').create(options)
				.then(function (result) {
					server = result;
					return q.promise(function(resolve, reject) {
						server.listen(port, function (err) {
							if(err)
								return reject(err);

							resolve(server);
						})
					});
				})
				.then(function () {
					mockUserPassword = 'mockpass';
					mockUser = new User({
						username: 	'mockuser',
						password: 	mockUserPassword,
						email: 		'mockEmail',
						name: 		'mockName',
						imageUrl: 	'http://example.com/mock',
						created:	new Date()
					});

					return q.promise(function (resolve, reject) {
						mockUser.save(function (err) {
							if(err)
								return reject(err);

							resolve();
						});
					});
				})
				.done(function () {
					done();
				});
		});

		afterEach(function (done) {

			// clean user
			User.find({_id: mockUser._id}).remove(function (err) {

				// clean related auth token
				AuthToken.find({_user: mockUser._id}).remove(function (err) {

					server.close(function () {
						done(err);
					});
				});
			});
		});

		/**
		 * Authenticates mockUser with the API and returns a promise
		 * for a authenticated request
		 *
		 * @returns {*}
		 */
		function authenticate() {
			return q.promise(function (resolve, reject) {
				var agent = request.agent(server);

				agent.post(options.auth.tokenEndpoint)
					.send({
						grant_type: 'password',
						username: mockUser.username,
						password: mockUserPassword
					})
					// auth header is base64 encoded clientId+clientSecret
					.auth('testing', options.auth.clients.testing.secret)
					.set('Content-Type', 'application/x-www-form-urlencoded')
					.expect(200)
					.end(function (err, res) {
						if(err)
							reject(err);

						resolve(res.body.access_token);
					});
			});
		}

		describe("/user/info", function () {
			it("Should return a 401 status if not authenticated", function(done) {
				request(server)
					.get('/user/info')
					.expect('link', new RegExp(options.auth.tokenEndpoint))
					.expect(401, done);
			});

			it("Should return a 200 status if authenticated and return a json object containing user info", function(done) {
				authenticate()
					.then(function (token) {
						return request(server)
							.get('/user/info')
							.set('Authorization', 'Bearer ' + token)
							.expect(200)
							.expect({
								name:		mockUser.name,
								imageUrl: 	mockUser.imageUrl
							})
							.end(function (err) {
								done(err)
							});
					})
					.done();
			});
		});

		describe("/user/logout", function () {
			it("Should return a 401 status if not authenticated", function(done) {
				request(server)
					.get('/user/logout')
					.expect('link', new RegExp(options.auth.tokenEndpoint))
					.expect(401, done);
			});

			it("Should return a 200 status if logout was successful", function(done) {
				authenticate()
					.then(function (token) {
						return request(server)
							.get('/user/logout')
							.set('Authorization', 'Bearer ' + token)
							.expect(200, function () {
								// should now return a 401
								request(server)
									.get('/user/logout')
									.expect(401, done);
							});
					})
					.done();
			});
		});
	});	
})();
