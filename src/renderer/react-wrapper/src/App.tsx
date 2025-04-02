import { useEffect, useRef, useState } from 'react'
import './App.css'
import { addProcessListener, removeProcessListener, sendToProcess } from './ModulesBridge';
import { MessageComponent } from './Log';
import { Message, LogLevel, ConsoleSettings, LOG_TYPES } from './LogCommon';






const getCurrentTime = (): string => {
    const now: Date = new Date();
    const hours: string = String(now.getHours()).padStart(2, '0');
    const minutes: string = String(now.getMinutes()).padStart(2, '0');
    const seconds: string = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}




function App() {
    const initialMessageHistory: Message[] = [
        { level: "log", message: "----- START CONSOLE -----", timeStamp: getCurrentTime() },
        { level: "info", message: "Type '?' or 'help' to see all available commands.", timeStamp: getCurrentTime() },
    ]
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputHistory, setInputHistory] = useState<string[]>([]);
    const [logHistory, setLogHistory] = useState<Message[]>(initialMessageHistory);
    const [inputValue, setInputValue] = useState<string>("");
    const [filterTypes, setFilterTypes] = useState<LogLevel[]>([]);


    const [historyIndex, setHistoryIndex] = useState(0);
    const [settings, setSettings] = useState<ConsoleSettings>({ showLogLevels: true, showTimeStamps: true });


    useEffect(() => {
        const func = addProcessListener((eventType: string, data: any) => {
            switch (eventType) {
                case "log":
                case "warn":
                case "info":
                case "error": {
                    const formattedData: string = typeof data[0] === "string" ? data[0] : JSON.stringify(data[0]);
                    setLogHistory(prev => [...prev, { level: eventType, timeStamp: getCurrentTime(), message: formattedData }]);
                    break;
                }
                case "accent-color-changed": {
                    const accentColor: string = data[0];
                    (document.querySelector(":root") as HTMLElement).style.setProperty("--accent-color", accentColor);
                    break;
                }
                case "settings": {
                    setSettings(data[0]);
                    break;
                }
                case "focus": {
                    // setInputFocus();
                    break;
                }
                case "clear": {
                    setLogHistory([]);
                    break;
                }

                default: {
                    console.log("Uncaught message: " + eventType + " | " + data[0])
                    break;
                }
            }
        });
        sendToProcess("init");

        return () => {
            removeProcessListener(func);
        }
    }, []);


    return (
        <div className="box">
            <div className="row header" id='message-header'>
                <p>Filter by:&nbsp;</p>
                {LOG_TYPES.map((type, index) =>
                    <p
                        style={{ color: filterTypes.includes(type) ? "var(--accent-color)" : "gray" }}
                        className='filter-type'
                        key={index}
                        onClick={() => setFilterTypes(prev => {
                            if (prev.includes(type)) {
                                return prev.filter(s => s !== type);
                            }
                            return [...prev, type];
                        })}
                    >
                        {type}
                    </p>
                )}
                <div style={{ marginRight: "auto" }}></div>
                <p id='clear-history-button' onClick={() => setLogHistory([])}>Clear</p>
            </div>
            <div className="row content" id='message-history'>
                <div>
                    {logHistory
                        .filter(message => filterTypes.length === 0 || filterTypes.includes(message.level ?? ""))
                        .map((message, index) =>
                            <MessageComponent
                                key={index}
                                message={message}
                                settings={settings} />)}
                </div>

            </div>

            <div className="row footer" id='message-input-container'>
                <p style={{ marginRight: "0.5em", marginLeft: "0.5em" }}>{">>"}</p>
                <input id='message-input'
                    ref={inputRef}
                    type='text'
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            sendToProcess("input", inputValue);
                            setInputHistory(prev => [...prev, inputValue]);
                            setLogHistory(prev => [...prev, { level: "input", timeStamp: getCurrentTime(), message: inputValue }]);
                            setInputValue("");
                            setHistoryIndex(0);

                        } else if (event.key === "ArrowUp") {
                            if (historyIndex * -1 >= inputHistory.length) { // hit the very first message
                                return; // do nothing
                            }
                            inputRef.current?.setSelectionRange(Infinity, Infinity)
                            setHistoryIndex(prev => {
                                const index: number = prev - 1;
                                const s: string = index === 0 ? "" : inputHistory.at(index) ?? "";
                                setInputValue(s);
                                requestAnimationFrame(() => {
                                    inputRef.current?.setSelectionRange(s.length, s.length);
                                });
                                return index;
                            });


                        } else if (event.key === "ArrowDown") {
                            if (historyIndex === 0) { // hit the very first message
                                return; // do nothing
                            }
                            setHistoryIndex(prev => {
                                const index: number = prev + 1;
                                const s: string = index === 0 ? "" : inputHistory.at(index) ?? "";
                                setInputValue(s);

                                requestAnimationFrame(() => {
                                    inputRef.current?.setSelectionRange(s.length, s.length);
                                });
                                return index;
                            });
                        }
                    }}
                />
            </div>
        </div>
    )
}

export default App
