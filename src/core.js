const DataManager      = require("./datamanager");
const CliOptions       = require("./cli-options");
const spawn            = require("child_process").spawn;
const notifier         = require("node-notifier");
const PulseAudioWizard = require("./pulseaudiowizard");
const Pacmd            = require("./pacmd")

const WARN_NOSINKDATAFOUND = 1;
const WARN_NOSINKMUTE      = 2;
const WARN_NOSINKUNMUTE    = 3;
const WARN_NOSINKDEFAULT   = 4;

const MSG_SWITCHEDTOSINK = 1;

function Core() {};

Core.start = function() {
  DataManager.start()
  .catch(err => { console.error(err); })
  .then(() => {
    CliOptions.start();
    this.run();
  });
};

Core.run = function() {
  let doSave = true;
  // Start Add Sink Wizard
  if(CliOptions.command === "wizard") {
    PulseAudioWizard.start(CliOptions.wizardType);
    doSave = false;
  }
  // Switch to sink
  else if(CliOptions.command === "switch") {
    if(DataManager.config.sinks.length === 0) {
      this.displayWarning(WARN_NOSINKDATAFOUND);
      return;
    }
    let sink = DataManager.config.sinks.filter(obj => { return obj.name === CliOptions.options.friendlyName; })[0];
    if(sink == null) console.error("Could not find a sink with a friendly name of '"+CliOptions.options.friendlyName+"'");
    else this.switchToSink(CliOptions.options.friendlyName);
    doSave = false;
  }
  // Toggle sink output
  else if(CliOptions.command === "toggle") {
    if(DataManager.config.sinks.length === 0) {
      this.displayWarning(WARN_NOSINKDATAFOUND);
      return;
    }
    let currentSink = DataManager.config.currentSink || DataManager.config.sinks[0].name;
    let sinkArr = DataManager.config.sinks;
    let currentIndex = sinkArr.indexOf(
      sinkArr.filter(obj => { return obj.name === currentSink; })[0]
    );
    let targetIndex = (currentIndex + 1) % sinkArr.length;
    let targetSinkObj = sinkArr[targetIndex];
    this.switchToSink(targetSinkObj.name);
    doSave = false;
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
  if(doSave) DataManager.saveConfig();
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
  let sentMessage = false;
  // Set default sink
  if(switchType.default) {
    Pacmd.setDefaultSink(sinkObj.sinkName)
    .then(success => {
      if(!success) this.displayWarning(WARN_NOSINKDEFAULT, sinkObj);
      else if(!sentMessage) {
        sentMessage = true;
        this.displayMessage(MSG_SWITCHEDTOSINK, sinkObj);
      }
    });
  }
  // Unmute sink
  if(switchType.mute) {
    Pacmd.muteSink(sinkObj.sinkName, false)
    .then(success => {
      if(!success) this.displayWarning(WARN_NOSINKUNMUTE, sinkObj);
      else if(!sentMessage) {
        sentMessage = true;
        this.displayMessage(MSG_SWITCHEDTOSINK, sinkObj);
      }
    });
  }
  // Relocate sink inputs
  if(switchType.relocate) {
    Pacmd.moveSinkInputs(sinkObj.sinkName)
    .then(() => {});
  }
};

Core.disableSink = function(sinkObj, switchType) {
  let sentMessage = false;
  // Mute sink
  if(switchType.mute) {
    Pacmd.muteSink(sinkObj.sinkName, true)
    .then(success => {
      if(!success) this.displayWarning(WARN_NOSINKUNMUTE, sinkObj);
    });
  }
};

Core.getSwitchType = function() {
  let result = {
    default: CliOptions.program.default,
    mute: CliOptions.program.mute,
    relocate: CliOptions.program.relocate
  };
  return result;
};

Core.displayWarning = function(warnType, options) {
  let str = "";
  switch(warnType) {
    case WARN_NOSINKDATAFOUND:
      str = "No memorized sink, use `set-sink` first";
      break;
    case WARN_NOSINKMUTE:
      str = "Could not mute sink "+options.name+"\nCheck if the sink is still available";
      break;
    case WARN_NOSINKUNMUTE:
      str = "Could not unmute sink "+options.name+"\nCheck if the sink is still available";
      break;
    case WARN_NOSINKDEFAULT:
      str = "Could not set sink "+options.name+" as the default sink\nCheck if the sink is still available";
      break;
  }
  if(str !== "") {
    console.warn(str);
    this.notify(str);
  }
};

Core.displayMessage = function(msgType, options) {
  let str = "";
  switch(msgType) {
    case MSG_SWITCHEDTOSINK:
      str = "Switched to '"+options.name+"'";
      break;
  }
  if(str !== "") {
    console.log(str);
    this.notify(str);
  }
};

Core.notify = function(str) {
  if(!DataManager.config.notifyEnabled) return;
  notifier.notify({
    title: "PASwitch",
    message: str
  });
};

module.exports = Core;
