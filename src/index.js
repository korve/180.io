(function () {
	"use strict";

	require('./lib/server').create({
		restify: {
			name: '180.io server'
		}
	})
		.then(function (server) {
			server.listen(9010);
		})
		.done();
})();