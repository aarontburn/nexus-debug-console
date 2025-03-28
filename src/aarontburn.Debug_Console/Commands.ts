import { CommandHandler } from "./CommandHandler";
import { helpFunction } from "./commands/Help";
import { DebugConsoleProcess } from "./DebugConsoleProcess";
import { StorageHandler } from "./module_builder/StorageHandler";
import { exec } from "child_process"

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

export const getCommandList = (process: DebugConsoleProcess, commandHandler: CommandHandler): ICommand[] => {

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
                helpFunction(process, commandHandler, args);
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
                helpFunction(process, commandHandler, args);
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
                process.sendToRenderer("clear");
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
                    path = StorageHandler.PATH
                }
                console.info(`Opening directory '${path}'`);
                exec(`start "" "${path}"`, (err, stdout, stderr) => {
                    if (err) {
                        console.error(`Could not open directory: ${err}`);
                    }
                });
            }
        }
    ]
}
