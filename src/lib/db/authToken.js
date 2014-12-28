/**
 * Created by andre (http://korve.github.io/) on 27.12.2014
 */

var mongoose = require('mongoose');

var authTokenSchema = mongoose.Schema({
	_user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	token: String,
	expires: Date
});

module.exports = mongoose.model('AuthToken', authTokenSchema);