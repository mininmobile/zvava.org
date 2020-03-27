# zvava.org
my portfolio website

## media.json format
`media.html` + `src/media.js` act as a blog and compilation of media, it is basically an array of links with some content. the array contains objects formatted like so:
```js
{
	/* REQUIRED */
	"title": <string title, can be non-alphanumeric>,
	"page": <string url, alphanumeric>,

	/* optional */
	"image": <string with image url>
	"content": <string or array of description or content>,
	"type": <string type of content in ["text", "song", "art", "project", "video"]>,
	"date": <string of utc date>,
	"url": <link to topic, contains http or https>,
	"explicit": <boolean toggle of content warning>,

	/* type: ["song", "video"] */
	"length": <string of length>
}
```
