import { getCommandList, ICommand } from "./Commands";
import { DebugConsoleProcess } from "./DebugConsoleProcess";

export class CommandHandler {
    private prefixMap: Map<string, ICommand> = new Map();
    private conflictMap: Map<string, ICommand[]> = new Map();
    private debugProcess: DebugConsoleProcess;


    private commandBySourceMap: Map<string, ICommand[]> = new Map();

    public constructor(debugProcess: DebugConsoleProcess) {
        this.debugProcess = debugProcess;
        this.registerDefaultCommands();
    }

    public getPrefixMap(): Map<string, ICommand> {
        return this.prefixMap;
    }

    public getCommandBySourceMap(): Map<string, ICommand[]> {
        return this.commandBySourceMap;
    }

    public getConflictMap(): Map<string, ICommand[]> {
        return this.conflictMap;
    }

    private registerDefaultCommands(): void {
        const defaultCommands: ICommand[] = getCommandList(this.debugProcess, this);
        for (const command of defaultCommands) {
            this.addCommand({ ...command, source: "aarontburn.Debug_Console" });
        }
    }


    public addCommand(command: ICommand) {
        // Duplicate prefix from same source
        if (this.prefixMap.has(command.source + "." + command.prefix)) {
            return new Error(`Unable to add duplicate prefixes from the same source. Source: ${command.source} | Prefix: ${command.prefix}`);
        }


        if (this.commandBySourceMap.get(command.source) === undefined) {
            this.commandBySourceMap.set(command.source, []);
        }
        this.commandBySourceMap.get(command.source).push(command);



        // Add fallback command (e.g. built_ins.Settings.help)
        this.prefixMap.set(command.source + "." + command.prefix, command);

        if (!this.prefixMap.has(command.prefix)) {
            this.prefixMap.set(command.prefix, command);

        } else {
            // Conflict
            if (!this.conflictMap.has(command.prefix)) { // First conflict found (2 duplicate prefixes)
                this.conflictMap.set(command.prefix, [this.prefixMap.get(command.prefix)]);
            }

            const prefixConflicts: ICommand[] = this.conflictMap.get(command.prefix);
            prefixConflicts.push(command);


            const replacementFunction = () => {
                const fallbackList: string[] = [" "];
                for (const conflict of prefixConflicts) {
                    fallbackList.push(`${conflict.prefix} -> ${conflict.source}.${conflict.prefix}`);
                }

                console.warn(`Could not execute command '${command.prefix}' due to conflicting command prefixes found.` + fallbackList.join("\n\t\t\t"));
            }
            this.prefixMap.set(command.prefix, { source: "conflict", prefix: command.prefix, executeCommand: replacementFunction })
        }
    }

    public executeCommand(command: string) {
        const prefix: string = command.split(" ")[0];

        if (this.prefixMap.has(prefix)) {
            this.prefixMap.get(prefix).executeCommand(command.split(" "));
        } else {
            console.error(`'${prefix}' is not recognized as a command.`);
        }


    }




}