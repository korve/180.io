(function() {
	"use strict";

	var q = require('q'),
		chai = require("chai"),
		chaiAsPromised = require("chai-as-promised"),
		request = require('supertest'),
		expect = chai.expect,
		restify = require('restify'),
		User = require('../src/lib/db/user');

	chai.use(chaiAsPromised);

	describe("API tests", function(){
		var server, port, host, agent, options;
		var mockUser, mockUserPassword, authToken;

		port = 9000;
		host = 'http://localhost:' + port;

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
						username: 'mockuser',
						password: mockUserPassword
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
			User.find({id: mockUser.id}).remove(function (err) {

				server.close(function () {
					done(err);
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
				if(authToken)
				{
					return authToken;
				}

				var agent = request.agent(server);

				agent.post(options.auth.tokenEndpoint)
					.send({
						grant_type: 'password',
						username: mockUser.username,
						password: mockUserPassword
					})
					.auth('testing', options.auth.clients.testing.secret)
					.set('Content-Type', 'application/x-www-form-urlencoded')
					.expect(200)
					.end(function (err, res) {
						if(err)
							reject(err);

						authToken = res.body.access_token;
						resolve(authToken);
					});
			});
		}

		describe("/user/getSessionInfo", function () {
			it("Should return a 401 status if not authenticated", function(done) {
				request(server)
					.get('/user/getSessionInfo')
					.expect('link', new RegExp(options.auth.tokenEndpoint))
					.expect(401, done);
			});

			it("Should return a 200 status if authenticated and return a json object containing user info", function(done) {
				authenticate()
					.then(function (token) {
						return request(server)
							.get('/user/getSessionInfo')
							.set('Authorization', 'Bearer ' + token)
							.expect(200, function (err, res) {
								done(err);
							});
					})
					.done();
			});
		});
	});	
})();
