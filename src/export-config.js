



/**
 * excluded: Any files/directories to not include in the final module.
 * included: Any files/directories to include in the final module.
 */
module.exports = {
    excluded: ["electron.ts", "./renderer/react-wrapper"],
    included: ["./renderer/react-wrapper/react_module"],
    build: {
        id: "aarontburn.Debug_Console",
        process: "./process/main"
    }
}