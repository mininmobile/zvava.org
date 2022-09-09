import * as std from "std";
import * as os from "os";

// requires a unix system to run
// main();
//   -> fetchTemplates
//   -> fetchWiki
//   -> generateGemini
//     create cache of gemini templates
//     write gemini output files
//   -> generateHTML
//     translate all gemini files into html

function copyFile(from, to, recursive = false) {
	let cmd = ["cp"];
	if (recursive) cmd.push("-r");
	cmd.push(from, to);

	return os.exec(cmd);
}

/** @type {Object.<string, string>} */
let templates = {};
let pages = [];

main();

function main() {
	if (os.platform == "win32" || os.platform == "js")
		return print("make: cannot run on this platform.");

	let [, err] = os.stat("out/");
	if (err != 0) {
		print("\x1b[90m->\x1b[0m creating output directories...");
		os.mkdir("out");
		// gemini output directory
		os.mkdir("out/gemini");
		os.mkdir("out/gemini/wiki");
		// html output directory
		os.mkdir("out/www");
		os.mkdir("out/www/wiki");
	}

	print("\x1b[90m->\x1b[0m updating resources...");
	copyFile("src/images/", "out/gemini/images/", true);
	copyFile("src/images/", "out/www/images/", true);
	copyFile("src/zvava.css", "out/www/zvava.css");

	fetchTemplates();
}

// read all of the templates
function fetchTemplates() {
	print("\x1b[90m->\x1b[0m gathering templates...");
	let [ temps, err ] = os.readdir("src/templates").filter(x => x != "." && x != "..");
	if (err) return print(err);
	temps = temps.filter(x => x != "." && x != "..");

	let x = 0;
	temps.forEach((filename, i) => new Promise((resolve, reject) => {
		let _f = std.open("src/templates/" + filename, "r");
		if (_f.error()) return reject(_f.error());
		templates[filename] = _f.readAsString().replace(/\r/g, ""); // windows newline
		_f.close();

		if (i + 1 == temps.length)
			fetchWiki();
		resolve();
	}).catch(print));
}

// read and parse all of the wiki pages
function fetchWiki() {
	print("\x1b[90m->\x1b[0m gathering wiki pages...");
	let [ _wiki, err ] = os.readdir("src/wiki");
	if (err) return print(err);
	_wiki = _wiki.filter(x => x != "." && x != "..");

	_wiki.map(filename => filename.substring(0, filename.length - 4)) // remove .gmi
	.forEach((page, i) => new Promise((resolve, reject) => {
		let _f = std.open("src/wiki/" + page + ".gmi", "r");
		if (_f.error()) return reject(_f.error());
		let data = _f.readAsString().replace(/\r/g, ""); // windows newline
		_f.close();

		let metadata = { page: page, content: data };
		// extract title
		metadata["title"] = data.substring(2, data.indexOf("\n"));
		// extract metadata
		let metaStart = data.indexOf("```") + 4;
		let metaEnd = data.indexOf("```", metaStart) - 1;
		data.substring(metaStart, metaEnd).split(/\n+/).map(x => x.split(/\s+/))
		.forEach((x) => {
			let property = x.shift();
			metadata[property] = property == "category" ?
				x.map(y => y.replace(",", "")) : x.join(" ");
		});
		// ensure there is a modified field
		if (!metadata["modified"])
			metadata["modified"] = metadata["created"];

		pages.push(metadata);

		if (i + 1 == _wiki.length) {
			// sort by modified
			pages = pages.sort((a, b) => new Date(b.modified.replace(/\//g, "-")) - new Date(a.modified.replace(/\//g, "-")));
			// generate
			generateGemini();
		}
		resolve();
	}).catch(print));
}

// convert the articles into html
function generateGemini() {
	print("\x1b[90m->\x1b[0m generating gemini site...");
	// sanity
	let files = {};

	// generate index
	let _books = ["📕", "📗", "📘", "📙", "📓"].sort(() => Math.random() - .5); // random book emojis
	let _wikiRecent = pages.slice(0, 5).map((p, i) => {
		let book = _books[i]; // get random book emoji
		let category = prependRelevantEmoji(p.category[0]);
		return `=> /wiki/${p.page}.xyz ${book} wiki/${p.title}` + "\n```\n   " + `[${p.modified}] [${category}]` + "\n```";
	}).join("\n");
	files["index"] = templates["index.gmi"].replace("{wiki_recent}", _wikiRecent);

	// generate wiki index
	let _wikiAll = pages.map(p => {
		let category = p.category.map(prependRelevantEmoji).join(", ");
		return `=> /wiki/${p.page}.xyz ${p.title}` + "\n```\n   " + `[${p.modified}] [${category}]` + "\n```";
	}).join("\n");
	files["wiki/index"] = templates["wiki-index.gmi"].replace("{wiki_all}", _wikiAll);

	// generate wiki pages
	pages.forEach(p => {
		files["wiki/" + p.page] = templates["wiki-page.gmi"].replace("{content}", p.content);
	});

	// write pages
	let _files = Object.keys(files);
	_files.forEach((f, i) => new Promise((resolve, reject) => {
		let content = files[f]
			// remove html-only templates
			.replace(/{html[a-z_]*}\n/g, "")
			// add filenames to thumbnails
			.replace(/(\w*)\.(png|jpg) (thumbnail|cover|image)/gi, "$1.$2 $3 ($1.$2)")
			// replace ambiguous links
			.replace(/\.xyz/g, ".gmi");

		let _f = std.open("out/gemini/" + f + ".gmi", "w");
		if (_f.error()) return reject(_f.error());
		_f.puts(content);

		// update terminal readout
		std.printf(`\r\x1b[32m-->\x1b[0m wrote gemini page ${i + 1}/${_files.length}`);
		// if all pages have been written
		if (i + 1 == _files.length) {
			std.printf("\n");
			generateHTML(files);
		}
		resolve();
	}).catch(print));
}

function generateHTML(files) {
	print("\x1b[90m->\x1b[0m generating html site...");

	// alternate gemini links to https on index
	files["index"] = files["index"]
		.replace("=> https://zvava.org 🕸️ view html version", "=> gemini://zvava.org 🚀 view gemini version")

	// write altered files
	let _files = Object.keys(files);
	_files.forEach((f, i) => new Promise((resolve, reject) => {
		// set title
		let title = `/${f} @ zvava.org`;
		if (f == "index") title = "zvava.org";
		else if (f == "wiki/index") title = "/wiki/ @ zvava.org";
		// fill out head template
		let output = templates["head.html"].replace("{title}", title);

		let _c = files[f]
			// remove gmi-only templates
			.replace(/{gmi[a-z_]*}\n/g, "")
			// replace ambiguous links
			.replace(/\.xyz/g, ".html")
			// split into variable for optimized access to .length
			.split("```");
		_c.forEach((x, i) => {
			// if file contains a code block and you are currently in one
			if (_c.length > 1 && i % 2 !== 0)
				return output += x + "</pre>\n";

			// parse remaining content
			output += x.split(/\n/).map((l, i, a) => {
					// escape html tag opening brackets
				l = l.replace(/</g, "&lt;")
					// convert headers
					.replace(/### +(.*)/, "<h3>$1</h3>")
					.replace(/## +(.*)/, "<h2>$1</h2>")
					.replace(/# +(.*)/, "<h1>$1</h1>")
					// convert images
					.replace(/=> +([a-z0-9\-_\/:\.@?!&=#]+)\.(png|jpg) +(.*)/i, '<img src="$1.$2" alt="$3">')
					.replace(/=> +([a-z0-9\-_\/:\.@?!&=#]+)\.(png|jpg)/i, '<img src="$1.$2">')
					// convert links
					.replace(/=> +([a-z0-9\-_\/:\.@?!&=#]+) +(.*)/i, '<a href="$1">$2</a>')
					.replace(/=> +([a-z0-9\-_\/:\.@?!&=#]+)/i, '<a href="$1">$1</a>')
					// convert block quotes
					.replace(/^> *(.*)/, "<blockquote>$1</blockquote>");

				if (f == "wiki/index" && l.startsWith("<a href=\"/wiki/")) {
					// get location of linked wiki page start
					let start = l.indexOf("/wiki/") + 6;
					// get location of linked wiki page end
					let end = l.indexOf(".html", start);
					// get page's metadata
					let page = pages.find(x => x.page == l.substring(start, end));

					l = l.replace(">", ` data-category="${page.category.join(" ")}">`);
				}

				// will this line be considered for its spacing?
				if (!l.startsWith("<h") && !l.startsWith("<b") && l.replace(/\n/g, "").length > 0) {
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

		if (f == "wiki/index") {
			output = output
				// replace html templates
				.replace("<p>{html_filter}<br>\n", templates["filter.html"] + "<p>")
				// pass down data-category attribute from <a> to <p>s and <pre>s
				.replace(/<p><a (href=".+?") (data-category=".+?")>(.+?)<\/a><\/p>\n<pre>/gm, "<p $2><a $1>$3</a></p>\n<pre $2>");
		}

		let _f = std.open("out/www/" + f + ".html", "w");
		if (_f.error()) return reject(_f.error());
		_f.puts(output + "</body>\n</html>\n");
		_f.close();

		// update terminal readout
		std.printf(`\r\x1b[32m-->\x1b[0m wrote html page ${i + 1}/${_files.length}`);
		// if all pages have been written
		if (i + 1 == _files.length) {
			std.printf("\n");
			print("\r\x1b[32m-->\x1b[0m finished make script");
		}
		resolve();
	}).catch(print));
}

function prependRelevantEmoji(x) {
	let e = "";
	switch (x) {
		case "text":     e += "📝"; break;
		case "info":     e += "🧠"; break;
		case "event":    e += "🍾"; break;
		case "art":      e += "🎨"; break;
		case "music":    e += "🎵"; break;
		case "video":    e += "📺"; break;
		case "hardware": e += "🔧"; break;
		case "software": e += "💾"; break;
	}
	return e.length > 0 ? e + " " + x : x;
}
