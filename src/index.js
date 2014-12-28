(function () {
	"use strict";

	require('./lib/server').create({
		restify: {
			name: '180.io testing server'
		}
	})
		.then(function (server) {
			server.listen(8080);
		})
		.done();
})();