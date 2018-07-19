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
    if(sinkObj.name === name) this.enableSink(sinkObj.sinkName, this.getSwitchType());
    else this.disableSink(sinkObj.sinkName, this.getSwitchType());
  }
};

Core.enableSink = function(sinkName, switchType) {
  // Set default
  if(switchType.default) {
    let proc = spawn("pacmd", ["set-default-sink", sinkName]);
    proc.stdout.on("data", (data) => {
      let str = data.toString();
      if(str.match(/Sink (?:.+) does not exist./)) {
        console.error("Could not set sink "+sinkName+" as the default sink\nCheck if the sink is still available");
      }
    });
  }
  // Mute
  if(switchType.mute) {
    let proc = spawn("pacmd", ["set-sink-mute", sinkName, "0"]);
    proc.stdout.on("data", (data) => {
      let str = data.toString();
      if(str.trim() === "No sink found by this name or index.") {
        console.error("Could not unmute sink "+sinkName+"\nCheck if the sink is still available");
      }
    });
  }
};

Core.disableSink = function(sinkName, switchType) {
  // Mute
  if(switchType.mute) {
    let proc = spawn("pacmd", ["set-sink-mute", sinkName, "1"]);
    proc.stdout.on("data", (data) => {
      let str = data.toString();
      if(str.trim() === "No sink found by this name or index.") {
        console.error("Could not mute sink "+sinkName+"\nCheck if the sink is still available");
      }
    });
  }
};

Core.getSwitchType = function() {
  let result = {
    default: false,
    mute: false
  };
  if(CliOptions.program.mute != null) {
    result.mute = true;
  }
  if(CliOptions.program.default != null || (CliOptions.program.default == null && CliOptions.program.mute == null)) {
    result.default = true;
  }
  return result;
};

module.exports = Core;
