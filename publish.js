const { NodeSSH } = require("node-ssh");
const ssh = new NodeSSH();
require("dotenv").config();

let inloc = "out/";
let outloc = "/home/ervkru/zvava.org";

// connect
console.log("\x1b[90m->\x1b[0m connecting to " + process.env.SSHHOST);
ssh.connect({
	host: process.env.SSHHOST,
	username: process.env.SSHUSER,
	password: process.env.SSHPASS,
}).then(() => {
	console.log("\x1b[90m->\x1b[0m connection success");

	// upload files
	const failed = [];
	const successful = [];
	console.log("\x1b[90m->\x1b[0m starting upload");
	ssh.putDirectory(inloc, outloc, {
		recursive: true,
		concurrency: 10,
		// ^ WARNING: Not all servers support high concurrency
		// try a bunch of values and see what works on your server
		tick: function(localPath, remotePath, error) {
			if (error) {
				failed.push(localPath);
				console.log("\x1b[31m-->\x1b[0m failed to upload " + localPath.substr(4).replace(/\\/g, "/"));
			} else {
				successful.push(localPath);
				console.log("\x1b[32m-->\x1b[0m uploaded " + localPath.substr(4).replace(/\\/g, "/"));
			}
		}
	}).then(function(status) {
		console.log("\x1b[90m->\x1b[0m the directory transfer was", status ? "successful" : "unsuccessful");
		console.log("\x1b[90m->\x1b[0m", failed.length, "failed transfers" +
			(failed.length > 0 ? "(" + failed.join(", ") + ")" : ""));
		console.log("\x1b[90m->\x1b[0m", successful.length, "successful transfers");

		// end connection
		ssh.dispose();
	}, e => {
		console.error(e);
		ssh.dispose();
	});
}, e => {
	console.error(e);
	ssh.dispose();
});
