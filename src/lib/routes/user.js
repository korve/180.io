/**
 * Created by andre (http://korve.github.io/) on 27.12.2014
 */

module.exports = function (container) {
	container.server.get('/user/getSessionInfo', function (req, res, next) {
		if (!req.user) {
			return res.sendUnauthenticated();
		}
		res.send('Hi, ' + req.user.username);
		next();
	});
};