import { CommandHandler } from "../CommandHandler";
import { ICommand } from "../Commands";
import DebugConsoleProcess from "../DebugConsoleProcess";


const indent = (indentCount: number = 1) => ' '.repeat(2).repeat(indentCount);


export function helpFunction(process: DebugConsoleProcess, commandHandler: CommandHandler, args: string[]) {
    if (args[1] !== undefined) {
        // help about a specific command or group
        const commandQuery: string = args[1];
        if (commandHandler.getCommandBySourceMap().has(commandQuery)) { // user typed in module ID
            const out: string[] = [];
            const commands: ICommand[] = commandHandler.getCommandBySourceMap().get(commandQuery);

            out.push(`\n${indent(2)}Module '${commandQuery}' has the following commands:`);
            for (const command of commands) {
                let s = indent(3);
                s += `'${command.prefix}'`;
                if (commandHandler.getConflictMap().has(command.prefix)) {
                    s += ' [CONFLICTED]'
                }

                s += command.documentation?.shortDescription === undefined
                    ? ''
                    : ": " + command.documentation?.shortDescription
                out.push(s);
            }
            console.info(out.join("\n") + "\n");

        } else if (commandHandler.getPrefixMap().has(commandQuery)) { // user typed in prefix
            const out: string[] = [];

            const command: ICommand = commandHandler.getPrefixMap().get(commandQuery);
            if (command.source === "conflict") {
                out.push(
                    `'${commandQuery}' has multiple conflicts.`,
                    `\n${indent(2)}For more information about each command, type <moduleID>.${commandQuery}`
                )
                const conflicts: ICommand[] = commandHandler.getConflictMap().get(command.prefix);

                for (const conflict of conflicts) {
                    out.push(`${indent(3)}${conflict.prefix} -> ${conflict.source}.${conflict.prefix}`);
                }
                console.warn(out.join("\n") + "\n");
            } else {
                const out: string[] = [];

                if (command.documentation === undefined || Object.keys(command.documentation).length === 0) {
                    out.push(`No documentation found for '${command.prefix}'`);
                } else {
                    out.push(command.documentation.shortDescription.trim());
                }

                out.push(`${indent(2)}Source: ${command.source}`);

                if (command.documentation?.longDescription) {
                    out.push(``,
                        indent(2) + command.documentation.longDescription.trim());
                }
                console.info(out.join("\n") + "\n");
            }


        } else {
            console.error("No matching moduleID or command prefixes found.");
        }
    } else {
        const out: string[] = [];
        out.push(
            "\nTo learn more about a command, type 'help <command>' or '? <command>'",
            `\nYou can access all commands as '<moduleID>.<command>' (e.g. 'aarontburn.Debug_Console.help')\n`
        );
        commandHandler.getCommandBySourceMap().forEach((commands: ICommand[], source: string) => {

            out.push(`${indent(2)}${source}:`);
            for (const command of commands) {
                let s = indent(3);
                s += `'${command.prefix}'`
                if (commandHandler.getConflictMap().has(command.prefix)) {
                    s += ' [CONFLICTED]';
                }

                s += command.documentation?.shortDescription === undefined
                    ? ''
                    : ": " + command.documentation?.shortDescription;
                out.push(s);

            }
            out.push('');
        });
        console.info(out.join("\n"));
    }




}