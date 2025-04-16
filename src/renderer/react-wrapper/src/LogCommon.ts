export const LOG_TYPES: readonly string[] = ["input", "log", "info", "warn", "error"] as const;
export type LogLevel = typeof LOG_TYPES[number]
export const logColors: { [level: string]: string } = {
    "input": "turquoise",
    "log": "gray",
    "info": "green",
    "warn": "yellow",
    "error": "red",
} as const;

export interface Message {
    level?: LogLevel;
    timeStamp?: string;
    message: string;
    moduleID?: string;
}

export interface ConsoleSettings {
    showTimeStamps: boolean;
    showLogLevels: boolean;
}