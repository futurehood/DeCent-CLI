export class Validate {

    #application
    #validator
    #installer

    constructor (application, validator, installer) {
        this.#application = application
        this.#validator = validator
        this.#installer = installer
    }

    async handleCommand (input) {
        if (!input.hasCommands(2)) {
            throw new Error ("Not enough arguments to perform DWA validation Please include a valid path of an installed app.")
        }
        const appPath = input.getCommandByIndex(1)
        if (await this.#installer.appExists(appPath)) {
            return await this.#validator.validate(appPath)
        }
        throw new Error(`No application is installed at that path (${appPath}).`)
    }

}