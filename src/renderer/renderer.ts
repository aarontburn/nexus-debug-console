// This is auto-replaced during export. DO NOT MODIFY.
const MODULE_ID: string = "{EXPORTED_MODULE_ID}";
// ---------------------------------------------------
// ---------------------------------------------------


/**
 *  Sends information to the the process.
 * 
 *  @param eventType    The name of the event.
 *  @param data         Any data to send.
 */
function sendToProcess(eventType: string, data: any = []): Promise<any> {
    return window.parent.ipc.send(MODULE_ID, eventType, ...data);
}

const iframe: HTMLIFrameElement = document.getElementById('react-iframe') as HTMLIFrameElement;

// Comment this out for export
// if (window.parent.common.args.includes("--dev")) {
//     iframe.src = "http://localhost:5173/"
// }

function sendToIFrame(eventType: string, data: any = []) {
    iframe.contentWindow.postMessage({ eventType: eventType, data: data }, "*");
}

/**
 *  Handle events from the process.
 * 
 *  In a react context, simply passes the message to the react window.
 */
window.parent.ipc.on(MODULE_ID, async (_, eventType: string, data: any = []) => {
    if (eventType === "focus") {
        iframe.contentWindow.focus()
    }
    sendToIFrame(eventType, data);
});



/**
 *  React only: Listen to events from the react renderer and passes it to the process.
 */
window.addEventListener("message", (event) => {
    sendToProcess(event.data.eventType, event.data.data)
});


let accentColor: string | undefined = "";
const observer = new MutationObserver((mutations: MutationRecord[]) => {
    mutations.forEach((mutationRecord: MutationRecord) => {
        const cssString: string = (mutationRecord.target as HTMLElement).attributes.getNamedItem("style").value;
        const splitString: string[] = cssString.split(";");

        for (const s of splitString) {
            if (s.includes("--accent-color")) {
                const value: string = s.split(" ")[1];
                if (value !== accentColor) {
                    accentColor = value;
                    sendToIFrame("accent-color-changed", value);
                }
                break;
            }
        }
    });
});
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] })

