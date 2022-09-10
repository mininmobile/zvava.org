import * as std from "std"
import * as os from "os"

main()

function main() {
	scriptArgs.shift()

	switch (scriptArgs[0]) {
		case "list": {
			let args = (scriptArgs[1] || "");
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
					"  S\t software"
				)

			let [ dir, err ] = os.readdir("./src/wiki")
			if (err != 0 ) return print("os.readdir:", err);
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
						let property = x.shift();
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
							return canRunExec() ? dateA - dateB : dateB - dateA;
						})
					// render
						.map(page => {
							let dateA = sortBy == "created" ? page.created : page.modified
							let dateB = sortBy == "created" ? page.modified : page.created

							let out = `${dateA} \x1b[90m${dateB} |\x1b[m ${page.title}`;
							if (args.includes("l")) return out; else {
								let emojis = page.category
									.map(x => prependRelevantEmoji(x).split(" ")[0])
									.join(" ");
								return std.sprintf("%s\n%-21s \x1b[90m|\x1b[m %s \x1b[90m%s\x1b[m",
										out, page.category.join(", "), emojis, page.page)
							}
						})

					print(output.join(args.includes("L")
						? "\n\x1b[90m——————————————————————+——\x1b[m\n"
						: "\n"))
				}
				resolve();
			}))
		} break

		case "new": {

		} break

		case "edit": {

		} break

		default:
			print(
				"usage: qjs wiki.js command args\n\n" +
				"commands:\n" +
				"  list\t list all wiki pages\n" +
				"  new\t create a new wiki page\n" +
				"  edit\t edit a wiki page\n" +
				"  rm\t delete wiki pages\n\n" +
				"each command has it's own arguments, to list use -h"
			)
	}
}

function canRunExec() {
	return os.platform != "win32" && os.platform != "js"
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
	return e.length > 0 ? e + " " + x : x;
}
