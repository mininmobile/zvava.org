window.addEventListener("load", () => {
	document.addEventListener("keydown", (e) => e.key == "Escape" && toggleLazyMode())

	document.addEventListener("click", (e) => lazyMode && focusLink &&
		dist(cursorPos.x, cursorPos.y, dragStart.x, dragStart.y) < 16 && focusLink.link.click())

	document.addEventListener("mousedown", (e) => {
		drag = lazyMode
		dragStart = { x: mousePos.x, y: mousePos.y, scroll: scrollAmount }
	})

	document.addEventListener("mouseup", (e) => {
		if (drag && cursorPos.y != mousePos.y) {
			let cy = cursorPos.y + (mousePos.y - cursorPos.y) / 2
			scrollAmount = dragStart.scroll - (cy - dragStart.y)
		}

		drag = false
	})

	document.addEventListener("mousemove", (e) =>
		lazyMode && (mousePos = { x: e.clientX, y: e.clientY }))

	document.body.addEventListener("wheel", (e) => {
		if (lazyMode) {
			e.preventDefault()

			let s = 0;
			if (e.wheelDeltaY < 0) s = 1
			else if (e.wheelDeltaY > 0) s = -1

			scrollAmount += s * 72
		}
	}, { passive: false })

	lazyMode &&  startLazyMode()
})

let lazyMode = sessionStorage.getItem("lazyMode")
let links = []
let focusLink = undefined;

let cursor = null
let mousePos = { x: 0, y: 0 }
let cursorPos = { x: 0, y: 0 }

let drag = false
let dragStart = { x: 0, y: 0, scroll: 0 }

let scrollAmount = 0
let scrollPos = 0

if (lazyMode == null) {
	lazyMode = false
} else {
	lazyMode = sessionStorage.getItem("lazyMode") == "true" ? true : false
}

function frame() {
	// smooth mouse
	cursorPos.x = Math.floor(cursorPos.x + (mousePos.x - cursorPos.x) / 2)
	cursorPos.y = Math.floor(cursorPos.y + (mousePos.y - cursorPos.y) / 2)

	cursor.style.left = cursorPos.x - 9 + "px"
	cursor.style.top = cursorPos.y - 9 + "px"

	// smooth scroll
	if (drag) scrollAmount = dragStart.scroll - (cursorPos.y - dragStart.y)

	scrollPos = Math.floor(scrollPos + (scrollAmount - scrollPos) / 5)

	let minScroll = window.innerHeight * .15
	let maxScroll = document.body.clientHeight - window.innerHeight / 1.4;

	if (scrollAmount > maxScroll) scrollAmount = maxScroll
	if (scrollAmount < minScroll) scrollAmount = minScroll

	window.scroll(0, scrollPos)

	// focus closest link
	links.forEach(l => l.classList.remove("focus"))
	focusLink = links
		.map(l => {
			let d = Math.abs(l.getBoundingClientRect().top - (cursorPos.y - 9))
			return { link: l, dist: d }
		})
		.filter(l => l.dist < 64)
		.sort((a, b) => a.dist - b.dist)[0];
	focusLink && focusLink.link.classList.add("focus")

	if (lazyMode) requestAnimationFrame(frame)
}

function startLazyMode() {
	console.log("starting lazy mode")
	document.querySelector("html").classList.add("lazy-mode")
	// get links
	lazyModeGetLinks()
	// create cursor element
	cursor = document.createElement("div")
	cursor.classList.add("cursor")
	document.body.appendChild(cursor)
	frame()
}

function endLazyMode() {
	console.log("ending lazy mode")
	focusLink && focusLink.link.classList.remove("focus")
	document.querySelector("html").classList.remove("lazy-mode")
	// delete cursor element
	document.body.removeChild(cursor)
	//
	focusLink = undefined;
	links = []
	drag = false
}

function toggleLazyMode() {
	lazyMode = !lazyMode
	sessionStorage.setItem("lazyMode", lazyMode ? "true" : "false")
	lazyMode ? startLazyMode() : endLazyMode()
}

function dist(x1, y1, x2, y2) {
	let dx = x1 - x2;
	let dy = y1 - y2;
	return Math.sqrt(dx * dx + dy * dy)
}

function lazyModeGetLinks() {
	// get links
	links = []
	let _links = document.querySelectorAll("a, label, summary")
	for (let i = 0; i < _links.length; i++)
		links.push(_links[i])
}
