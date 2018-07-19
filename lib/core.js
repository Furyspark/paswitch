let DataManager = require("./datamanager");
const CliOptions = require("./cli-options");
const spawn = require("child_process").spawn;

function Core() {};

Core.start = function() {
  DataManager.start()
  .catch(err => { console.error(err); })
  .then(() => {
    CliOptions.start(DataManager);
    this.run();
  });
};

Core.run = function() {
  // Switch to sink
  if(CliOptions.command === "switch") {
    let sink = DataManager.config.sinks.filter(obj => { return obj.name === CliOptions.options.friendlyName; })[0];
    if(sink == null) console.error("Could not find a sink with a friendly name of '"+CliOptions.options.friendlyName+"'");
    else this.switchToSink(CliOptions.options.friendlyName);
  }
  // Toggle sink output
  else if(CliOptions.command === "toggle") {
    let currentSink = DataManager.config.currentSink || DataManager.config.sinks[0].name;
    let sinkArr = DataManager.config.sinks;
    let currentIndex = sinkArr.indexOf(
      sinkArr.filter(obj => { return obj.name === currentSink; })[0]
    );
    let targetIndex = (currentIndex + 1) % sinkArr.length;
    let targetSinkObj = sinkArr[targetIndex];
    this.switchToSink(targetSinkObj.name);
  }
  // Set/add sink
  else if(CliOptions.command === "set-sink") {
    let name = CliOptions.options.friendlyName;
    if(name.length > 24) console.log("Please use a name with at most 24 characters");
    else DataManager.setSink(CliOptions.options.friendlyName, CliOptions.options.sinkName);
  }
  // Remove sink
  else if(CliOptions.command === "remove-sink") {
    if(!DataManager.removeSink(CliOptions.options.friendlyName)) {
      console.log("No sink with given name '"+CliOptions.options.friendlyName+"' found");
    }
  }

  // Save config
  DataManager.saveConfig();
};

Core.switchToSink = function(name) {
  DataManager.config.currentSink = name;
  let sinkArray = DataManager.config.sinks;
  for(let a = 0;a < sinkArray.length;a++) {
    let sinkObj = sinkArray[a];
    if(sinkObj.name === name) this.enableSink(sinkObj.sinkName);
    else this.disableSink(sinkObj.sinkName);
  }
};

Core.enableSink = function(sinkName) {
  let proc = spawn("pacmd", ["set-sink-mute", sinkName, "0"]);
  proc.stdout.on("data", (data) => {
    let str = data.toString();
    if(str.trim() === "No sink found by this name or index.") {
      console.error("Could not enable sink "+sinkName+"\nCheck if the sink is still available");
    }
  });
};

Core.disableSink = function(sinkName) {
  let proc = spawn("pacmd", ["set-sink-mute", sinkName, "1"]);
  proc.stdout.on("data", (data) => {
    let str = data.toString();
    if(str.trim() === "No sink found by this name or index.") {
      console.error("Could not disable sink "+sinkName+"\nCheck if the sink is still available");
    }
  });
};

module.exports = Core;
