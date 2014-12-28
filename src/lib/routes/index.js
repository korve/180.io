/**
 * Created by andre (http://korve.github.io/) on 27.12.2014
 */

var fs = require('fs');

module.exports.configure = function (container) {
	fs.readdir(__dirname, function (err, files) {

		files.forEach(function (file) {
			if(file[0] === '.' || file === 'index.js')
				return true;

			require(__dirname + '/'  + file)(container);
		});
	});

	return container;
};