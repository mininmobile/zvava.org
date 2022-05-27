const os = require("os");
const { exec } = require("child_process");

if (os.hostname().startsWith("racknerd")) {
	process.chdir("/home/zvava/zvava.org");
	exec("git pull", (error, stdout, stderr) => {
		if (error)
			return console.error(error);
		else if (stdout.includes("Already up to date."))
			return console.log("\x1b[90m->\x1b[0m already up to date");
		else {
			const make = require("/home/zvava/zvava.org/make");
			make((fs) => {
				console.log("\x1b[90m->\x1b[0m copying output to webserver dirs...");
				fs.cpSync("/home/zvava/zvava.org/out/gemini/", "/var/gemini/content/", { recursive: true });
				fs.cpSync("/home/zvava/zvava.org/out/www/", "/var/www/", { recursive: true });
			});
		}
	});
} else {
	exec("ssh -t zvava@zvava.org 'node /home/zvava/zvava.org/publish'");
}
