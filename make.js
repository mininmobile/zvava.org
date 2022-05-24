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

	console.log("\x1b[90m->\x1b[0m updating images...");
	fs.cpSync("src/images/", "out/gemini/images/", { recursive: true });
	fs.cpSync("src/images/", "out/www/images/", { recursive: true });

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
		process.stdout.write(`\r\x1b[32m-->\x1b[0m written page ${i + 1}/${_files.length}`);
		// if all articles have been generated
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
