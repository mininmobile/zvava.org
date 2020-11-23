const fs = require("fs");
/**
 * @type {Object.<string, string>}
 */
let templates = {};

// read all of the templates
fs.readdir("src", (error, temps) => {
	console.log("\x1b[90m->\x1b[0m gathering templates...");
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
	console.log("\x1b[90m->\x1b[0m parsing articles...");

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

			let metadata = { page: a };

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
				metadata.content = data.substring(end + 2, data.length - 1).split("\n\n");
			}

			articles[a] = metadata;

			// make sure you have all the articles collected before proceeding
			x++
			if (x == _articles.length) {
				// sort by date
				articles = Object.fromEntries(Object.entries(articles).sort(([,a],[,b]) => new Date(b.date) - new Date(a.date)));

				// generate
				generateArticles(articles);
				generatePreviews(articles);
			}
		}));
	});
}

// convert the articles into html
function generateArticles(articles) {
	Object.keys(articles).forEach((article) => {
		let a = articles[article];
		let result = testTemplate(templates["template_article.html"], a);

		fs.writeFile("out/media/" + article + ".html", result, () =>
			console.log(`\x1b[32m-->\x1b[0m created ${article}.html`));
	});
}

// generate preview on index.html and generate media.html listing
function generatePreviews(articles) {
	{ // generate index.html
		let result = testTemplate(templates["template_index.html"], articles);

		fs.writeFile("out/index.html", result, () =>
			console.log("\x1b[32m-->\x1b[0m generated index.html"));
	}

	{ // generate media.html
		let result = testTemplate(templates["template_media.html"], articles);

		fs.writeFile("out/media.html", result, () =>
			console.log("\x1b[32m-->\x1b[0m generated media.html"));
	}
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
		case "ARTICLE.PARAGRAPHS": return article.content.map(p => "<p>" + p + "</p>").join("\n\t\t");

		case "ARTICLES.LATEST": { // generate a listing of the first 5 articles
			let articles = article; // for my own sanity
			let result = "";

			Object.keys(articles).slice(0, 5).forEach(a => {
				let article = articles[a];

				// open
				result += "<li>";

				// add first type in long-form
				result += "[" + article.type.split(", ")[0] + "] ";

				// add link
				result += "<a href=\"media/" + article.page + ".html\">";
				result += article.title;
				result += "</a> ";

				// add date
				let d = new Date(article.date);
				let month = d.getUTCMonth() + 1;
					month = month.toString().length == 2 ? month : "0" + month;
				let day = d.getUTCDate();
					day = day.toString().length == 2 ? day : "0" + day;
				result += "<span class=\"date\">";
				result +=	d.getUTCFullYear() + "/" + month + "/" + day;
				result += "</span>";

				// close
				result += "</li>\n";
			});

			return result;
		} break;

		case "ARTICLES.ALL": { // generate a list of all articles
			let articles = article; // for my own sanity
			let result = "";

			Object.keys(articles).forEach(a => {
				let article = articles[a];

				// open
				result += "<li>";

				// add types
				result += "[";
				result += article.type
					.split(", ")
					.map(x => x[0])
					.join(", ");
				result += "] ";

				// add link
				result += "<a href=\"media/" + article.page + ".html\">";
				result += article.title;
				result += "</a> ";

				// add date
				let d = new Date(article.date);
				let month = d.getUTCMonth() + 1;
					month = month.toString().length == 2 ? month : "0" + month;
					let day = d.getUTCDate();
					day = day.toString().length == 2 ? day : "0" + day;
				result += "<span class=\"date\">";
				result +=	d.getUTCFullYear() + "/" + month + "/" + day;
				result += "</span>";

				// close
				result += "</li>\n";
			});

			return result;
		}

		default: {
			return eval(e.toLowerCase());
		}
	}
}
