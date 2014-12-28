/**
 * Created by andre (http://korve.github.io/) on 27.12.2014
 */

module.exports = function (container) {
	var server = container.server;

	server.get('/user/info', function (req, res, next) {
		if (!req.user) {
			return res.sendUnauthenticated();
		}
		res.send({
			name: req.user.name,
			imageUrl: req.user.imageUrl
		});
		next();
	});

	/**
	 * logout is not needed but encouraged to keep the authToken table
	 * clean
	 */
	server.get('/user/logout', function (req, res, next) {
		if (!req.user || !req.authToken) {
			return res.sendUnauthenticated();
		}

		req.authToken.remove();
		res.send();
		next();
	});
};