import childProc from "child_process";
import {CLIFormatter as CLIF} from "./CLIFormatter.mjs";
import path from "path"

export class DWALauncher {

    #application
    #installer
    #server

    #supportedBrowsers = [
        "firefox",
        "brave",
        "edge",
        "chrome",
    ]

    #browserAliases = {
        edge: "msedge"
    }

    constructor (application, installer, server) {
        this.#application = application
        this.#installer = installer
        this.#server = server
    }

    appExists (appPath) {
        return this.#installer.appExists(appPath)
    }

    supportsBrowser (name) {
        return this.#supportedBrowsers.includes(name)
    }

    #composeAppName (name) {
        return CLIF.bold(CLIF.white(name))
    }

    #formatBrowserName (name) {
        if (!name) {
            return "Default"
        }
        return name.charAt(0).toUpperCase()+name.slice(1)
    }

    #addPrivacyWarningLine () {
        return this.#application.log(CLIF.red("WARNING: The selected browser does not respect your privacy and is objective trash. It should be used for testing purposes only."))
    }

    #announceLaunch (appPath, browserName, profileName) {
        const message = "Launching app "+CLIF.bold(CLIF.white(appPath))+" "+CLIF.green("in")+" "+CLIF.bold(CLIF.white(this.#formatBrowserName(browserName)))+" "+CLIF.green("browser using ")+CLIF.bold(CLIF.white(profileName ? profileName : "Default")+CLIF.green(" profile"))
        this.#application.log(CLIF.green(message))
    }

    async launch (appPath, browserName, profileName) {

        if (!this.#server.isRunning()) {
            await this.#server.start(profileName)
        }
        this.#announceLaunch(appPath, browserName, profileName)

        // If no browser argument is given, use system default
        if (browserName === "Default") {
            const systemOpenCommand = process.platform === "win32" ? "explorer" : "open"
            const appURL = `https://${this.#server.getLocalAddress()}:${this.#server.getLocalPort()}/${appPath}/`
            return childProc.exec(`${systemOpenCommand} ${appURL}`)
        }
        const openCommand = process.platform === "win32" ? "start" : "open"
        const baseURL = `https://${this.#server.getLocalAddress()}:${this.#server.getLocalPort()}/`
        const appURL = baseURL+appPath+"/"
        switch (browserName) {
            case "edge":
                // Fuck edge
                this.#addPrivacyWarningLine()
                break
            case "chrome":
                // Fuck chrome
                this.#addPrivacyWarningLine()
                break
        }
        const targetBrowser = this.#browserAliases[browserName] ? this.#browserAliases[browserName] : browserName
        return childProc.exec(`${openCommand} ${ targetBrowser } ${ appURL }`)
    }

}