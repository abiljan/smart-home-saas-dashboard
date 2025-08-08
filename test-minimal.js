import { execSync } from "child_process"; console.log("Test works"); execSync("python --version", {stdio: "pipe"}); console.log("Python works");
