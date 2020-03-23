let pmedia = document.getElementById("preview-media");

fetch(new Request("/src/data/media.json"))
	.then((result) => result.json())
	.then((data) => {
		pmedia.innerHTML = "";

		for (let i = 0; i < 3; i++) {
			let item = `<li>
				<a href="media.html?page=${data[i].page}">
					${data[i].title}
				</a>
			</li>`;

			pmedia.innerHTML += item + "\n";
		}
	}).catch(console.error);
