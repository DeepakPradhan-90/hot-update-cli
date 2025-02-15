#! /usr/bin/env node
import chalk from "chalk";
import { Option, program } from "commander";
import shell from "shelljs";
import crypto from "crypto";
import fs from "fs";

program
  .command("build")
  .description("Create bundle for the app")
  .addOption(new Option("-A, --all", "Build for all platforms"))
  .addOption(new Option("-i, --ios", "Build for only iOS"))
  .addOption(new Option("-a, --android", "Build for only Android"))
  .action(build);

program.parse();

function build(options) {
  shell.exec("rm -rf temp");
  shell.exec("rm -rf HotUpdate");
  if (options.all) {
    console.log(chalk.bold.green("Building App for all platforms..."));
    buildiOS();
    buildAndroid();
    createMetadata();
    console.log(chalk.bold.greenBright("Completed building for all platforms"));
  } else if (options.ios) {
    shell.echo(chalk.bold.green("Building App for iOS..."));
    buildiOS();
    createMetadata();
    console.log(chalk.bold.greenBright("Completed building for iOS"));
  } else if (options.android) {
    shell.echo(chalk.bold.green("Building App for Android..."));
    buildAndroid();
    createMetadata();
    console.log(chalk.bold.greenBright("Completed building for Android"));
  } else {
    shell.echo(chalk.bold.red("Please specify the platform to build"));
  }
}

function buildiOS() {
  console.log(chalk.bold.blueBright("Bundling App for iOS..."));
  shell.exec(
    "npx react-native bundle --entry-file index.js --platform ios --dev false --bundle-output temp/ios/main.jsbundle --assets-dest temp/ios",
    { silent: true }
  );
  shell.exec("mv temp/ios/main.jsbundle temp/ios/mini_main.jsbundle");
  shell.exec(
    "node_modules/react-native/sdks/hermesc/osx-bin/hermesc -emit-binary -O -out temp/ios/main.jsbundle temp/ios/mini_main.jsbundle",
    { silent: true }
  );
  shell.exec("rm temp/ios/mini_main.jsbundle");
  shell.exec("cd temp/ios && zip -r bundle.zip . && cd ../..");
}

function buildAndroid() {
  console.log(chalk.bold.blueBright("Bundling App for android..."));
  shell.exec(
    "npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output temp/android/index.android.bundle --assets-dest temp/android",
    { silent: true }
  );
  shell.exec(
    "mv temp/android/index.android.bundle temp/android/mini_index.android.bundle"
  );
  shell.exec(
    "node_modules/react-native/sdks/hermesc/osx-bin/hermesc -emit-binary -O -out temp/android/index.android.bundle temp/android/mini_index.android.bundle",
    { silent: true }
  );
  shell.exec("rm temp/android/mini_index.android.bundle");
  shell.exec("cd temp/android && zip -r bundle.zip . && cd ../..");
}

async function getHash(path) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(path)) {
      const hash = crypto.createHash("sha256");
      const rs = fs.createReadStream(path);
      rs.on("error", reject);
      rs.on("data", (chunk) => hash.update(chunk));
      rs.on("end", () => {
        const result = hash.digest("hex");
        console.log(chalk.bold.redBright("Hash for " + path + " is " + result));
        resolve(result);
      });
    } else {
      resolve("");
    }
  });
}

async function getAllHashes() {
  const iosBundleHash = await getHash("temp/ios/main.jsbundle");
  const iosArchiveHash = await getHash("temp/ios/bundle.zip");
  const androidBundleHash = await getHash("temp/android/index.android.bundle");
  const androidArchiveHash = await getHash("temp/android/bundle.zip");
  const metadata = {
    ios: {
      archiveHash: iosArchiveHash,
      bundleHash: iosBundleHash,
    },
    android: {
      archiveHash: androidArchiveHash,
      bundleHash: androidBundleHash,
    },
  };
  return metadata;
}

function createMetadata() {
  console.log(chalk.bold.blueBright("Creating metadata..."));
  getAllHashes().then((metadata) => {
    var date_time = new Date();
    const date =
      date_time.getDate() < 10
        ? "0" + date_time.getDate()
        : date_time.getDate();
    const month = date_time.getMonth() + 1;
    const monthStr = month < 10 ? "0" + month : month;
    const version = "" + date_time.getFullYear() + monthStr + date;
    const obj = {
      updateVersion: version,
      metadata: metadata,
    };
    fs.writeFileSync("temp/metadata.json", JSON.stringify(obj));
    shell.echo(chalk.bold.green("Metadata created successfully"));
    shell.exec("sh node_modules/hot-update-cli/scripts/copy.sh");
    console.log(
      chalk.bold.greenBright("Completed building for specified platforms")
    );
  });
}

export default build;
