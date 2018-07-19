# paswitch

CLI application to switch between PulseAudio sinks, as defined by the user with a friendly name.

# Requirements

For this tool to function you must have the `pacmd` program installed on your (Linux) machine.

Optionally, you need `libnotify` (`libnotify` on Pacman for example) if you want notifications.

# Installation

`npm install -g paswitch`

# Configuration

The first time paswitch is called, it will create a configuration file (under $HOME/.config/paswitch/) along with the command you enter.

Before you can begin, you need to add some sink data.

# Usage

## Add/set sink

Syntax: `paswitch set-sink <friendly-name> <sink-name>`

Where `<friendly-name>` is the shorthand name you want to give to the sink, and `<sink-name>` is the name of the sink as seen in the command `pacmd list-sinks | grep "name:"` between the `<` and `>` characters.

## Remove sink

Syntax: `paswitch remove-sink <friendly-name>`

Where `<friendly-name>` is the shorthand name you have given the sink earlier.

This will forget the sink.

## Switch to a sink

Syntax: `paswitch switch <friendly-name>`

Where `<friendly-name>` is the shorthand name you have given the sink earlier.

This will switch to that sink as the default/unmuted one.

## Toggle sinks

Syntax: `paswitch toggle`

This will set the next sink in the list as the default/unmuted one.

## List sinks

Syntax: `paswitch list`

This will list all memorized sinks.

## Options

```
-d, --default      -- Switches to the target sink by making it the default sink (defaults to this is no -d and -m flags are specified)
-m, --mute         -- Switches to the target sink by unmuting it and muting all other memorized sinks
```

Note that you can combine `--default` and `--mute` options.
