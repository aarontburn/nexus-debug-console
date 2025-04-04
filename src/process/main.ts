import * as path from "path";
import { CommandHandler } from "./CommandHandler";
import { ICommand } from "./Commands";
import { IPCSource, Process, Setting } from "@nexus/nexus-module-builder"
import { BooleanSetting } from "@nexus/nexus-module-builder/settings/types";
import stackTrace from "callsite";


const MODULE_NAME: string = "{EXPORTED_MODULE_NAME}";
const MODULE_ID: string = "{EXPORTED_MODULE_ID}";
const HTML_PATH: string = path.join(__dirname, "../renderer/index.html");
const ICON_PATH: string = path.join(__dirname, "../assets/terminal.png");


const LOG_TYPES: readonly string[] = ["input", "log", "info", "warn", "error"] as const;
interface Message {
    level?: typeof LOG_TYPES[number],
    timeStamp?: string,
    message: string
}


export default class DebugConsoleProcess extends Process {


    private logMessages: Message[] = [];
    private commandHandler: CommandHandler = new CommandHandler(this);

    /**
     *  The constructor. Should not directly be called, 
     *      and should not contain logic relevant to the renderer.
     */
    public constructor() {
        super(MODULE_ID, MODULE_NAME, HTML_PATH, ICON_PATH);
        this.overrideLoggers();

    }

    private getCurrentTime(): string {
        const now: Date = new Date();
        const hours: string = String(now.getHours()).padStart(2, '0');
        const minutes: string = String(now.getMinutes()).padStart(2, '0');
        const seconds: string = String(now.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    private overrideLoggers(): void {

        // console.log and console.error are default and do not need to be overridden

        // Override console.info
        const originalInfo: typeof console.info = console.info.bind(console);
        console.info = (...args: any[]) => { originalInfo("==info==", ...args) }

        // Override console.warn
        const originalWarn: typeof console.warn = console.warn.bind(console);
        console.warn = (...args: any[]) => { originalWarn("==warn==", ...args) }

        // ---------------

        // Overwrite default stdout.write to check the identifier.
        ((logArray: Message[], getCurrentTime: () => string, rendererFunc: (eventType: string, ...data: any) => void) => {
            const originalWrite: typeof process.stdout.write = process.stdout.write.bind(process.stdout);
            process.stdout.write = function (chunk: string | Uint8Array, callback?: (error?: Error | null) => void): boolean {
                let level: string = "log";
                let formattedMessage: string = typeof chunk === "string" ? chunk : chunk.toString();

                if (formattedMessage.startsWith("==info==")) {
                    formattedMessage = formattedMessage.substring("==info==".length + 1);
                    level = "info";

                } else {
                    // Default to log
                }

                const fileStack: string[] = stackTrace().map(site => site.getFileName());
                const splitTop: string[] = fileStack[4].split("\\"); // 4 might not work all the time?

                const moduleIDIndex = splitTop.indexOf("built");
                const moduleID: string = splitTop[splitTop.indexOf("built") + 1];
                rendererFunc(level, formattedMessage, moduleIDIndex === -1 ? undefined : moduleID);

                logArray.push({
                    message: formattedMessage,
                    timeStamp: getCurrentTime(),
                    level: level
                });
                return originalWrite(formattedMessage, callback);
            } as typeof process.stdout.write;

        })(this.logMessages, this.getCurrentTime, this.sendToRenderer.bind(this));

        // Overwrite default stderr.write to check the identifier.
        ((logArray: Message[], getCurrentTime: () => string, rendererFunc: (eventType: string, ...data: any) => void) => {
            const originalWrite: typeof process.stderr.write = process.stderr.write.bind(process.stderr);
            process.stderr.write = function (chunk: any, callback?: (error?: Error | null) => void): boolean {
                let level: string = "error";
                let formattedMessage: string = typeof chunk === "string" ? chunk : chunk.toString();

                if (formattedMessage.startsWith("==warn==")) {
                    formattedMessage = formattedMessage.substring("==warn==".length + 1);
                    level = "warn";

                } else {
                    // Default to error
                }

                const fileStack: string[] = stackTrace().map(site => site.getFileName());
                const splitTop: string[] = fileStack[4].split("\\"); // 4 might not work all the time?

                const moduleIDIndex = splitTop.indexOf("built");
                const moduleID: string = splitTop[splitTop.indexOf("built") + 1];
                rendererFunc(level, formattedMessage, moduleIDIndex === -1 ? undefined : moduleID);

                logArray.push({
                    message: formattedMessage,
                    level: level,
                    timeStamp: getCurrentTime()
                });

                return originalWrite(formattedMessage, callback);
            } as typeof process.stderr.write;

        })(this.logMessages, this.getCurrentTime, this.sendToRenderer.bind(this));

    }

    /**
     *  The entry point of the module. Will be called once the 
     *      renderer sends the 'init' signal.
     */
    public initialize(): void {
        super.initialize(); // This should be called.
        this.sendToRenderer("messages-before-init", this.logMessages);
        this.refreshSettings(undefined)
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
            
            new BooleanSetting(this)
                .setName("Show Module IDs")
                .setDefault(true)
                .setAccessID("show_module_ids"),
        ]
    }


    public refreshSettings(modifiedSetting: Setting<unknown>): void {
        this.sendToRenderer("settings", {
            showTimeStamps: this.getSettings().findSetting("show_timestamps").getValue(),
            showLogLevels: this.getSettings().findSetting("show_log_levels").getValue(),
            showModuleIDs: this.getSettings().findSetting("show_module_ids").getValue()
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