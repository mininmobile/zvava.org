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

			if (_ == undefined)
				location = "404.html";

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
				if (_.type) sub += `[${typeof(_.type) == "string" ? _.type : _.type.join(", ")}] `;
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
			if (_.url) c += `<p class="url"><a class="external" href="${_.url}">${_.rawurl ? _.url : _.url.split("/")[2]}</a></p>`

			content.innerHTML = c;
		} else {
			let preview = document.getElementById("media");
			drawPreviews(preview, data);

			let sorts = document.getElementById("sorts");
			for (let i = 0; i < sorts.children.length; i++) {
				let sort = sorts.children[i];

				sort.addEventListener("click", () => {
					for (let j = 0; j < sorts.children.length; j++)
						sorts.children[j].classList.remove("selected");

					sort.classList.add("selected");

					drawPreviews(preview, data, i ? sort.innerText : null);
				});
			}
		}
	}).catch(console.error);

function drawPreviews(p, d, category = null) {
	return new Promise((resolve, error) => {
		let list = "";

		// loop over every blog post
		for (let i = 0; i < d.length; i++) {
			// 18+ check
			if (localStorage.explicit != "true" && d[i].explicit)
				continue;
			// if sorting, do a check if post is of sorted type
			if (category)
				if (typeof(d[i].type) == "string" ?
					d[i].type != category :
					!d[i].type.includes(category)) continue;

			let c = "";

			if (category && typeof(d[i].type) != "string") {
				c = d[i].type
					.filter(x => x != category)
					.map(x => x[0])
					.join(", ");
			} else if (!category) {
				c = typeof(d[i].type) == "string" ?
					d[i].type[0] :
					d[i].type.map(x => x[0]).join(", ");
			}

			list += `<li>
				${c ? `[${c}]` : ""}
				${d[i].explicit ? "[explicit]" : ""}
				<a href="media.html?page=${d[i].page}">
					${d[i].title}
				</a>
			</li>\n`;
		}

		p.innerHTML = list;
	});
}