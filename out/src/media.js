addEventListener("load", () => {
	let sorts = document.getElementById("sorts");
	let media = document.getElementById("media");

	for (let i = 0; i < sorts.children.length; i++) {
		let s = sorts.children[i];

		s.addEventListener("click", () => {
			for (let i = 0; i < sorts.children.length; i++)
				sorts.children[i].classList.remove("selected");

			s.classList.add("selected");

			if (s.innerText == ".") {
				for (let i = 0; i < media.children.length; i++)
					media.children[i].classList.remove("hidden");
			} else {
				for (let i = 0; i < media.children.length; i++) {
					let _m = media.children[i];
					let m = _m.innerText;
					let types = m.substring(1, m.indexOf("]")).split(", ");

					types.includes(s.innerText[0]) ?
						_m.classList.remove("hidden") :
						_m.classList.add("hidden");
				}
			}
		});
	}
});
