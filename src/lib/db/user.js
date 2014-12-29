/**
 * Created by andre (http://korve.github.io/) on 27.12.2014
 */

var mongoose = require('mongoose');
var cryptoUtil = require('../util/crypto');

var userSchema = mongoose.Schema({
	id: String,
	username: String,
	password: String,
	email: String,
	handle: String,
	imageUrl: String,
	created: {
		type:		Date,
		'default':	Date.now
	}
});

userSchema.pre('save', true, function (next, done) {
	next();

	var user = this;
	if( ! user.created)
		user.created = new Date();

	cryptoUtil.hashPassword(user.password, null, 10000)
		.catch(function (err) {
			done(err);
		})
		.then(function (password) {
			user.password = password;
			done();
		})
		.done();
});

module.exports = mongoose.model('User', userSchema);