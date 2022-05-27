const os = require("os");
const { exec } = require("child_process");

if (os.hostname().startsWith("racknerd")) {
	exec("cd ~/zvava.org; git pull", (error, stdout, stderr) => {
		if (error)
			return console.error(error);
		else if (stdout.includes("Already up to date."))
			return console.log("\x1b[90m->\x1b[0m already up to date");
		else {
			const make = require("./make");
			make((fs) => {
				console.log("\x1b[90m->\x1b[0m copying output to webserver dirs...");
				//fs.cpSync("out/gemini/", "/var/gemini/content/", { recursive: true });
				//fs.cpSync("out/www/", "/var/www/", { recursive: true });
			});
		}
	});
} else {
	exec("ssh zvava@zvava.org 'node ~/zvava.org/publish'");
}
