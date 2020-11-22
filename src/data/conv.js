const fs = require("fs");
const media = require("./media.json")

media.forEach((article) => {
	let render = "";

	Object.keys(article).forEach((o) => {
		if (o == "title" || o == "content" || o == "page")
			return;

		render += o + " | " + article[o] + "\n";
	});

	render += "\n# " + article.title + "\n\n";

	if (article.content) {
		if (typeof(article.content) == "string") {
			render += article.content;
		} else {
			article.content.forEach(p => { render += p + "\n\n" });
		}
	}

	fs.writeFileSync(article.page + ".md", render);
});
