import { JSX } from "react";
import { ConsoleSettings, logColors, Message } from "./LogCommon";




interface MessageProps {
    message: Message;
    settings: ConsoleSettings
}



export const MessageComponent = ({ message, settings }: MessageProps) => {
    const MessageElement = (): JSX.Element => {
        return message.level === "input" ? <em>{message.message}</em> : <>{message.message}</>;
    }


    const LogLevelElement = (): JSX.Element => {
        if (message.level === undefined) {
            return <></>
        }

        if (!settings.showLogLevels) {
            if (message.level === "input") {
                return <><span style={{ color: logColors[message.level] }}>{'>> '}</span></>
            }
            return <></>
        }

        return <span style={{ color: logColors[message.level] }}>[{message.level.toUpperCase()}] {message.level === "input" ? '>> ' : <></>}</span>
    }

    const TimestampElement = (): JSX.Element => {
        if (!settings.showTimeStamps || message.timeStamp === undefined) {
            return <></>
        }
        return <>{`[${message.timeStamp}] `}</>
    }

    const ModuleIDElement = (): JSX.Element => {
        if (!settings.showModuleIDs || message.moduleID === undefined) {
            return <></>
        }
        return <>{`[${message.moduleID}] `}</>
    }


    return <>
        <p style={{ whiteSpace: "pre-wrap" }}>{<TimestampElement />}{<ModuleIDElement />}{<LogLevelElement />}{<MessageElement />}</p>
    </>
}



