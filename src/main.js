let downArrow = document.querySelector(".popup.bottom");

downArrow.classList.add("clickable");

downArrow.addEventListener("click", () => {
	window.scrollTo({
		top: window.outerHeight / 2,
		behavior:"smooth"
	});
});
