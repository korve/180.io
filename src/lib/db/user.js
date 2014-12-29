/**
 * Created by andre (http://korve.github.io/) on 27.12.2014
 */

var mongoose = require('mongoose');
var cryptoUtil = require('../util/crypto');

var userSchema = mongoose.Schema({
	id: String,
	email: {
		type: String,
		unique: true,
		required: true
	},
	password: {
		type: String,
		required: true
	},
	// the name entered when signing up
	name: String,
	// handle to identify the user for API requests
	handle: {
		type: String,
		unique: true
	},
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

	if( ! user.handle)
	{
		// generate new handle
		var handle = user.name.replace(/[^\w]/ig, '');
		handle = handle.slice(0, 16);

		user.handle = handle;
	}

	module.exports.find({ handle: new RegExp('^' + user.handle) }, function (err, users) {

		if(users.length > 0)
		{
			var unique = false;
			var newHandle = user.handle;

			while(!unique)
			{
				// TODO does not scale
				newHandle = user.handle + Math.floor(Math.random() * 10000).toString();

				var hasDuplicate = false;
				users.forEach(function (u) {
					if(u.handle === newHandle)
					{
						hasDuplicate = true;
						return false;
					}
				});

				if( ! hasDuplicate)
					unique = true;
			}

			user.handle = newHandle;
		}

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

});

module.exports = mongoose.model('User', userSchema);