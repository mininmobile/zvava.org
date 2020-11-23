const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require("constants");
const fs = require("fs");

/**
 * @type {Object.<string, string>}
 */
let templates = {};

// read all of the templates
fs.readdir("src", (error, temps) => {
	if (error)
		return console.error(error);

	let x = 0;

	temps.forEach(a => fs.readFile("src/" + a, "utf8", (err, data) => {
		if (err)
			throw console.error(err);

		templates[a] = data;
		//templates[a.substring(9, a.length - 5)] = data;

		// make sure you have all the templates collected before proceeding
		x++;
		if (x == temps.length)
			fetchArticles();
	}));
});

// read and parse all of the articles
function fetchArticles() {
	fs.readdir("articles", (error, _articles) => {
		if (error)
			return console.error(error);

		let articles = {};

		let x = 0;

		_articles
			.map(a => a.substring(0, a.length - 3)) // remove .md
			.forEach(a => fs.readFile("articles/" + a + ".md", "utf8", (err, data) =>
		{
			if (err)
				return console.error(err);

			let metadata = {};

			{ // extract meta
				let mend = data.indexOf("\n\n#");
				let meta = data.substring(0, mend)
					.split("\n")
					.map(x => x.split(" | "));

				meta.forEach(property => metadata[property[0]] = property[1]);
			}

			{ // extract title/text
				let start = data.indexOf("\n\n#") + 4;
				let end = data.indexOf("\n", start);

				metadata.title = data.substring(start, end);
				metadata.content = data.substring(end + 2, data.length - 2).split("\n\n");
			}

			articles[a] = metadata;

			// make sure you have all the articles collected before proceeding
			x++
			if (x == _articles.length)
				generateArticles(articles);
		}));
	});
}

// convert the articles into html
function generateArticles(articles) {
	/**
	 * @type {Array.<RegExpExecArray>}
	 */

	Object.keys(articles).forEach((article) => {
		let a = articles[article];
			a.page = article;

		let result = testTemplate(templates["template_article.html"], a);
		console.log(result)
	});
}

// parse and return a finished page
// it expects to be given an article as the context
function testTemplate(_page, article) {
	let expressions = [..._page.matchAll(/\{.+?}/g)];
	let page = _page;

	expressions.forEach((_e, i) => {
		let e = _e.toString();
		let result;

		if (e[1] + e[2] + e[3] == "IF(") {
			// 4 is the position of the opening bracket in "{IF(..."
			let qEnd = e.indexOf(")", 4);
			let q = e.substring(4, qEnd); // q(uestion)
			let r = e.substring(qEnd + 1, e.length - 1); // r(esult)

			if (test(q, article)) {
				if (r[0] == "[") {
					result = testTemplate(templates[r.substring(1, r.length - 1)], article);
				} else {
					result = r;
				}
			}
		} else {
			result = test(e, article);
		}

		page = page.replace(e, result || "");
	});

	return page;
}

// parse and return result of [custom templating language]
// it expects to be given an article as the context
function test(expression, article) {
	let e = expression[0] == "{" ?
		expression.substring(1, expression.length - 1) : expression;

	switch (e) {
		case "ARTICLE.URL.DOMAIN": return article.rawurl ? article.url : article.url.split("/")[2];
		case "ARTICLE.PARAGRAPHS": return "<p>" + article.content[0] + "</p>";

		default: {
			return eval(e.toLowerCase());
		}
	}
}
