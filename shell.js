import { spawn } from "child_process";
import fs from "fs";
import path from "path";
var currentPath = process.cwd();

//save last command in history array and use it with up and down arrow keys
var history = [];
var historyIndex = 0;
var jobs = [];
var jobNum = 1;
function runInBg(cmd) {
  var job = {
    cmd: cmd,
    pid: null,
    status: "running",
    jobNum: jobNum,
  };
  jobNum++;
  jobs.push(job);
  var child = spawn(cmd, {
    shell: true,
    detached: true,
    stdio: "ignore",
  });
  job.pid = child.pid;
  child.unref();
  return job;
}

function ls(dir) {
  if (dir === undefined) {
    dir = currentPath;
    var files = fs.readdirSync(dir);
    console.log(files.join("  "));
  } else {
    let dirname = path.join(currentPath, dir);
    if (fs.existsSync(dirname)) {
      var files = fs.readdirSync(dirname);
      console.log(files.join("   "));
    } else {
      console.log("No such file or directory");
    }
  }
  process.stdout.write(`${currentPath}:~$ `);
}

function cd(dir) {
  if (dir === "..") {
    currentPath = path.dirname(currentPath);
    process.stdout.write(`${currentPath}:~$ `);
  } else {
    var directory = path.join(currentPath, dir);
    if (fs.existsSync(directory)) {
      currentPath = directory;
      process.stdout.write(`${currentPath}:~$ `);
    } else {
      console.log("No such file or directory");
      process.stdout.write(`${currentPath}:~$ `);
    }
  }
}

//fg <job> to bring a job to foreground
function fg(cmd) {
  var job = cmd[1];
  if (job === undefined) {
    console.log("fg: no job specified");
    process.stdout.write(`${currentPath}:~$ `);
  } else {
    var jobNum = job.substring(1);
    if (jobNum > jobs.length) {
      console.log("fg: no such job");
      process.stdout.write(`${currentPath}:~$ `);
    } else {
      var job = jobs[jobNum - 1];
      if (job.status === "stopped") {
        job.status = "running";
        job.process.kill("SIGCONT");
        process.stdout.write(`${currentPath}:~$ `);
      } else {
        console.log("fg: job already in foreground");
        process.stdout.write(`${currentPath}:~$ `);
      }
    }
  }
}

function nodefile(file) {
  return path.join(process.cwd(), file);
}

var jobs = [];

//bg [job_spec] command function
function bg(cmd) {
  var job = cmd[1];
  if (job === undefined) {
    console.log("bg: no job specified");
    process.stdout.write(`${currentPath}:~$ `);
  } else {
    return runInBg(job);
    var jobNum = job.substring(1);
    if (jobNum > jobs.length) {
      console.log("bg: no such job");
      process.stdout.write(`${currentPath}:~$ `);
    } else {
      var job = jobs[jobNum - 1];
      if (job.status === "stopped") {
        job.status = "running";
        job.process.kill("SIGCONT");
        process.stdout.write(`${currentPath}:~$ `);
      } else {
        console.log("bg: job already in background");
        process.stdout.write(`${currentPath}:~$ `);
      }
    }
  }
}

//auto suggestion in terminal

//<path_to_binary> <args>-c <command> to run a command
//<path_to_binary> <args> command function
function pathToBinary(cmd) {
  var command = cmd[0];
  var args = cmd.slice(1);
  var process = spawn(command, args);
  process.stdout.on("data", (data) => {
    console.log(data.toString());
    process.stdout.write(`${currentPath}:~$ `);
  });
  process.stderr.on("data", (data) => {
    console.log(data.toString());
    process.stdout.write(`${currentPath}:~$ `);
  });
  process.on("close", (code) => {
    process.stdout.write(`${currentPath}:~$ `);
  });
}
// ctrl + c to kill the current process
process.on("SIGINT", () => {
  process.exit();
});

function run(cmd) {
  if (cmd.indexOf("ls") === 0) {
    if (cmd.split(" ")[1]) {
      var dir = cmd.split(" ")[1];
      ls(dir);
    } else {
      ls();
    }
  } else if (cmd.indexOf("cd") === 0) {
    if (!cmd.split(" ")[1]) {
      console.log("cd..: command not found");
      process.stdout.write(`${currentPath}:~$ `);
    } else {
      var dir = cmd.split(" ")[1];
      cd(dir);
    }
  } else if (cmd === "pwd") {
    console.log(currentPath);
    process.stdout.write(`${currentPath}:~$ `);
  } else if (cmd === "exit") {
    process.exit();
  } else if (cmd.indexOf("node") === 0) {
    nodefile(cmd.split(" ")[1]);
  } else if (cmd.indexOf("fg") === 0) {
    fg(cmd.split(" "));
  } else if (cmd.indexOf("bg") === 0) {
    bg(cmd.split(" "));
  } else if (cmd.indexOf("/") === 0) {
    pathToBinary(cmd.split(" "));
  } else {
    console.log("Unknown command");
    process.stdout.write(`${currentPath}:~$ `);
  }
}

process.stdin.resume();
process.stdin.setEncoding("utf8");
process.stdout.write("\x1b[36m");
process.stdout.write(`${currentPath}:~$ `);
//Ctrl + Z - Sends a SIGTSTP to the spawned process
process.on("SIGTSTP", () => {
  process.stdout.write(`${currentPath}:~$ `);
});
process.stdin.on("end", function () {
  process.stdout.write("end");
});
process.stdin.on("data", function (chunk) {
  var cmd = chunk.trim();
  run(cmd);
});
