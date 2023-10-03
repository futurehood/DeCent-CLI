import {ExceptionableInput} from "../exceptions/ExceptionableInput.mjs";

export class Uninstall {

    #application
    #installer

    constructor (application, installer) {
        this.#application = application
        this.#installer = installer
    }

    #validateAppPath (appPath) {
        if (!this.#installer.appExists(appPath)) {
            throw new ExceptionableInput(`The given <app> name ${appPath} is not installed`)
        }
        return true
    }

    async handleCommand (input) {
        if (!input.getCommandByIndex(1)) {
            throw new Error ("Not enough arguments to perform uninstallation. Please include a valid path of an installed app.")
        }
        const appPath = input.getCommandByIndex(1)
        this.#validateAppPath(appPath)
        return await this.#installer.uninstall(appPath)
    }

}