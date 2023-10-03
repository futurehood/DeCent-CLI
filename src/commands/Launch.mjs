import {CLIFormatter as CLIF} from "../CLIFormatter.mjs";

export class Launch {

    #application
    #server
    #launcher

    constructor (application, server, launcher) {
        this.#application = application
        this.#server = server
        this.#launcher = launcher
    }

    #discernBrowserName (name) {
        const supportedBrowser = this.#launcher.supportsBrowser(name)
        return supportedBrowser ? name : "Default"
    }

    async #discernProfileName (input, browserName) {
        if (input.hasCommands(4)) {
            if (await this.#application.hasProfile(input.getCommandByIndex(3))) {
                return input.getCommandByIndex(3)
            } else {
                throw new Error(`The ${input.getCommandByIndex(3)} profile does not exist`)
            }
        }
        if (input.hasCommands(3) && browserName === "Default") {
            if (await this.#application.hasProfile(input.getCommandByIndex(2))) {
                return input.getCommandByIndex(2)
            } else {
                throw new Error(`The given <browser> or <profile> argument (${input.getCommandByIndex(2)}) is invalid`)
            }
        }
        return "Default"
    }

    async handleCommand (input) {
        if (!input.hasCommands(2)) {
            throw new Error ("Not enough arguments to launch an app. Please include a valid app path.")
        }
        const appPath = input.getCommandByIndex(1)
        if (!await this.#launcher.appExists(appPath)) {
            throw new Error(`No application is installed at that path (${appPath}).`)
        }
        const browserName = this.#discernBrowserName(input.getCommandByIndex(2))
        const profileName = await this.#discernProfileName(input, browserName)
        return await this.#launcher.launch(appPath, browserName, profileName)
    }

}