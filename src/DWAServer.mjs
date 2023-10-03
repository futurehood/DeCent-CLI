import {CLIFormatter, CLIFormatter as CLIF} from "./CLIFormatter.mjs";

export class DWAServer {

    #application
    #profiles
    #server

    constructor (application, profileManager, server) {
        this.#application = application
        this.#profiles = profileManager
        this.#server = server
    }

    isRunning () {
        return this.#server.isRunning()
    }

    getLocalAddress () {
        return this.#server.getLocalAddress()
    }

    getLocalPort () {
        return this.#server.getLocalPort()
    }

    async hasProfile (name) {
        return await this.#profiles.hasProfile(name)
    }

    async getProfile (name) {
        return await this.#profiles.getProfile(name)
    }

    #announceServerStart (profileName) {
        this.#application.log(CLIF.green(`Starting DCNT server using ${ CLIF.bold(CLIF.white(profileName)) } ${ CLIF.green("profile") }`))
    }

    #announceServerStartListening (address, port) {
        this.#application.log(CLIF.green(`DCNT server listening on `)+CLIF.white(address+":"+port))
    }

    #announceServerRunning () {
        this.#application.log(CLIF.green("DCNT server is running"))
    }

    #announceStop (addresses) {
        let log = CLIFormatter.green(`DCNT server stopping listeners`)
        if (addresses.length > 0) {
            log += CLIF.green(" for addresses ")+CLIF.white(addresses.join(", "))
        } else {
            log += CLIF.green(" for ")+CLIF.white("all addresses")
        }
        this.#application.log(log)
    }

    #announceServerStopListening (address, port) {
        this.#application.log(CLIF.green(`DCNT server stopped listening on `)+CLIF.white(address+":"+port))
    }

    #announceServerStopSuccess () {
        this.#application.log(CLIF.green("DCNT server stopped successfully."))
    }

    async start (profileName, addresses) {
        profileName = profileName ?? "Default"
        const profile = await this.#profiles.getProfile(profileName)
        const sslConfiguration = {
            key: profile.privateKey,
            cert: profile.certificate
        }
        this.#announceServerStart(profileName)
        if (profile.addresses.length === 0) {
            throw new Error("Cannot start the server without any addresses.")
        }
        for (const address of profile.addresses) {
            if (this.#server.hasServer(address)) {
                this.#application.log(CLIF.yellow("Server is already listening to ")+CLIF.white(address))
                continue
            }
            if (this.#server.start(sslConfiguration, address, profile.port)) {
                this.#announceServerStartListening(address, profile.port)
                const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
                await delay(1)
            }
        }
        if (this.#server.isRunning()) {
            this.#announceServerRunning(profile.addresses)
            return true
        } else {
            throw new Error("There was a problem starting the DCNT server")
        }
    }

    stop (addresses) {
        this.#announceStop(addresses)
        if (addresses.length > 0) {
            for (const address of addresses) {
                this.#server.stop(address)
            }
        } else {
            this.#server.stop()
        }
        this.#announceServerStopSuccess()
        return true
    }

}