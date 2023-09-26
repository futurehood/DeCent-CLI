import childProc from "child_process";
import {CLIFormatter} from "./CLIFormatter.mjs";

export class DWALauncher {

    #application

    #supportedBrowsers = [
        "firefox",
        "brave",
        "edge",
        "chrome",
    ]

    #browserAliases = {
        edge: "msedge"
    }

    constructor (application) {
        this.#application = application
    }

    #composeAppName (name) {
        return CLIFormatter.bold(CLIFormatter.white(name))
    }

    #composeBrowserName (name) {
        if (!name) {
            return undefined
        }
        return CLIFormatter.bold(name.charAt(0).toUpperCase()+name.slice(1))
    }

    #addPrivacyWarningLine () {
        return this.#application.log(CLIFormatter.red("WARNING: The selected browser does not respect your privacy and is objective trash. It should be used for testing purposes only."))
    }

    async launch (address, port, args) {
        const appInput = args[1]
        const appName = this.#composeAppName(appInput)
        const browserInput = args[2]
        const browserName = this.#composeBrowserName(browserInput)
        const message = `Launching app ${appName} ${ CLIFormatter.green("in") } ${browserName ? CLIFormatter.white(browserName) : "Default" } ${ CLIFormatter.green("browser")}`
        this.#application.log(CLIFormatter.green(message))
        // If no browser argument is given, use system default
        if (!browserInput) {
            const openDefault = process.platform === "win32" ? "explorer" : "open"
            return childProc.exec(`${openDefault} https://127.0.0.1:5200/${appInput}/`)
        }
        // If the given browser is not supported, throw error
        if (!this.#supportedBrowsers.includes(browserInput)) {
            throw new Error(`The ${browserInput} browser is not supported.`)
        }
        // Handle launch
        const openCommand = process.platform === "win32" ? "start" : "open"
        const baseURL = `https://127.0.0.1:${port}/`
        const appURL = baseURL+appInput
        switch (browserInput) {
            case "edge":
                // Fuck edge
                this.#addPrivacyWarningLine()
                break
            case "chrome":
                // Fuck chrome
                this.#addPrivacyWarningLine()
                break
        }
        const targetBrowser = this.#browserAliases[browserInput] ? this.#browserAliases[browserInput] : browserInput
        return childProc.exec(`${openCommand} ${ targetBrowser } ${ appURL }/`)
    }

}
