const spawn = require("child_process").spawn;
const Core  = require("./core");

function Pacmd() {};

Pacmd.getSinkData = function() {
  return new Promise((resolve, reject) => {
    let proc = spawn("pacmd", ["list-sinks"]);
    let resultStr = "";
    proc.stdout.on("data", (data) => {
      resultStr += data.toString();
    });
    proc.on("close", (code, signal) => {
      if(code > 0) reject(code);
      else {
        // Parse data
        let lines = resultStr.split(/[\n\r]/);
        let deviceIndex = -1;
        let data = {};
        for(let a = 0;a < lines.length;a++) {
          let line = lines[a];
          if(line.match(/^\s*(?:\*\s*)?index:\s*([0-9]+)/)) {
            deviceIndex = parseInt(RegExp.$1);
            data[deviceIndex] = {};
          }
          else if(line.match(/\s*name:\s*<(.*)>\s*/) && deviceIndex >= 0) {
            data[deviceIndex].sink = RegExp.$1;
          }
          else if(line.match(/\s*media\.name\s*=\s*"(.*)"\s*/) && deviceIndex >= 0) {
            data[deviceIndex].name = RegExp.$1;
          }
          else if(line.match(/\s*device\.description\s*=\s*"(.*)"\s*/) && deviceIndex >= 0) {
            data[deviceIndex].name = RegExp.$1;
          }
        }
        resolve(data);
      }
    });
  });
};

Pacmd.muteSink = function(sinkName, mute) {
  return new Promise(resolve => {
    let success = true;
    let proc = spawn("pacmd", ["set-sink-mute", sinkName, mute === true ? "1" : "0"]);
    // Event: Data (something went wrong)
    proc.stdout.on("data", data => {
      let str = data.toString();
      if(str.trim() === "No sink found by this name or index.") {
        success = false;
      }
    });
    // Event: Close; resolve with result
    proc.on("close", (code, signal) => {
      resolve(success);
    });
  });
};

Pacmd.setDefaultSink = function(sinkName) {
  return new Promise(resolve => {
    let success = true;
    let proc = spawn("pacmd", ["set-default-sink", sinkName]);
    // Event: Data (something went wrong)
    proc.stdout.on("data", (data) => {
      let str = data.toString();
      if(str.match(/Sink (?:.+) does not exist./)) {
        success = false;
      }
    });
    // Event: Close; resolve with result
    proc.on("close", (code, signal) => {
      resolve(success);
    });
  });
};

Pacmd.getSinkInputs = function() {
  return new Promise(resolve => {
    let proc = spawn("pacmd", ["list-sink-inputs"]);
    let str = "";
    proc.stdout.on("data", data => {
      str += data.toString();
    });
    proc.on("close", (code, signal) => {
      let result = [];
      let lines = str.split(/[\n\r]/);
      let curObj = null;
      for(let a = 0;a < lines.length;a++) {
        let line = lines[a];
        if(line.match(/^\s*index:\s+([0-9]+)\s*$/)) {
          curObj = { index: parseInt(RegExp.$1), applicationName: "", type: "" };
          result.push(curObj);
        }
        else if(curObj != null && line.match(/^\s*application\.name\s+=\s+"(.+)"\s*$/)) {
          curObj.applicationName = RegExp.$1;
        }
        else if(curObj != null && line.match(/^\s*media\.name\s+=\s+"(.+)"\s*$/)) {
          curObj.type = RegExp.$1;
        }
      }
      resolve(result);
    });
  });
};

Pacmd.moveSinkInputs = function(sink, sinkInputs) {
  return new Promise(resolve => {
    if(sinkInputs == null) {
      this.getSinkInputs()
      .then(newSinkInputs => {
        this.moveSinkInputs(sink, newSinkInputs)
        .then(() => { resolve(); });
      });
    }

    else {
      let sinkInputCount = 0;
      sinkInputs = sinkInputs.filter(obj => { return obj.type === "playback"; } );
      for(let a = 0;a < sinkInputs.length;a++) {
        let sinkInput = sinkInputs[a];
        let proc = spawn("pacmd", ["move-sink-input", sinkInput.index.toString(), sink]);
        proc.on("close", (code, signal) => {
          sinkInputCount++;
          if(sinkInputCount === sinkInputs.length) resolve();
        });
      }
    }
  });
};

module.exports = Pacmd;
