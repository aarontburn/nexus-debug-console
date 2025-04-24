import { CommandHandler } from "../command-handler";
import DebugConsoleProcess from "../main";
import { exec } from "child_process"
import { DataResponse, DIRECTORIES, HTTPStatusCodes } from "@nexus/nexus-module-builder";
import { helpFunction } from "./help";
import * as os from "os";

export type CommandCallback = (args: string[]) => void;

export interface ICommand {
    source: string;
    prefix: string;
    executeCommand: CommandCallback;
    documentation?: {
        shortDescription?: string;
        longDescription?: string;
    };
}

export const getCommandList = (debugProcess: DebugConsoleProcess, commandHandler: CommandHandler): ICommand[] => {

    return [
        {
            source: "aarontburn.Debug_Console",
            prefix: "help",
            documentation: {
                shortDescription: "Displays all commands, or information about a single command.",
                longDescription: `
Usage: help [moduleID / command]

        - Synonymous for '?'
        - When used without any arguments, this command will display all registered commands
        - To get information about a specific command, type (without brackets) 'help [command]'
        - To get all commands from a specific module, type (without brackets) 'help [moduleID]'

        Example: Get information about the 'clear' command.
        >> help clear`
            },
            executeCommand: function (args: string[]): void {
                helpFunction(debugProcess, commandHandler, args);
            }
        },
        {
            source: "aarontburn.Debug_Console",
            prefix: "?",
            documentation: {
                shortDescription: "Displays all commands, or information about a single command.",
                longDescription: `
Usage: ? [moduleID / command]

        - Synonymous for 'help'
        - When used without any arguments, this command will display all registered commands
        - To get information about a specific command, type (without brackets) '? [command]'
        - To get all commands from a specific module, type (without brackets) '? [moduleID]'

        Example: Get information about the 'clear' command.
        >> ? clear`
            },
            executeCommand: function (args: string[]): void {
                helpFunction(debugProcess, commandHandler, args);
            }
        },
        {
            source: "aarontburn.Debug_Console",
            prefix: "clear",
            documentation: {
                shortDescription: "Clears the console. Not reversible.",
                longDescription: `
Usage: clear

        - Clears the terminal. This action is not reversible.`
            },
            executeCommand: function (args: string[]): void {
                debugProcess.sendToRenderer("clear");
            }
        },
        {
            source: "aarontburn.Debug_Console",
            prefix: "dir",
            documentation: {
                shortDescription: "Opens a directory.",
                longDescription: `
Usage: dir [path]

        - Opens a directory. If 'path' isn't provided, opens the storage for the application.
        
        Example: Navigating to the 'Program Files' directory
        >> dir C:\\Program Files`
            },
            executeCommand: function (args: string[]): void {
                let path: string = args.slice(1).join(' ');
                if (path === '') {
                    path = DIRECTORIES.ROOT
                }
                console.info(`Opening directory '${path}'`);
                exec(`start "" "${path}"`, (err, stdout, stderr) => {
                    if (err) {
                        console.error(`Could not open directory: ${err}`);
                    }
                });
            }
        },
        {
            source: "aarontburn.Debug_Console",
            prefix: "devtools",
            executeCommand: function (args: string[]): void {
                const possibleModes: string[] = ['--left', '--right', '--bottom', '--detach'];

                const moduleID: string = args[1];
                const mode: string = args[2];

                if (mode !== undefined && !possibleModes.includes(mode)) {
                    console.error(`Invalid devtool mode passed ('${mode}'); Possible values are: ${JSON.stringify(possibleModes)}`)
                    return;
                }

                if (!moduleID) {
                    console.error("Missing argument in position 1: <moduleID>; Usage: 'devtools <moduleID> [--detached | --left | --right | --bottom | --undocked]'\n");
                    return;
                }

                debugProcess.requestExternal("nexus.Main", "open-dev-tools", mode?.slice(2), moduleID)
                    .then((response: DataResponse) => {
                        if (response.code === HTTPStatusCodes.OK) {
                            console.info(response.body + "\n");
                        } else {
                            console.error(response.body + "\n");
                        }
                    });
            },
            documentation: {
                shortDescription: "Opens the web inspector for a specific module.",
                longDescription: `
Usage: devtools <moduleID> [--detached | --left | --right | --bottom | --undocked]

        - Opens the developer tools for a specified module.
        - This module has direct permission to open the devtools of any module.
        - If a dock mode isn't provided, this will default to the right.
        - If the devtools are already open for the specified module, this will close it first.
        
        Example: Opening the devtools of the Settings module as its' own window.
        >> devtools nexus.Settings --undocked`
            }
        },
        {
            source: "aarontburn.Debug_Console",
            prefix: "argv",
            executeCommand: function (args: string[]): void {
                console.info(JSON.stringify(process.argv, undefined, 4) + "\n");
            },
            documentation: {
                shortDescription: "Lists all command-line arguments."
            }
        },
        {
            source: "aarontburn.Debug_Console",
            prefix: "reload",
            executeCommand: function (args: string[]): void {
                const moduleID: string = args[1];

                if (!moduleID) {
                    console.error("Missing argument in position 1: <moduleID>; Usage: 'reload <moduleID> [--force]'\n");
                    return;
                }

                debugProcess.requestExternal("nexus.Main", "reload", moduleID, args[2])
                    .then((response: DataResponse) => {
                        if (response.code === HTTPStatusCodes.OK) {
                            console.info(response.body + "\n");
                        } else {
                            console.error(response.body + "\n");
                        }
                    });
            },
            documentation: {
                shortDescription: "Reloads a specific module.",
                longDescription: `
Usage: reload <moduleID> [--force]

        - Reloads a specific module.
        - This module has direct permission to refresh any module.
        - This will only work on non-internal modules.
        - If the '--force' flag is provided, this will bypass the cache and reload.
        
        Example: Reloading the Settings module.
        >> reload nexus.Settings --force`
            }
        },

    ]
}
