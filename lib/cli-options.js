let program = require("commander");
let fs = require("fs");

function CliOptions() {};

CliOptions.start = function(DataManager) {
  this.options = {};

  program
  .option("-d, --default", "Sets the target sink as the default sink (defaults to this without -d or -m flags)")
  .option("-m, --mute", "Sets all memorized sinks except the target as muted")
  .version(DataManager.package.version);

  program
  .command("switch <friendly-name>")
  .description("Switches to the specific sink")
  .action(friendlyName => {
    this.command = "switch";
    this.options.friendlyName = friendlyName;
  });

  program
  .command("toggle")
  .description("Switches to the next sink in the list")
  .action(() => {
    this.command = "toggle";
  });

  program
  .command("set-sink <friendly-name> <sink-name>")
  .description("Adds or replaces a sink")
  .action((friendlyName, sinkName) => {
    this.command = "set-sink";
    this.options.friendlyName = friendlyName;
    this.options.sinkName = sinkName;
  });

  program
  .command("remove-sink <friendly-name>")
  .description("Removes (forgets) a sink")
  .action(friendlyName => {
    this.command = "remove-sink";
    this.options.friendlyName = friendlyName;
  });

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

  program
  .parse(process.argv);

  this.program = program;

  if(process.argv.length <= 2) program.help();
};

module.exports = CliOptions;
