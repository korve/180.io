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

	var expect = chai.expect;

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
			},
			db: {
				db: '180io-testing'
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
						username: 	'mockUser',
						password: 	mockUserPassword,
						email: 		'mockEmail@example.com',
						handle: 	'mockName',
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
			User.find({}).remove(function (err) {

				// clean related auth token
				AuthToken.find({}).remove(function (err) {

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
						email: mockUser.email,
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

		describe("/user", function () {
			describe('POST', function () {
				it('should create a new user and return a user handle', function (done) {
					var handle;
					request(server)
						.post('/user')
						.send({
							name: 		'New Mock User',
							email: 		'newmockuser@example.com',
							password: 	'123456'
						})
						.expect(function (res) {
							expect(res.status).to.be.equal(200);
							expect(res.body).to.have.property('handle').and.to.match(/^NewMockUser/);
							handle = res.body.handle;
						})
						.end(done);
				});

				it('should return a 400 response when email is already in use', function (done) {
					request(server)
						.post('/user')
						.send({
							name: 		'New Mock User',
							email: 		'newmockuser@example.com',
							password: 	'123456'
						})
						.expect(function (res) {
							expect(res.status).to.be.equal(200);
							expect(res.body).to.have.property('handle').and.to.match(/^NewMockUser/);
						})
						.end(function (err) {
							expect(err).to.be.equal(null);

							request(server)
								.post('/user')
								.send({
									name: 		'New Mock User',
									email: 		'newmockuser@example.com',
									password: 	'123456'
								})
								.expect(function (res) {
									expect(res.status).to.be.equal(400);
									expect(res.body).to.not.have.property('handle');
								})
								.end(done);
						});
				});

				it('should create a random handle when trying to create a user with same name', function (done) {
					request(server)
						.post('/user')
						.send({
							name: 		'New Mock User',
							email: 		'newmockuser@example.com',
							password: 	'123456'
						})
						.expect(function (res) {
							expect(res.status).to.be.equal(200);
							expect(res.body).to.have.property('handle').and.to.match(/^NewMockUser/);
						})
						.end(function (err) {
							expect(err).to.be.equal(null);

							request(server)
								.post('/user')
								.send({
									name: 		'New Mock User',
									email: 		'newmockuser1@example.com',
									password: 	'123456'
								})
								.expect(function (res) {
									expect(res.status).to.be.equal(200);
									expect(res.body).to.have.property('handle').and.to.match(/^NewMockUser\d+/);
								})
								.end(done);
						});
				});
			});
		});

		describe("/user/:handle", function () {
			describe('GET', function () {
				it('should return information about a user', function (done) {
					request(server)
						.get('/user/' + mockUser.handle)
						.expect(200)
						.expect({
							handle: 	mockUser.handle,
							imageUrl: 	'http://example.com/mock'
						})
						.end(done);
				});

				it('should return a ResourceNotFoundError (404) when user could not be found', function (done) {
					request(server)
						.get('/user/notExisingUserHandle')
						.expect(404, done);
				});

				it('should return a Method Not Allowed (405) when the handle is missing', function (done) {
					request(server)
						.get('/user')
						.expect(405, done);
				});
			});

			describe('POST', function () {

				//it('should return a NotAuthorizedError (403) when trying to update another user than the current', function (done) {
				//	authenticate()
				//		.then(function (token) {
				//			return request(server)
				//				.post('/user/notMe')
				//				.send({
				//					handle:		'newMockHandle',
				//					imageUrl: 	'http://example.com/newImage'
				//				})
				//				.set('Authorization', 'Bearer ' + token)
				//				.expect(403, function (err, res) {
				//					done(err);
				//				});
				//		})
				//		.done();
				//});
				//
				//it('should return a 200 when updating self', function (done) {
				//	authenticate()
				//		.then(function (token) {
				//			return request(server)
				//				.post('/user/' + mockUser.handle)
				//				.send({
				//					handle:		'newMockHandle',
				//					imageUrl: 	'http://example.com/newImage'
				//				})
				//				.set('Authorization', 'Bearer ' + token)
				//				.expect(200, function (err, res) {
				//					done(err);
				//				});
				//		})
				//		.done();
				//});
			});
		});

		//	it("Should return a 401 status if not authenticated", function(done) {
		//		request(server)
		//			.get('/user/info')
		//			.expect('link', new RegExp(options.auth.tokenEndpoint))
		//			.expect(401, done);
		//	});
		//
		//	it("Should return a 200 status if authenticated and return a json object containing user info", function(done) {
		//		authenticate()
		//			.then(function (token) {
		//				return request(server)
		//					.get('/user/info')
		//					.set('Authorization', 'Bearer ' + token)
		//					.expect(200)
		//					.expect({
		//						name:		mockUser.name,
		//						imageUrl: 	mockUser.imageUrl
		//					})
		//					.end(function (err) {
		//						done(err)
		//					});
		//			})
		//			.done();
		//	});
		//});
		//
		//describe("/user/logout", function () {
		//	it("Should return a 401 status if not authenticated", function(done) {
		//		request(server)
		//			.get('/user/logout')
		//			.expect('link', new RegExp(options.auth.tokenEndpoint))
		//			.expect(401, done);
		//	});
		//
		//	it("Should return a 200 status if logout was successful", function(done) {
		//		authenticate()
		//			.then(function (token) {
		//				return request(server)
		//					.get('/user/logout')
		//					.set('Authorization', 'Bearer ' + token)
		//					.expect(200, function () {
		//						// should now return a 401
		//						request(server)
		//							.get('/user/logout')
		//							.expect(401, done);
		//					});
		//			})
		//			.done();
		//	});
		//});
	});	
})();
