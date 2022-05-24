const fs = require("fs");

// this function
//   -> fetchTemplates
//   -> fetchWiki
//   -> generateGemini
//     create cache of gemini templates
//     write gemini output files
//   -> generateHTML
//     translate all gemini files into html
//   -> generateASS
//     generate a .ass feed for both gemini and web versions of the site

/** @type {Object.<string, string>} */
let templates = {};
let pages = {};

fs.stat("out", (err, stats) => {
	if (err) {
		console.log("\x1b[90m->\x1b[0m creating output directories...");
		fs.mkdirSync("out");
		// gemini output directory
		fs.mkdirSync("out/gemini");
		fs.mkdirSync("out/gemini/wiki");
		// html output directory
		fs.mkdirSync("out/www");
		fs.mkdirSync("out/www/wiki");
	}

	console.log("\x1b[90m->\x1b[0m updating resources...");
	fs.cpSync("src/images/", "out/gemini/images/", { recursive: true });
	fs.cpSync("src/images/", "out/www/images/", { recursive: true });
	fs.cpSync("src/zvava.css", "out/www/zvava.css");

	fetchTemplates();
})

// read all of the templates
function fetchTemplates() {
	fs.readdir("src/templates", (error, temps) => {
		console.log("\x1b[90m->\x1b[0m gathering templates...");
		if (error) return console.error(error);

		let x = 0;
		temps.forEach(a => fs.readFile("src/templates/" + a, "utf8", (err, data) => {
			if (err) throw console.error(err);

			templates[a] = data;
			// make sure you have all the templates collected before proceeding
			x++;
			if (x == temps.length)
				fetchWiki();
		}));
	});
}

// read and parse all of the wiki pages
function fetchWiki() {
	console.log("\x1b[90m->\x1b[0m gathering wiki pages...");

	fs.readdir("src/wiki", (error, _wiki) => {
		if (error) return console.error(error);

		let x = 0;
		_wiki.map(a => a.substring(0, a.length - 4)) // remove .gmi
		.forEach(a => fs.readFile("src/wiki/" + a + ".gmi", "utf8", (err, _data) => {
			if (err) return console.error(err);
			let data = _data.replace(/\r\n/gm, "\n");

			let metadata = { page: a, content: data };
			// extract title
			metadata["title"] = data.substring(2, data.indexOf("\n"));
			// extract metadata
			let metaStart = data.indexOf("```") + 4;
			let metaEnd = data.indexOf("```", metaStart) - 1;
			data.substring(metaStart, metaEnd).split(/\n+/).map(x => x.split(/ +/))
			.forEach((x) => {
				let property = x.shift();
				metadata[property] = property == "category" ?
					x.map(y => y.replace(",", "")) : x.join(" ");
			});
			// ensure there is a modified field
			if (!metadata["modified"])
				metadata["modified"] = metadata["created"];

			pages[a] = metadata;

			// make sure you have all the pages collected before proceeding
			x++
			if (x == _wiki.length) {
				// sort by modified
				pages = Object.fromEntries(Object.entries(pages).sort(([,a],[,b]) => new Date(b.modified) - new Date(a.modified)));
				// generate
				generateGemini();
			}
		}));
	});
}

// convert the articles into html
function generateGemini() {
	console.log("\x1b[90m->\x1b[0m generating gemini site...");
	// sanity
	let _pages = Object.keys(pages);
	let files = {};

	// generate index
	let _wikiRecent = _pages.slice(0, 7).map(p => {
		let page = pages[p];
		return `=> /wiki/${p}.xyz [${page.modified}] ${page.title} [${page.category[0]}]`;
	}).join("\n");
	files["index"] = templates["index.gmi"].replace("{wiki_recent}", _wikiRecent);

	// generate wiki index
	let _wikiAll = _pages.map(p => {
		let page = pages[p];
		return `=> /wiki/${p}.xyz [${page.modified}] ${page.title} [${page.category.join(", ")}]`;
	}).join("\n");
	files["wiki/index"] = templates["wiki-index.gmi"].replace("{wiki_all}", _wikiAll);

	// generate wiki pages
	_pages.forEach(p => {
		let page = pages[p];
		files["wiki/" + p] = templates["wiki-page.gmi"].replace("{content}", page.content);
	});

	// write pages
	let _files = Object.keys(files);
	_files.forEach((f, i) => {
		let content = files[f]
			// add filenames to thumbnails
			.replace(/(\w*)\.(png|jpg) (thumbnail|cover|image)/gi, "$1.$2 $3 ($1.$2)")
			// replace ambiguous links
			.replace(/\.xyz/g, ".gmi");

		fs.writeFile("out/gemini/" + f + ".gmi", content, () =>
			checkProgress(i));
	});

	function checkProgress(i) {
		// update terminal readout
		process.stdout.write(`\r\x1b[32m-->\x1b[0m writing gemini page ${i + 1}/${_files.length}`);
		// if all pages have been written
		if (i == _files.length - 1) {
			process.stdout.write("\n");
			generateHTML(files);
		}
	}
}

function generateHTML(files) {
	console.log("\x1b[90m->\x1b[0m generating html site...");

	// alternate gemini links to https on index
	files["index"] = files["index"]
		.replace("=> https://zvava.org/ view html version", "=> gemini://zvava.org/ view gemini version")
		.replace("=> gemini://git.zvava.org git.zvava.org", "=> https://git.zvava.org git.zvava.org");

	// write altered files
	let _files = Object.keys(files);
	_files.forEach((f, i) => {
		// set title
		let title = `/${f} @ zvava.org`;
		if (f == "index") title = "zvava.org";
		else if (f == "wiki/index") title = "/wiki/ @ zvava.org";
		// fill out head template
		let output = templates["head.html"].replace("{title}", title);

		// split into variable for optimized access to .length
		// also replace ambiguous links here bc where else?
		let _c = files[f].replace(/\.xyz/g, ".html").split("```");
		_c.forEach((x, i) => {
			// if file contains a code block and you are currently in one
			if (_c.length > 1 && i % 2 !== 0)
				return output += x + "</pre>\n";

			// parse remaining content
			output += x.split(/\n/).map((l, i, a) => {
					// escape html tag opening brackets
				l = l.replace(/</g, "&lt;")
					// convert headers
					.replace(/^### +(.*)$/, "<h3>$1</h3>")
					.replace(/^## +(.*)$/, "<h2>$1</h2>")
					.replace(/^# +(.*)$/, "<h1>$1</h1>")
					// convert images
					.replace(/^=> +([a-z0-9\-_\/:\.@]+)\.(png|jpg)$/i, '<img src="$1.$2">')
					.replace(/^=> +([a-z0-9\-_\/:\.@]+)\.(png|jpg) +(.*)$/i, '<img src="$1.$2" alt="$3">')
					// convert links
					.replace(/^=> +([a-z0-9\-_\/:\.@]+)$/i, '<a href="$1">$1</a>')
					.replace(/^=> +([a-z0-9\-_\/:\.@]+) +(.*)$/i, '<a href="$1">$2</a>')
					// convert block quotes
					.replace(/^> *(.*)$/, "<blockquote>$1</blockquote>")

				// will this line be considered for its spacing?
				if (!l.startsWith("<h") && !l.startsWith("<b") && l.length > 0) {
					// fetch previous/next lines (default to empty string if not able to acquire)
					let previousLine = (a[i - 1] || "");
					let nextLine = (a[i + 1] || "");
					// check if previous/next line is empty or contains a heading or blockquote
					let pLineEmpty = previousLine.length == 0 || previousLine.startsWith("#") || previousLine.startsWith(">");
					let nLineEmpty = nextLine.length == 0 || nextLine.startsWith("#") || nextLine.startsWith(">");

					if (pLineEmpty && nLineEmpty)
						l = "<p>" + l + "</p>";
					else if (pLineEmpty && !nLineEmpty)
						l = "<p>" + l + "<br>";
					else if (!pLineEmpty && nLineEmpty)
						l = l + "</p>";
					else if (!pLineEmpty && !nLineEmpty)
						l += "<br>";
				}

				return l;
			}).filter(x => x.length > 0).join("\n") + "\n";

			// if file contains a code block and you aren't at the end of file
			if (_c.length > 1 && i != _c.length - 1)
				output += "<pre>";
		});

		fs.writeFile("out/www/" + f + ".html", output + "</body>\n</html>\n", () =>
			checkProgress(i));
	});

	function checkProgress(i) {
		// update terminal readout
		process.stdout.write(`\r\x1b[32m-->\x1b[0m writing html page ${i + 1}/${_files.length}`);
		// if all pages have been written
		if (i == _files.length - 1) {
			process.stdout.write("\n");
			generateASS();
		}
	}
}

function generateASS() {
	console.log("\x1b[90m->\x1b[0m generating feed.ass...");

	let assEntries = Object.keys(pages).map((p, i) => {
		let page = pages[p];
		return `${page.modified.replace(/\//g, "-")}	gemini://zvava.org/wiki/${page.page}.gmi	${page.title}`;
	}).join("\n");

	fs.writeFile("out/gemini/feed.ass", assEntries, () =>
		console.log("\x1b[32m-->\x1b[0m generated gemini feed.ass"));
	fs.writeFile("out/www/feed.ass", assEntries.replace(/gemini:\/\//g, "https://").replace(/\.gmi\t/g, ".html "), () =>
		console.log("\x1b[32m-->\x1b[0m generated html feed.ass"));
}
