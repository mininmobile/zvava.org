const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require("constants");
const fs = require("fs");

let templates = {};

fs.readdir("src", (error, temps) => {
	if (error)
		return console.error(error);

	let x = 0;

	temps.forEach(a => fs.readFile("src/" + a, "utf8", (err, data) => {
		if (err)
			throw console.error(err);

		templates[a] = data;
		x++;

		if (x == temps.length)
			run();
	}));
});

function run() {
	fs.readdir("articles", (error, articles) => {
		if (error)
			return console.error(error);

		articles.forEach(a => fs.readFile("articles/" + a, "utf8", (err, data) => {
			if (err)
				return console.error(err);

			// shit
		}));
	});
}
