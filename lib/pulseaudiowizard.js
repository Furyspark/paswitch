const inquirer    = require("inquirer");
const pacmd       = require("./pacmd");
const DataManager = require("./datamanager")

function PulseAudioWizard() {};

PulseAudioWizard.start = function(type) {
  if(type === "add-sink") {
    this.startAddSink()
    .catch(code => { console.error(code); })
    .then(answers => {
      DataManager.setSink(answers.friendlyName, answers.sink);
      DataManager.saveConfig();
    });
    return true;
  }
  else if(type === "remove-sink") {
    if(DataManager.config.sinks.length === 0) {
      console.warn("No sinks found to remove");
      return true;
    }
    this.startRemoveSink()
    .then(answers => {
      DataManager.removeSink(answers.name);
      DataManager.saveConfig();
    });
    return true;
  }
  else {
    console.warn("No wizard of type '"+type+"' found");
  }
  return false;
};

PulseAudioWizard.startAddSink = function() {
  return new Promise((resolve, reject) => {
    pacmd.getSinkData()
    .catch(code => { reject(code); })
    .then(data => {
      let sinkArr = [];
      for(let sinkIndex in data) {
        sinkArr.push(data[sinkIndex]);
      }

      inquirer.prompt([
        {
          type: "list",
          name: "sink",
          message: "Select the sink to add",
          choices: sinkArr.map(sinkObj => { return { name: sinkObj.name || sinkObj.sink, value: sinkObj.sink }; })
        },
        {
          type: "input",
          name: "friendlyName",
          message: "Enter a friendly name for the sink"
        }
      ])
      .then(answers => {
        resolve(answers);
      });
    });
  });
};

PulseAudioWizard.startRemoveSink = function() {
  return new Promise(resolve => {
    inquirer.prompt([
      {
        type: "list",
        name: "name",
        message: "Select the sink to forget",
        choices: DataManager.config.sinks.map(sinkObj => { return { name: sinkObj.name, value: sinkObj.name }; })
      }
    ])
    .then(answers => {
      resolve(answers);
    });
  });
};

module.exports = PulseAudioWizard;
