# zvava.org
my personal website for my portfolio and blog

## compilation
run this command to build the website's pages, a whole bunch of html files should be dumped into `out/` and `out/media/`. deleted files aren't cleared (although they should be, i won't implement it)

```shell
$ node make
```

then i run this command to publish the site, it's mostly for conciseness since it just runs scp and automatically plugs my username and password into it via an .env file, it uses the node-ssh and dotenv libraries so make sure to have it installed in the repo directory

```shell
$ npm i dotenv node-ssh
$ node publish
```

## templating language
i use a custom templating language that slightly resembles php. it finds `{expressions}`, executes them, and then substitutes them to generate the final page. these are mostly plain js except for a few caveats.

- sometimes there are "custom tokens" (ie. `ARTICLE.URL.DOMAIN`) just to make the template look cleaner
- sometimes there are "if statements" (ie. `IF(CONDITION)RESULT`) which substitutes the expression with result if condition is true
- sometimes there are "includes" (ie. `[template_image.html]`) which substitutes the expression with another template, which is parsed before substitution

## markdown language
i use a bastardization of markdown to write/store the articles (inside the actual content part of the article, no parsing is done, all links are written the same as in html at the moment)

properties (timestamp, image, link, etc.) are stores in a table at the top, separating the key and value with a pipe and spaces, and separating each property with a newline, like this:

```markdown
type | project
date | Mon, 16 Oct 2018 00:00:00 GMT
image | src/img/media/terminal.png
url | https://github.com/mininmobile/xonade
```

next comes the title of the page, which is parsed from the `\n\n# ` at the end of the properties to the `\n` at the end of the title line

```markdown
# Xonade
```

then the content is parsed by taking the `\n\n\n` at the end of the title and splitting everything since then by `\n\n` (excluding the trailing `\n` at the end of the file)
