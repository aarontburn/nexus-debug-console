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



    return <>
        <p style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{<TimestampElement />}{<LogLevelElement />}{<MessageElement />}</p>
    </>
}



