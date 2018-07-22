const inquirer = require("inquirer");
const pacmd = require("./pacmd");

function PulseAudioWizard() {};

PulseAudioWizard.start = function(type, core, datamanager) {
  if(type === "add-sink") {
    this.startAddSink()
    .catch(code => { console.error(code); })
    .then(answers => {
      datamanager.setSink(answers.friendlyName, answers.sink);
      datamanager.saveConfig();
    });
    return true;
  }
  else if(type === "remove-sink") {
    if(datamanager.config.sinks.length === 0) {
      console.warn("No sinks found to remove");
      return true;
    }
    this.startRemoveSink(datamanager)
    .then(answers => {
      datamanager.removeSink(answers.name);
      datamanager.saveConfig();
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

PulseAudioWizard.startRemoveSink = function(datamanager) {
  return new Promise(resolve => {
    inquirer.prompt([
      {
        type: "list",
        name: "name",
        message: "Select the sink to forget",
        choices: datamanager.config.sinks.map(sinkObj => { return { name: sinkObj.name, value: sinkObj.name }; })
      }
    ])
    .then(answers => {
      resolve(answers);
    });
  });
};

module.exports = PulseAudioWizard;
