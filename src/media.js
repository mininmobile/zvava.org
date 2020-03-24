if (!URLSearchParams) {
	throw Error("outdated browser, no URLSearchParams support");
}

fetch(new Request("/src/data/media.json"))
	.then((result) => result.json())
	.then((data) => {
		let page = new URLSearchParams(location.search).get("page");

		if (page) {
			let content = document.getElementById("content");
			console.log(page);
		} else {
			let preview = document.getElementById("media");
			drawPreviews(preview, data);

			let sorts = [
				document.getElementById("all"),
				document.getElementById("text"),
				document.getElementById("song"),
				document.getElementById("art"),
				document.getElementById("project"),
				document.getElementById("video"),
			]

			sorts.forEach((sort, i) => {
				sort.addEventListener("click", () => {
					sorts.forEach(x => x.classList.remove("selected"));
					sort.classList.add("selected");

					drawPreviews(preview, data, i ? sort.id : null);
				});
			});
		}
	}).catch(console.error);

function drawPreviews(p, d, category = null) {
	return new Promise((resolve, error) => {
		p.innerHTML = "";

		for (let i = 0; i < d.length; i++) {
			if (category && d[i].type != category)
				continue;

			setTimeout(() => new Promise((resolve, error) => {
				let item = `<li>
					<a href="media.html?page=${d[i].page}">
						${d[i].title}
					</a>
				</li>`;
			
				p.innerHTML += item + "\n";
				resolve(item);
			}), 0);
		}
	});
}