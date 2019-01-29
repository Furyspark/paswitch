const program = require("commander");
const fs = require("fs");
const TypeCaster = require("./typecaster");
const DataManager = require("./datamanager");

function CliOptions() {};

CliOptions.start = function() {
  this.options = {};

  // Set options
  program
  .option("-d, --default", "Sets the target sink as the default sink")
  .option("-m, --mute", "Sets all memorized sinks except the target as muted")
  .option("-r, --relocate", "Moves all sink inputs to the target sink")
  .version(DataManager.package.version);

  // Command: Switch to sink
  program
  .command("switch <friendly-name>")
  .description("Switches to the specific sink")
  .action(friendlyName => {
    this.command = "switch";
    this.options.friendlyName = friendlyName;
  });

  // Command: Toggle sink
  program
  .command("toggle")
  .description("Switches to the next sink in the list")
  .action(() => {
    this.command = "toggle";
  });

  // Command: Set sink
  program
  .command("set-sink <friendly-name> <sink-name>")
  .description("Adds or replaces a sink")
  .action((friendlyName, sinkName) => {
    this.command = "set-sink";
    this.options.friendlyName = friendlyName;
    this.options.sinkName = sinkName.replace(/<?(.+)>?/, "$1").trim();
  });

  // Command: Remove sink
  program
  .command("remove-sink <friendly-name>")
  .description("Removes (forgets) a sink")
  .action(friendlyName => {
    this.command = "remove-sink";
    this.options.friendlyName = friendlyName;
  });

  // Command: Start wizard
  program
  .command("wizard <type>")
  .description("Starts a wizard")
  .action(type => {
    this.command = "wizard";
    this.wizardType = type;
  });

  // Command: List memorized sinks
  program
  .command("list")
  .description("Lists all memorized sinks")
  .action(() => {
    console.log("Available sinks:");
    console.log("| Friendly Name".padEnd(26) + "| Sink Name");
    for(let a = 0;a < DataManager.config.sinks.length;a++) {
      let sinkObj = DataManager.config.sinks[a];
      console.log("  "+sinkObj.name.padEnd(26) + sinkObj.sinkName);
    }
  });

  // Command: Enable/disable notify
  program
  .command("notify <value>")
  .description("Enable or disable notify, value should be 'enable' or 'disable'")
  .action(value => {
    value = TypeCaster.getBool(value);
    DataManager.config.notifyEnabled = value;
    if(value === true) console.log("Notifications enabled");
    else console.log("Notifications disabled");
  });

  // Custom help
  program.on("--help", function() {
    console.log("");
    console.log("  Wizard types:");
    console.log("");
    console.log("    add-sink                              Wizard to add a sink");
    console.log("    remove-sink                           Wizard to remove a sink");
  });

  // Parse program
  program
  .parse(process.argv);

  this.program = program;

  if(process.argv.length <= 2) program.help();
};

module.exports = CliOptions;
