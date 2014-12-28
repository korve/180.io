/**
 * Created by andre (http://korve.github.io/) on 28.12.2014
 */

var crypto = require('crypto'),
	util = require('util'),
	q = require('q');

module.exports.hashPassword = function(password, salt, iterations) {
	return q.promise(function (resolve, reject) {
		if( ! salt)
			salt = crypto.randomBytes(32).toString('base64');

		crypto.pbkdf2(password, salt, iterations, 64, function(err, derivedKey) {
			if(err)
				return reject(err);

			//http://nodejs.org/api/crypto.html#crypto_crypto_pbkdf2_password_salt_iterations_keylen_callback
			password = util.format('{%s}%s:%d:%s:%s',
				'X-PBKDF2',
				'HMAC-SHA1',
				iterations,
				salt,
				derivedKey.toString('base64')
			);

			resolve(password);
		});
	});
};

/**
 * Parses a password string and returns a object with
 * parsed segments of the password
 *
 * @param password
 * @returns {{passwordDerivationFunction: String, algorithm: String, iterations: Number, salt: String, hash: String}}
 */
module.exports.passwordInfo = function(password) {
	var segments = password.split(':');

	return {
		passwordDerivationFunction: segments[0].slice(1, segments[0].lastIndexOf('}')),
		algorithm: segments[0].slice(segments[0].lastIndexOf('}') + 1),
		iterations: parseInt(segments[1]),
		salt: segments[2],
		hash: segments[3]
	};
};

/**
 * Generates a random token
 * @returns {*}
 */
module.exports.generateToken = function() {
	return crypto.randomBytes(32).toString('base64');
};