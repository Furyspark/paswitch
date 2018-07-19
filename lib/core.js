const DataManager = require("./datamanager");
const CliOptions = require("./cli-options");
const spawn = require("child_process").spawn;
const notifier = require("node-notifier");

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
    if(sinkObj.name === name) this.enableSink(sinkObj, this.getSwitchType());
    else this.disableSink(sinkObj, this.getSwitchType());
  }
};

Core.enableSink = function(sinkObj, switchType) {
  let hasResult = false;
  // Set default
  if(switchType.default) {
    let proc = spawn("pacmd", ["set-default-sink", sinkObj.sinkName]);
    // Event: Data (something went wrong)
    proc.stdout.on("data", (data) => {
      let str = data.toString();
      if(str.match(/Sink (?:.+) does not exist./)) {
        let str = "Could not set sink "+sinkObj.name+" as the default sink\nCheck if the sink is still available";
        console.error(str);
        this.notify(str);
        hasResult = true;
      }
    });
    // Event: Close (if hasResult is false, it probably went alright)
    proc.on("close", (code, signal) => {
      if(!hasResult) {
        this.notify("Switched to '"+sinkObj.name+"'");
      }
      hasResult = true;
    });
  }
  // Mute
  if(switchType.mute) {
    let proc = spawn("pacmd", ["set-sink-mute", sinkObj.sinkName, "0"]);
    // Event: Data (something went wrong)
    proc.stdout.on("data", (data) => {
      let str = data.toString();
      if(str.trim() === "No sink found by this name or index.") {
        let str = "Could not unmute sink "+sinkObj.name+"\nCheck if the sink is still available";
        console.error(str);
        this.notify(str);
        hasResult = true;
      }
    });
    // Event: Close (if hasResult is false, it probably went alright)
    proc.on("close", (code, signal) => {
      if(!hasResult) {
        this.notify("Switched to '"+sinkObj.name+"'");
      }
      hasResult = true;
    });
  }
};

Core.disableSink = function(sinkObj, switchType) {
  // Mute
  if(switchType.mute) {
    let proc = spawn("pacmd", ["set-sink-mute", sinkObj.sinkName, "1"]);
    proc.stdout.on("data", (data) => {
      let str = data.toString();
      if(str.trim() === "No sink found by this name or index.") {
        let str = "Could not mute sink "+sinkObj.name+"\nCheck if the sink is still available";
        console.error(str);
        this.notify(str);
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

Core.notify = function(str) {
  if(!DataManager.config.notifyEnabled) return;
  notifier.notify({
    title: "PASwitch",
    message: str
  });
};

module.exports = Core;
