# zvava.org
my portfolio website

## media.json format
`media.html` + `src/media.js` act as a blog and compilation of media, it is basically an array of links with some content. the array contains objects formatted like so:
```js
{
	/* REQUIRED */
	"title": <string title, can be non-alphanumeric>,
	"page": <string url, alphanumeric>,
	"content": <string description or content>,

	/* optional */
	"type": <string type of content in ["link", "post", "song", "art", "project"]>,
	"date": <string of utc date>,
	"url": <link to topic, contains http or https>,
	"explicit": <boolean toggle of content warning>
}
```
