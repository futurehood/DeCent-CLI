export class Install {

    #application
    #installer
    #validator

    constructor (application, installer, validator) {
        this.#application = application
        this.#installer = installer
        this.#validator = validator
    }

    #discernAppPath (input) {
        return (input.getCommandByIndex(2) && !this.#installer.hasProvider(input.getCommandByIndex(2))) ? input.getCommandByIndex(2) : undefined
    }

    #discernProvider (input, appPath) {
        return (appPath && input.hasCommands(4)) ? input.getCommandByIndex(3) : (input.hasCommands(3) && !appPath && this.#installer.hasProvider(input.getCommandByIndex(2)) ? input.getCommandByIndex(2) : undefined)
    }

    async handleCommand (input) {
        if (!input.getCommandByIndex(1)) {
            throw new Error ("Not enough arguments to perform installation. A valid URL or alias is required.")
        }
        const source = input.getCommandByIndex(1)
        const appPath = this.#discernAppPath(input)
        const provider = this.#discernProvider(input, appPath)
        return await this.#installer.install(source, appPath, provider)
    }

}