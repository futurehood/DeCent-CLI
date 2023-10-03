import fs from "fs"
import path from "path"
import pem from "pem";
import {CLIFormatter as CLIF} from "./CLIFormatter.mjs";
import {ExceptionableInput} from "./exceptions/ExceptionableInput.mjs";

export class ProfileManager {

    #application
    #certificateManager
    #path = process.cwd()+path.sep+"profiles"+path.sep

    constructor (application, certificateManager) {
        this.#application = application
        this.#certificateManager = certificateManager
        this.#initialize()
    }

    async #initialize () {
        if (!await this.hasProfilesDirectory()) {
            await this.createProfilesDirectory()
        }
        if (!await this.hasProfile("Default")) {
            await this.createProfile("Default", { port: 4200, addresses: ["::1", "127.0.0.1"]})
        }
    }

    announcePropertyArrayElementAlreadyExists (profileName, propertyName, entry) {
        this.#application.log(CLIF.green(`The `)+CLIF.white(propertyName)+CLIF.green(` property on profile `)+CLIF.bold(CLIF.white(profileName))+CLIF.green(" already includes ")+CLIF.bold(CLIF.white(entry)))
    }

    announcePropertyArrayElementDoesNotExist (profileName, propertyName, entry) {
        this.#application.log(CLIF.green(`The `)+CLIF.white(propertyName)+CLIF.green(` property on profile `)+CLIF.bold(CLIF.white(profileName))+CLIF.green(" does not include ")+CLIF.bold(CLIF.white(entry)))
    }

    #addEntriesToProfileArrayProperty (profileName, profile, operation) {
        const entries = operation.value.substring(1).split(",")
        for (const entry of entries) {
            if (profile[operation.property].indexOf(entry) >= 0) {
                this.announcePropertyArrayElementAlreadyExists(profileName, operation.property, entry)

            } else {
                profile[operation.property].push(entry)
                this.#application.log(CLIF.green(`Successfully added `)+CLIF.white(entry)+CLIF.green(" to the ")+CLIF.white(operation.property)+CLIF.green(" property on profile ")+CLIF.bold(CLIF.white(profileName)))
            }
        }
        return true
    }

    #removeEntriesFromProfileArrayProperty (profileName, profile, operation) {
        const entries = operation.value.substring(1).split(",")
        for (const entry of entries) {
            if (profile[operation.property].indexOf(entry) >= 0) {
                profile[operation.property].splice(profile[operation.property].indexOf(entry), 1)
                this.#application.log(CLIF.green(`Successfully removed `)+CLIF.white(entry)+CLIF.green(" from the ")+CLIF.white(operation.property)+CLIF.green(" property on profile ")+CLIF.bold(CLIF.white(profileName)))
            } else {
                this.announcePropertyArrayElementDoesNotExist(profileName, operation.property, entry)
            }
        }
        return true
    }

    #handleSetArrayPropertyOperation (profileName, profile, operation) {
        if (operation.value.startsWith("+")) {
            return this.#addEntriesToProfileArrayProperty(profileName, profile, operation)
        }
        if (operation.value.startsWith("-")) {
            return this.#removeEntriesFromProfileArrayProperty(profileName, profile, operation)
        }
        const modifiedPropertyArray = []
        if (operation.value !== "[]") {
            for (const entry of operation.value.split(",")) {
                modifiedPropertyArray.push(entry)
            }
        }
        profile[operation.property] = modifiedPropertyArray
        this.#application.log(CLIF.green("Set property ")+CLIF.white(operation.property)+CLIF.green(" to ")+CLIF.white(modifiedPropertyArray.join(CLIF.white(", "))))
        return true
    }

    #handleSetNumberPropertyOperation (profileName, profile, operation) {
        profile[operation.property] = Number(operation.value)
        this.#application.log(CLIF.green(`Successfully set the `)+CLIF.white(operation.property)+CLIF.green(` property to `)+CLIF.bold(CLIF.white(operation.value))+CLIF.green(" on profile ")+CLIF.bold(CLIF.white(profileName)))
        return true
    }

    async #handleSetStringPropertyOperation (profileName, profile, operation) {
        if (operation.property === "privateKey" ||
            operation.property === "certificate") {
            if (operation.value === "new") {
                this.#application.log(CLIF.green("Generating a new privateKey/certificate for profile ")+CLIF.white(profileName))
                const keys = await this.generateCertificate()
                profile.privateKey = keys.clientKey
                profile.certificate = keys.certificate
                this.#application.log(CLIF.green("Successfully generated a new privateKey/certificate for profile ")+CLIF.white(profileName))
                return true
            }
            throw new ExceptionableInput(CLIF.white("The only accepted value for the <")+CLIF.yellow("privateKey")+"|"+CLIF.yellow("certificate")+"=value> command is "+CLIF.yellow("new"))
        } else {
            profile[operation.property] = operation.value.toString()
        }
        return true
    }

    async generateCertificate () {
        return await pem.promisified.createCertificate({days: 90, selfSigned: true})
    }

    async configureProfile (profileName, operations) {
        if (!await this.hasProfile(profileName)) {
            throw new ExceptionableInput(`Profile ${profileName} doesn't exist.`)
        }
        const profile = await this.getProfile(profileName)
        for (const operation of operations) {
            if (!profile[operation.property]) {
                throw new ExceptionableInput(`The ${operation.property} property does not exist`)
            }
            if (operation.type === Array) {
                this.#handleSetArrayPropertyOperation(profileName, profile, operation)
            }
            if (operation.type === Number) {
                this.#handleSetNumberPropertyOperation(profileName, profile, operation)
            }
            if (operation.type === String) {
                await this.#handleSetStringPropertyOperation(profileName, profile, operation)
            }
        }
        await this.saveProfile(profileName, profile)
        return true
    }

    async removeProfile (name) {
        if (!await this.hasProfile(name)) {
            throw new ExceptionableInput(`Profile ${name} doesn't exist.`)
        }
        this.#application.log(`${CLIF.red("Remove profile")} ${CLIF.bold(CLIF.white(name))}`)
        await this.#application.getConfirmation(`${CLIF.yellowBright("Confirm remove profile?")} y/n:`, async (command) => {
            if (command === "y") {
                this.#application.log(CLIF.green(`Deleting files associated with ${CLIF.white(name)}`))
                await fs.promises.rm(this.#path+name, { recursive: true })
                this.#application.log(CLIF.green(`Removed profile ${CLIF.white(name)} Successfully`))
                return true
            }
            return false
        })
        return true
    }

    async displayProfile (profileName) {
        const profile = await this.getProfile(profileName)
        this.#application.log(CLIF.green("Profile: ")+CLIF.yellow(profileName+"\n")+CLIF.green("Port: ")+CLIF.white(profile.port+"\n")+CLIF.green("Addresses: ")+CLIF.white(profile.addresses.join(", ")+"\n")+CLIF.green("Private key:")+CLIF.white(profile.privateKey+"\n")+CLIF.green("Certificate: ")+CLIF.white(profile.certificate+"\n"))
    }

    async hasProfilesDirectory () {
        try {
            await fs.promises.access(this.#path)
            return true
        } catch (error) {
            return false
        }
    }

    async createProfilesDirectory () {
        try {
            return await fs.promises.mkdir(this.#path)
        } catch (error) {
            throw new Error("Could not create the profiles directory, check environment directory permissions.")
        }
    }

    async hasProfile (name) {
        try {
            await fs.promises.access(this.#path+name)
            return true
        } catch (error) {
            return false
        }
    }

    async getProfile (name) {
        if (!await this.hasProfile(name)) {
            throw new Error(`Profile ${name} doesn't exist.`)
        }
        try {
            return JSON.parse(await fs.promises.readFile(this.#path+name+path.sep+"config.json"))
        } catch (error) {
            throw new Error(`There was a problem reading the profile configuration file at ${this.#path+name+path.sep+"config.json"}`)
        }
    }

    async createProfile (profileName, profile, announce = false) {
        if (await this.hasProfile(profileName)) {
            throw new ExceptionableInput(`Profile ${CLIF.yellow()} already exists.`)
        }
        await this.createProfileDirectory(profileName)
        const keys = await this.generateCertificate()
        profile.privateKey = keys.clientKey
        profile.certificate = keys.certificate
        await this.saveProfile(profileName, profile)
        if (announce) {
            this.#application.log(CLIF.green("Successfully created profile ")+CLIF.white(profileName))
        }
        return true
    }

    async createProfileDirectory (name) {
        try {
            return await fs.promises.mkdir(this.#path+name)
        } catch (error) {
            throw new Error(`Could not create the ${name} directory, check environment directory permissions.`)
        }
    }

    async saveProfile (name, profile) {
        try {
            await fs.promises.writeFile(this.#path+name+path.sep+"config.json", JSON.stringify(profile))
        } catch (error) {
            throw new Error("Could not create the profile configuration file.")
        }
    }

}