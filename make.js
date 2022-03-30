const fs = require("fs");
/**
 * @type {Object.<string, string>}
 */
let templates = {};
let articles = {};
let notes = {};

// asyncronous execution structure
// inside the functions the code is written to by synchronous
//
// this function
//   -> fetchArticles
//   -> fetchNotes
//   -> generateArticles
//   -> generateNotes
//   -> generatePreviews

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

		let x = 0;

		_articles
			.map(a => a.substring(0, a.length - 3)) // remove .md
			.forEach(a => fs.readFile("articles/" + a + ".md", "utf8", (err, _data) =>
		{
			if (err)
				return console.error(err);
			let data = _data.replace(/\r\n/gm, "\n");

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
				fetchNotes();
			}
		}));
	});
}

// read and parse all of the notes
function fetchNotes() {
	console.log("\x1b[90m->\x1b[0m parsing notes...");

	fs.readdir("notes", (error, _notes) => {
		if (error)
			return console.error(error);

		let x = 0;

		_notes
			.map(a => a.substring(0, a.length - 3)) // remove .md
			.forEach(a => fs.readFile("notes/" + a + ".md", "utf8", (err, data) =>
		{
			if (err)
				return console.error(err);

			let metadata = { page: a };

			{ // extract meta
				let mend = data.indexOf("\n\n#");
				let meta = data.substring(0, mend)
					.split("\n")
					.map(x => x.split(" | "));

				meta.forEach(property =>
					metadata[property[0]] = property[1]);
			}

			{ // extract title/text
				let start = data.indexOf("\n\n#") + 4;
				let end = data.indexOf("\n", start);

				metadata.title = data.substring(start, end);
				metadata.content = data.substring(end + 2, data.length - 1).split("\n\n");
			}

			// extract dates
			if (metadata.modified == undefined)
				metadata.modified = metadata.created;

			notes[a] = metadata;

			// make sure you have all the notes collected before proceeding
			x++
			if (x == _notes.length) {
				// sort by modified
				notes = Object.fromEntries(Object.entries(notes).sort(([,a],[,b]) => new Date(b.modified) - new Date(a.modified)));
				// generate
				generateArticles();
			}
		}));
	});
}

// convert the articles into html
function generateArticles() {
	console.log("\x1b[90m->\x1b[0m generating articles...");

	let _articles = Object.keys(articles)
	_articles.forEach((article, i) => {
		let a = articles[article];
		let result = testTemplate(templates["template_article.html"], a);

		fs.writeFile("out/media/" + article + ".html", result, () =>
			checkProgress(i));
	});

	function checkProgress(i) {
		// update terminal readout
		process.stdout.write(`\r\x1b[32m-->\x1b[0m created article ${i + 1}/${_articles.length}`);
		// if all articles have been generated
		if (i == _articles.length - 1) {
			process.stdout.write("\n");
			generateNotes();
		}
	}
}

// convert the notes into html
function generateNotes() {
	console.log("\x1b[90m->\x1b[0m generating notes...");

	let _notes = Object.keys(notes)
	_notes.forEach((note, i) => {
		let a = notes[note];
		let result = testTemplate(templates["template_note.html"], undefined, a);

		fs.writeFile("out/notes/" + note + ".html", result, () =>
			checkProgress(i));
	});

	function checkProgress(i) {
		// update terminal readout
		process.stdout.write(`\r\x1b[32m-->\x1b[0m created note ${i + 1}/${_notes.length}`);
		// if all notes have been generated
		if (i == _notes.length - 1) {
			process.stdout.write("\n");
			generatePreviews();
			generateASS();
		}
	}
}

// generate preview on index.html and generate media.html listing
function generatePreviews() {
	console.log("\x1b[90m->\x1b[0m generating previews...");

	{ // generate index.html
		let result = testTemplate(templates["template_index.html"], articles, notes);

		fs.writeFile("out/index.html", result, () =>
			console.log("\x1b[32m-->\x1b[0m generated index.html"));
	}

	{ // generate media.html
		let result = testTemplate(templates["template_media.html"], articles, notes);

		fs.writeFile("out/media.html", result, () =>
			console.log("\x1b[32m-->\x1b[0m generated media.html"));
	}
}

function generateASS() {
	console.log("\x1b[90m->\x1b[0m generating feed.ass...");

	let assEntries = Object.keys(articles).map((_a, i) => {
		let a = articles[_a]; let date = new Date(a.date);
		let month = (date.getUTCMonth() + 1).toString(); month = month.length == 1 ? month = "0" + month : month;
		let day = date.getUTCDate().toString(); day = day.length == 1 ? day = "0" + day : day;
		return `${date.getUTCFullYear()}-${month}-${day}	https://zvava.org/media/${a.page}.html	${a.title}`;
	});

	fs.writeFile("out/feed.ass", assEntries.join("\n"), () =>
		console.log("\x1b[32m-->\x1b[0m generated feed.ass"));
}

// parse and return a finished page
// it expects to be given an article as the context
function testTemplate(_page, article, note) {
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

			if (test(q, article, note)) {
				if (r[0] == "[") {
					result = testTemplate(templates[r.substring(1, r.length - 1)], article, note);
				} else {
					result = r;
				}
			}
		} else {
			result = test(e, article, note);
		}

		page = page.replace(e, result || "");
	});

	return page;
}

// add support for stuff like headers etc. not requiring me to write in ugly html
/** @param {Array.<String>} paragraphs */
function parseParagraphs(paragraphs) {
	return paragraphs.map((paragraph) => {
		let p = ""; // content of paragraph
		let _p = paragraph; // content of paragraph after adding title to p
		// check for header
		if (paragraph.charAt(0) == "#") {
			let end = paragraph.indexOf("\n"); if (end == -1) end = undefined;
			let title = paragraph.substring(paragraph.indexOf(" ") + 1, end);
			// check for other tag sizes
			let tag = "h1";
			if (paragraph.charAt(1) == "#") {
				tag = "h2";
				if (paragraph.charAt(2) == "#")
					tag = "h3";
			}
			// add to paragraph
			p += `<${tag}>${title}</${tag}>`;
			_p = end > 0 ? paragraph.substring(end + 1) : "";
		}
		// if not just header, add content to paragraph
		if (_p.length > 0)
			p += "<p>" + _p + "</p>";

		return p;
	}).join("\n\t\t");
}

// parse and return result of [custom templating language]
// it expects to be given an article as the context
function test(expression, article, note) {
	let e = expression[0] == "{" ?
		expression.substring(1, expression.length - 1) : expression;

	switch (e) {
		case "ARTICLE.URL.DOMAIN": {
			if (article.url.startsWith("/")) {
				return article.url;
			} else {
				let path = article.url.split("/");
				return path[2];
			}
		} break;
		case "ARTICLE.URL.EXTERNAL": return !article.url.startsWith("/");
		case "ARTICLE.PARAGRAPHS": return parseParagraphs(article.content);
		case "NOTE.PARAGRAPHS": return parseParagraphs(note.content);

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

		case "NOTES.LATEST": { // generate a listing of the 5 last updated notes
			let notes = note; // for my own sanity
			let result = "";

			Object.keys(notes).slice(0, 5).forEach(a => {
				let note = notes[a];

				// open
				result += "<li>";

				// add link
				result += "<a href=\"notes/" + note.page + ".html\">";
				result += note.page  == "index" ? "index" : note.title;
				result += "</a> ";

				// add date
				let d = new Date(note.modified);
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
			try {
				return eval(e.toLowerCase());
			} catch (error) {
				console.log(`\x1b[91m->\x1b[0m error whilst executing [\x1b[91m${e}\x1b[0m]`);
				console.error(error);
				return error.toString();
			}
		}
	}
}
