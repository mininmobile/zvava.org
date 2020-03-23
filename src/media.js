if (!URLSearchParams) {
	throw Error("outdated browser, no URLSearchParams support");
}

let page = new URLSearchParams(location.search).get("page");

if (page) {
	let content = document.getElementById("content");
	console.log(page);
} else {
	let preview = document.getElementById("media");

	fetch(new Request("/src/data/media.json"))
		.then((result) => result.json())
		.then((data) => {
			preview.innerHTML = "";

			for (let i = 0; i < data.length; i++) {
				setTimeout(() => new Promise((resolve, error) => {
					let item = `<li>
						<a href="media.html?page=${data[i].page}">
							${data[i].title}
						</a>
					</li>`;
				
					preview.innerHTML += item + "\n";
					resolve(item);
				}), 0);
			}
		}).catch(console.error);
}