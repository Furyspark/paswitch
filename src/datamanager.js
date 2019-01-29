const fs = require("fs");
const os = require("os");
const mkdirp = require("mkdirp");
const lodash = require("lodash");
const path = require("path");

function DataManager() {
};

DataManager.configPath = os.homedir() + "/.config/paswitch"
DataManager.configFilePath = DataManager.configPath + "/config";
DataManager.config = {};
DataManager.package = {};

DataManager.start = function() {
  return new Promise((resolve, reject) => {
    // Read package.json
    this.readPackageJSON()
    .then(data => {
      this.package = data;
    // Create config directory
      return this.createConfigDirectory();
    })
    .then(() => {
    // Load config file
      return this.loadConfig();
    })
    .then(data => {
    // Read config file
      this.readConfig(data);
      // Done
      resolve();
    })
    .catch(err => {
      // Error: reject
      reject(err);
    });
  });
};

DataManager.getDefaultConfig = function() {
  return {
    currentSink: "",
    notifyEnabled: false,
    sinks: []
  };
};

DataManager.loadConfig = function() {
  return new Promise((resolve, reject) => {
    fs.readFile(this.configFilePath, function(err, data) {
      if(err) {
        if(err.code === "ENOENT") resolve({});
        else reject(err);
      }
      else resolve(JSON.parse(data.toString()));
    });
  });
};

DataManager.createConfigDirectory = function() {
  return new Promise((resolve, reject) => {
    mkdirp(this.configPath, err => {
      if(err) reject(err);
      else resolve();
    });
  });
};

DataManager.readConfig = function(data) {
  let json = data;
  this.config = lodash.merge(this.getDefaultConfig(), json);
};

DataManager.readPackageJSON = function() {
  return new Promise((resolve, reject) => {
    let filePath = path.join(__dirname, "..", "package.json");
    fs.readFile(filePath, (err, data) => {
      if(err) reject(err);
      else resolve(JSON.parse(data.toString()));
    });
  });
};

DataManager.saveConfig = function() {
  return new Promise((resolve, reject) => {
    fs.writeFile(this.configFilePath, JSON.stringify(this.config, null, 2), function(err) {
      if(err) reject(err);
      else resolve();
    });
  });
};

DataManager.setSink = function(name, sinkName) {
  // Remove old sink
  this.removeSink(name);
  // Add new sink
  let sinkObj = {
    name: name,
    sinkName: sinkName
  };
  this.config.sinks.push(sinkObj);
};

DataManager.removeSink = function(name) {
  for(let a = 0;a < this.config.sinks.length;a++) {
    let sinkObj = this.config.sinks[a];
    if(sinkObj.name === name) {
      this.config.sinks.splice(a, 1);
      return true;
    }
  }
  return false;
};

module.exports = DataManager;
