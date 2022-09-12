import * as std from "std"
import * as os from "os"

main()

function main() {
	scriptArgs.shift()

	switch (scriptArgs[0]) {
		case "list": {
			let args = (scriptArgs[1] || "")
			if (args.includes("h"))
				return print(
					"usage: qjs wiki.js list [-hlLcTIEAMVHS]\n\n" +
					"  -\t noop\n" +
					"  h\t display usage information\n" +
					"  l\t compact list\n" +
					"  L\t cozy list\n" +
					"  c\t sort by created date instead of modified date\n" +
					"categories:\n" +
					"  T\t text\n" +
					"  I\t info\n" +
					"  E\t event\n" +
					"  A\t art\n" +
					"  M\t music\n" +
					"  V\t video\n" +
					"  H\t hardware\n" +
					"  S\t software\n" +
				"")

			let [ dir, err ] = os.readdir("src/wiki")
			if (err != 0 ) return print("os.readdir:", err)
			let pages = dir
				.map(x => x.substring(0, x.length - 4))
				.filter(x => x.length > 0)

			let output = []
			pages.forEach(page => new Promise((resolve, reject) => {
				let _f = std.open("src/wiki/" + page + ".gmi", "r")
				if (_f.error()) return reject(_f.error())
				let data = _f.readAsString().replace(/\r/g, "") // windows newline =[
				_f.close()

				let metadata = { page: page, content: data }
				// extract title
				metadata["title"] = data.substring(2, data.indexOf("\n"))
				// extract metadata
				let metaStart = data.indexOf("```") + 4
				let metaEnd = data.indexOf("```", metaStart) - 1
				data.substring(metaStart, metaEnd)
					.split(/\n+/)
					.map(x => x.split(/\s+/))
					.forEach((x) => {
						let property = x.shift()
						metadata[property] = property == "category" ? x.map(y => y.replace(",", "")) : x.join(" ")
					})
				// ensure there is a modified field
				if (!metadata["modified"])
					metadata["modified"] = metadata["created"]

				output.push(metadata)

				if (output.length == pages.length) {
					let sortBy = (scriptArgs[1] || "").includes("c") ? "created" : "modified"
					output = output
					// apply filters
						.filter(x =>
							!/[TIEAMVHS]/.test(args) ||
							(args.includes("T") && x.category.includes("text")) ||
							(args.includes("I") && x.category.includes("info")) ||
							(args.includes("E") && x.category.includes("event")) ||
							(args.includes("A") && x.category.includes("art")) ||
							(args.includes("M") && x.category.includes("music")) ||
							(args.includes("V") && x.category.includes("video")) ||
							(args.includes("H") && x.category.includes("hardware")) ||
							(args.includes("S") && x.category.includes("software")))
					// sort
						.sort((a, b) => {
							let dateA = new Date(a[sortBy].replace(/\//g, "-"))
							let dateB = new Date(b[sortBy].replace(/\//g, "-"))
							return canRunExec() ? dateA - dateB : dateB - dateA
						})
					// render
						.map(page => {
							let dateA = sortBy == "created" ? page.created : page.modified
							let dateB = sortBy == "created" ? page.modified : page.created

							let out = `${dateA} \x1b[90m${dateB} |\x1b[m ${page.title}`
							if (args.includes("l")) return out; else {
								let emojis = page.category
									.map(x => prependRelevantEmoji(x).split(" ")[0])
									.join(" ")
								return std.sprintf("%s\n%-21s \x1b[90m|\x1b[m %s \x1b[90m%s\x1b[m",
										out, page.category.join(", "), emojis, page.page)
							}
						})

					print(output.join(args.includes("L")
						? "\n\x1b[90m——————————————————————+——\x1b[m\n"
						: "\n"))
				}
				resolve()
			}))
		} break

		case "new": {
			let args = scriptArgs.slice(1)
			if (args.length == 0 || args.includes("-h") || args.includes("--help"))
				return print(
					"usage: qjs wiki.js new page [args...]\n\n" +
					"arguments:\n" +
					"  -h  --help        display usage information\n" +
					"  -f  --force       don't abort if page already exists\n" +
					"  -t  --title       set new page's title\n" +
					"  -C  --created     set new page's created date\n" +
					"  -m  --modified    set new page's modified date\n" +
					"  -T  --thumb       set new page's thumbnail\n" +
					"  -c  --category    add a category to the page \n" +
					"  -h1 --header      add a # header to the page \n" +
					"  -h2 --sub         add a ## header to the page \n" +
					"  -h3 --subsub      add a ### header to the page \n" +
					"  -p  --text        add a paragraph to the page \n" +
					"  -q  --quote       add a block quote to the page \n" +
					"  -l  --link        add a link to the page\n" +
					"  -i  --image       add an image to the page\n" +
					"  -a  --alt         set alt text of previous image/link\n"+
					"\ndate format:       YYYY/MM/DD\n" +
					"\ncategories:\n" +
					"  + text          + info\n" +
					"  + event         + art\n" +
					"  + music         + video\n" +
					"  + hardware      + software\n" +
				"")

			if ((args[0] || "").startsWith("-"))
				return print("page url cannot start with a hyphen")

			let _date = new Date()
			let page = {
				page: args.shift(),
				title: "untitled",
				created: stringifyDate(_date),
				modified: stringifyDate(_date),
				thumbnail: undefined,
				thumbnailAlt: "thumbnail",
				category: [],
				body: [],
			}

			let force = false
			while (args.length > 0) {
				let arg = args.shift()
				let value = args.shift()
				switch (arg) {
					case "-f": case "--force": force = true; args.unshift(value); break

					case "-t": case "--title":
						if (value) page.title = value; break

					case "-C": case "--created":
						if (value) page.created = value; break

					case "-m": case "--modified":
						if (value) page.modified = value; break

					case "-T": case "--thumb":
						if (value) page.thumbnail = value; break

					case "-c": case "--category":
						if (value) page.category.unshift(value); break

					case "-h1": case "--header":
						if (value) page.body.unshift({ node: "h1", text: value }); break

					case "-h2": case "--sub":
						if (value) page.body.unshift({ node: "h2", text: value }); break

					case "-h3": case "--subsub":
						if (value) page.body.unshift({ node: "h3", text: value }); break

					case "-p": case "--text":
						if (value) page.body.unshift({ node: "text", text: value }); break

					case "-q": case "--quote":
						if (value) page.body.unshift({ node: "quote", text: value }); break

					case "-l": case "--link":
						if (value) page.body.unshift({ node: "link", path: value, text: "" }); break

					case "-i": case "--image":
						if (value) page.body.unshift({ node: "image", path: "/images/" + value, text: "" }); break

					case "-a": case "--alt":
						if (!value) break

						let i = page.body.findIndex(x => x.node == "link" || x.node == "image")

						if (i == -1)
							page.thumbnailAlt = value
						else
							page.body[i].text = value
					break
				}
			}

			let output = "# " + page.title + "\n"

			if (page.thumbnail !== undefined)
				output += `=> /images/t/${page.thumbnail}.png ${page.thumbnailAlt}\n`

			// metadata
			// created
			output += "```\ncreated  " + page.created + "\n"
			// modified
			if (page.created != page.modified) output += "modified " + page.modified + "\n"
			// category
			if (page.category.length == 0) page.category.push("stub");
			output += `category ${page.category.join(", ")}\n`
			//
			output += "```\n"

			// body
			page.body.reverse().forEach(element => { switch(element.node) {
				case "h1": output += "\n# " + element.text + "\n"; break
				case "h2": output += "\n## " + element.text + "\n"; break
				case "h3": output += "\n### " + element.text + "\n"; break
				case "text": output += "\n" + element.text + "\n"; break
				case "quote": output += "\n> " + element.text + "\n"; break
				case "link": output += `\n=> ${element.path} ${element.text}\n`; break
				case "image": output += `\n=> ${element.path} ${element.text}\n`; break
			}})

			// write to file
			let path = "src/wiki/" + page.page + ".gmi"
			if (force || os.stat(path)[1] != 0) {
				let f = std.open(path, "w")
				if (f.error()) {
					print("\x1b[90m->\x1b[0m error creating", page.page + ".gmi")
				} else {
					f.puts(output)
					print("\x1b[90m->\x1b[0m created", page.page + ".gmi")
				}
			} else {
				print("wiki.js: page", "src/wiki/" + path, "already exists\ntip: you can --force this action")
			}
		} break

		case "edit": {
			let args = scriptArgs.slice(1)

			if (args.length == 0 || args.includes("-h") || args.includes("--help"))
				return print(
					"usage: qjs wiki.js edit [arg] page\n\n" +
					"argument:\n" +
					"  (no argument)    open the page in nano\n" +
					"  -h --help        display usage information\n" +
					"  -m --modify      set modified date to today's date\n" +
				"")

			if (args.length == 1 && (args[0] || "").startsWith("-"))
				return print("wiki.js: page titles cannot start with a hyphen\ntip: qjs wiki.js edit --help")

			let page = args.pop()
			let arg = args.shift()
			let path = "src/wiki/" + page + ".gmi"

			switch (arg) {
				case "-m": case "--modify": try {
					// read file
					let read = std.open(path, "r")
					if (read.error()) throw "error reading " + page + ".gmi"
					let data = read.readAsString().replace(/\r/g, "") // windows newline =[
					read.close()

					let makePos = data.indexOf("created")
					let modPos = data.indexOf("modified", makePos)
					// if a modified field exists
					let modDefined = modPos > -1 && modPos - 20 == makePos


					if (modDefined) { // change modified field
						data = data.replace(/modified ....\/..\/../, "modified " + stringifyDate(new Date()))
					} else { // create modified field
						data = data.replace(/(created  ....\/..\/..)/, "$1\nmodified " + stringifyDate(new Date()))
					}

					// write file
					let write = std.open(path, "w")
					if (write.error()) throw "error writing " + page + ".gmi"
					write.puts(data)
					write.close()
					print("\x1b[90m->\x1b[0m updated", page + ".gmi")
				} catch (e) {
					print("wiki.js:", e)
				} break

				default:
					os.exec(["nano", path])
			}


		} break

		case "rm": {
			let args = scriptArgs.slice(1)
			if (args.length == 0|| args.includes("-h") || args.includes("--help"))
				return print(
					"usage: qjs wiki.js rm [-h] [pages]\n\n" +
					"  -h --help    display usage information\n" +
					"  -y --yes     confirm deletion\n" +
				"")

			let confirmed = args.includes("-y") || args.includes("--yes")
			while (args.length > 0) {
				let page = args.shift()
				if (page.startsWith("-")) continue
				let path = "src/wiki/" + page + ".gmi";

				if (confirmed) {
					let rm = os.remove(path);
					print (path, "\x1b[90m--\x1b[0m", rm == 0 ? "deleted" : "already deleted");
				} else {
					print("\x1b[90mrm\x1b[0m", path)
				}
			}
		} break

		default:
			print(
				"usage: qjs wiki.js command args\n\n" +
				"commands:\n" +
				"  list\t list all wiki pages\n" +
				"  new\t create a new wiki page\n" +
				"  edit\t edit a wiki page\n" +
				"  rm\t delete wiki pages\n\n" +
				"each command has it's own arguments, to list use -h\n" +
			"")
	}
}

function canRunExec() {
	return os.platform != "win32" && os.platform != "js"
}

function stringifyDate(date) {
	let d = new Date(date)
	let month = (d.getUTCMonth() + 1).toString()
	if (month.length == 1) month = "0" + month
	let day = d.getDate().toString()
	if (day.length == 1) day = "0" + day
	return `${d.getUTCFullYear()}/${month}/${day}`
}

function prependRelevantEmoji(x) {
	let e = ""
	switch (x) {
		case "text":     e += "📝"; break
		case "info":     e += "🧠"; break
		case "event":    e += "🍾"; break
		case "art":      e += "🎨"; break
		case "music":    e += "🎵"; break
		case "video":    e += "📺"; break
		case "hardware": e += "🔧"; break
		case "software": e += "💾"; break
	}
	return e.length > 0 ? e + " " + x : x
}
