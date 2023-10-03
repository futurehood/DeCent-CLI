import {CLIFormatter as CLIF} from "../CLIFormatter.mjs";
import {MissingCommand} from "../exceptions/MissingCommand.mjs";
import {ExceptionableInput} from "../exceptions/ExceptionableInput.mjs";
import {UnrecognizedCommand} from "../exceptions/UnrecognizedCommand.mjs";

export class Profiles {

    #application
    #profiles

    #supportedProfileProperties = {
        port: {
            type: Number,
            maxLength: 5
        },
        addresses: {
            type: Array,
        },
        privateKey: {
            type: String,
        },
        certificate: {
            type: String
        }
    }

    constructor (application, profileManager) {
        this.#application = application
        this.#profiles = profileManager
    }

    #validateProfileName (profileName) {
        if (!profileName) {
            throw new MissingCommand("The <profile> command is required")
        }
        return profileName
    }

    async #validateProfile (name) {
        if (!await this.#profiles.hasProfile(name)) {
            throw new ExceptionableInput(`The given ${CLIF.yellow("<profile>")} name (${CLIF.yellow(name)}) is not a valid profile`)
        }
        return true
    }

    #validateOperations (operations) {
        for (const operation of operations) {
            const [property, value] = operation.split("=")
            if (!property || !value) {
                throw new ExceptionableInput(`Given ${CLIF.yellow("<property=value>")} operation (${CLIF.yellow(`${property}=${value}`)}) could not be parsed`)
            }
            if (!this.#supportedProfileProperties[property]) {
                throw new ExceptionableInput(`Given <${CLIF.yellow("property")}=value> operation (${CLIF.yellow(property)}=${value}) is not supported`)
            }
        }
        return true
    }

    #formatOperations (operations) {
        const formattedOperations = []
        for (const operation of operations) {
            const [property, value] = operation.split("=")
            const formattedOperation = {
                property: property,
                value: value,
                type: this.#supportedProfileProperties[property].type
            }
            formattedOperations.push(formattedOperation)
        }
        return formattedOperations
    }

    async handleCommand (input) {
        if (!input.hasCommands(3)) {
            throw new MissingCommand(`Both a <${CLIF.yellow("add")}|${CLIF.yellow("remove")}|${CLIF.yellow("configure")}> command and valid <${CLIF.yellow("profile")}> name are required for profile operations.`)
        }
        const profileName = this.#validateProfileName(input.getCommandByIndex(2))
        switch (input.getCommandByIndex(1)) {
            case "add":
                const profile = { port: 4200, addresses: ["::1", "127.0.0.1"] }
                return await this.#profiles.createProfile(profileName, profile, true)
            case "remove":
                if (input.getCommandByIndex(2) === ("default" || "Default")) {
                    throw new ExceptionableInput(`The ${CLIF.yellow("default")} profile cannot be removed.`)
                }
                return await this.#profiles.removeProfile(profileName)
            case "configure":
                if (input.hasCommands(3) && !input.hasCommands(4)) {
                    await this.#validateProfile(input.getCommandByIndex(2))
                    throw new MissingCommand(`The ${CLIF.yellow("<property=value>")} command is missing`)
                }
                if (input.hasCommands(4)) {
                    this.#validateOperations(input.getCommands().slice(3))
                }
                const formattedOperations = this.#formatOperations(input.getCommands().slice(3))
                return await this.#profiles.configureProfile(profileName, formattedOperations)
            case "show":
                return await this.#profiles.displayProfile(profileName)
            default:
                throw new UnrecognizedCommand(`The ${CLIF.yellow(input.getCommandByIndex(1))} command is unrecognized, use <${CLIF.yellow("add")}|${CLIF.yellow("remove")}|${CLIF.yellow("configure")}> instead`)
        }

    }

}
