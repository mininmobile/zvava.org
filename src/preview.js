let preview = document.getElementById("preview");

fetch(new Request("/src/data/media.json"))
	.then((result) => result.json())
	.then((data) => {
		preview.innerHTML = "";

		for (let i = 0; i < 5; i++) {
			let item = `<li>
				[${typeof(data[i].type) == "string" ?
					data[i].type :
					data[i].type.join(", ")}]
				<a href="media.html?page=${data[i].page}">
					${data[i].title}
				</a>
			</li>`;

			preview.innerHTML += item + "\n";
		}
	}).catch(console.error);
