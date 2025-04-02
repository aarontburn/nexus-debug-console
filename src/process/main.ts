import * as path from "path";
import { CommandHandler } from "./CommandHandler";
import { ICommand } from "./Commands";
import { IPCSource, Process, Setting } from "@nexus/nexus-module-builder"
import { BooleanSetting } from "@nexus/nexus-module-builder/settings/types";

const MODULE_NAME: string = "{EXPORTED_MODULE_NAME}";
const MODULE_ID: string = "{EXPORTED_MODULE_ID}";
const HTML_PATH: string = path.join(__dirname, "../renderer/index.html");


export default class DebugConsoleProcess extends Process {


    private logMessages: string[] = [];
    private commandHandler: CommandHandler = new CommandHandler(this);

    /**
     *  The constructor. Should not directly be called, 
     *      and should not contain logic relevant to the renderer.
     */
    public constructor() {
        super(MODULE_ID, MODULE_NAME, HTML_PATH);

        this.overrideLoggers();

    }

    private overrideLoggers(): void {
        // Override some of the default logging functions and prefixes them with an identifier
        // that can be checked in stdout or stderr. 

        // Override console.log
        const originalLog = console.log;
        console.log = (message: any) => { originalLog.apply(console, ["==log==", message]) }

        // Override console.info
        const originalInfo = console.info;
        console.info = (message: any) => { originalInfo.apply(console, ["==info==", message]) }

        // Override console.error
        const originalError = console.error;
        console.error = (message: any) => { originalError.apply(console, ["==error==", message]) }

        // Override console.warn
        const originalWarn = console.warn;
        console.warn = (message: any) => { originalWarn.apply(console, ["==warn==", message]) }

        // ---------------

        // Overwrite default stdout.write to check the identifier.
        ((logArray: string[], rendererFunc: (eventType: string, ...data: any) => void) => {
            const originalWrite = process.stdout.write;
            process.stdout.write = function (chunk: string | Uint8Array, encoding?: BufferEncoding, callback?: (error?: Error | null) => void): boolean {
                let formattedMessage: string = typeof chunk === "string" ? chunk : chunk.toString();
                if (formattedMessage.startsWith("==log==")) {
                    formattedMessage = formattedMessage.substring("==log==".length + 1);
                    rendererFunc("log", formattedMessage);

                } else if (formattedMessage.startsWith("==info==")) {
                    formattedMessage = formattedMessage.substring("==info==".length + 1);
                    rendererFunc("info", formattedMessage);

                } else {
                    // Default to log
                    rendererFunc("log", formattedMessage);
                }

                logArray.push(formattedMessage);

                return originalWrite.apply(process.stdout, [formattedMessage, encoding, callback]);
            } as typeof process.stdout.write;

        })(this.logMessages, this.sendToRenderer.bind(this));

        // Overwrite default stderr.write to check the identifier.
        ((logArray: string[], rendererFunc: (eventType: string, ...data: any) => void) => {
            const originalWrite = process.stderr.write;
            process.stderr.write = function (chunk: any, encoding?: BufferEncoding, callback?: (error?: Error | null) => void): boolean {
                let formattedMessage: string = typeof chunk === "string" ? chunk : chunk.toString();
                if (formattedMessage.startsWith("==warn==")) {
                    formattedMessage = formattedMessage.substring("==warn==".length + 1);
                    rendererFunc("warn", formattedMessage);

                } else if (formattedMessage.startsWith("==error==")) {
                    formattedMessage = formattedMessage.substring("==error==".length + 1);
                    rendererFunc("error", formattedMessage);

                } else {
                    // Default to error
                    rendererFunc("error", formattedMessage);
                }

                logArray.push(formattedMessage);

                return originalWrite.apply(process.stdout, [formattedMessage, encoding, callback]);
            } as typeof process.stderr.write;

        })(this.logMessages, this.sendToRenderer.bind(this));

    }

    /**
     *  The entry point of the module. Will be called once the 
     *      renderer sends the 'init' signal.
     */
    public initialize(): void {
        super.initialize(); // This should be called.
        this.sendToRenderer("settings", {
            showTimeStamps: this.getSettings().getSetting("show_timestamps").getValue(),
            showLogLevels: this.getSettings().getSetting("show_log_levels").getValue()
        })
    }

    public onGUIShown(): void {
        this.sendToRenderer("focus");
    }


    public registerSettings(): (Setting<unknown> | string)[] {
        return [
            new BooleanSetting(this)
                .setName("Show Timestamps")
                .setDefault(true)
                .setAccessID("show_timestamps"),

            new BooleanSetting(this)
                .setName("Show Log Levels")
                .setDefault(true)
                .setAccessID("show_log_levels"),
        ]
    }


    public refreshSettings(modifiedSetting: Setting<unknown>): void {
        this.sendToRenderer("settings", {
            showTimeStamps: this.getSettings().getSetting("show_timestamps").getValue(),
            showLogLevels: this.getSettings().getSetting("show_log_levels").getValue()
        })

    }


    public async handleEvent(eventType: string, data: any[]): Promise<any> {
        switch (eventType) {
            case "init": {
                this.initialize();
                break;
            }

            case "input": {
                this.commandHandler.executeCommand(data[0].trim());
                break;
            }
            default: {
            }
        }
    }

    public async handleExternal(source: IPCSource, eventType: string, data: any[]): Promise<any> {
        switch (eventType) {
            /**
             *  @see ICommand
             *  If your module creates many of these, it may be best to create a type for correctness.
             * 
             *  Expected input:
             *  {
             *      prefix: string,
             *      executeCommand: (args: string[]) => void,
             *      documentation?: {
             *          shortDescription?: string[],
             *          longDescription?: string,
             *      }
             *  }
             */
            case "addCommandPrefix": {
                const command: unknown = data[0];

                // Validate command:
                if (this.isValidCommand(command)) {
                    this.commandHandler.addCommand({ ...command, source: source.getIPCSource() });
                } else {
                    console.error(`Could not register command from ${source.getIPCSource()} with data: ${JSON.stringify(data)}`);
                    return new Error(`Could not register command from ${source.getIPCSource()} with data: ${JSON.stringify(data)}`)
                }

                break;
            }
        }
    }

    private isValidCommand(command: any): command is ICommand {
        return command &&
            typeof command === 'object' &&
            typeof command["executeCommand"] === "function" &&
            typeof command["prefix"] === "string" &&
            command["prefix"].trim() !== ''
    }


}