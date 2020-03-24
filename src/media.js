if (!URLSearchParams) {
	throw alert(Error("outdated browser, no URLSearchParams support"));
}

fetch(new Request("/src/data/media.json"))
	.then((result) => result.json())
	.then((data) => {
		let page = new URLSearchParams(location.search).get("page");

		if (page) {
			let content = document.getElementById("content");
			let c = "";
			let _ = data.filter(x => x.page == page)[0];

			// add navigation
			c = `<p>go <a href="/">home</a>...</p>
			<p>go <a href="media.html">back</a>...</p>`;

			// add media image
			if (_.image) c += `<img src="${_.image}">`;

			// add title
			c += `<h1>${_.title}</h1>`;

			// add subtitle
			{
				let sub = `<p class="subtext">`;

				if (_.explicit) sub += `[explicit] `;
				if (_.type) sub += `[${_.type}] `;
				if (_.date) sub += `${_.date}<br>`;
				if (_.length) sub += `[length] ${_.length}<br>`

				sub += `</p>`;
				c += sub;
			}

			// add content
			if (_.content) {
				if (typeof(_.content) == "string") {
					c += `<p>${_.content}</p>`
				} else {
					_.content.forEach(s => c += `<p>${s}</p>`);
				}
			}

			// add link
			if (_.url) c += `<p class="url"><a class="external" href="${_.url}">${_.url.split("/")[2]}</a></p>`

			content.innerHTML = c;
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