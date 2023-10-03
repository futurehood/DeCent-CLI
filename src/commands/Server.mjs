import {CLIFormatter as CLIF} from "../CLIFormatter.mjs";
import {ExceptionableInput} from "../exceptions/ExceptionableInput.mjs";
import {MissingCommand} from "../exceptions/MissingCommand.mjs";
import {UnrecognizedCommand} from "../exceptions/UnrecognizedCommand.mjs";

export class Server {

    #application
    #profiles
    #server

    constructor (application, profileManager, server) {
        this.#application = application
        this.#profiles = profileManager
        this.#server = server
    }

    checkValidIpv4 (ip) {
        const mainPipeline = [
            block => !isNaN(parseInt(block, 10)),
            block => parseInt(block,10) >= 0,
            block => parseInt(block,10) <= 255,
            block => String(block).length === 1
                || String(block).length > 1
                && String(block)[0] !== '0',
        ];

        const blocks = entry.split(".");
        if(blocks.length === 4
            && !blocks.every(block => parseInt(block, 10) === 0)) {
            return blocks.every(block =>
                mainPipeline.every(ckeck => ckeck(block) )
            );
        }

        return false
    }

    // Shoutz 2 @Mecanik
    #ipRegex = /(?:^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$)|(?:^(?:(?:[a-fA-F\d]{1,4}:){7}(?:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,2}|:)|(?:[a-fA-F\d]{1,4}:){4}(?:(?::[a-fA-F\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,3}|:)|(?:[a-fA-F\d]{1,4}:){3}(?:(?::[a-fA-F\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,4}|:)|(?:[a-fA-F\d]{1,4}:){2}(?:(?::[a-fA-F\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,5}|:)|(?:[a-fA-F\d]{1,4}:){1}(?:(?::[a-fA-F\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,6}|:)|(?::(?:(?::[a-fA-F\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,7}|:)))(?:%[0-9a-zA-Z]{1,})?$)/m;

    async #discernProfileName (input) {
        if (input.hasCommands(3)) {
            if (await this.#profiles.hasProfile(input.getCommandByIndex(2))) {
                return input.getCommandByIndex(2)
            }
        }
        return undefined
    }

    #discernAddresses (input, profileName = undefined) {
        const addresses = profileName ? input.getCommands().slice(3) : input.getCommands().slice(2)
        for (const [index, address] of addresses.entries()) {
            if (!this.#ipRegex.test(address.toString())) {
                if (profileName === undefined && index === 0) {
                    throw new ExceptionableInput(`A valid profile name or IP address is required, not ${CLIF.yellow(address)}`)
                } else {
                    throw new ExceptionableInput(`A valid IP address is required, not ${CLIF.yellow(address)}`)
                }
            }
        }
        return addresses
    }

    async handleCommand (input) {
        if (!input.hasCommands(2)) {
            throw new MissingCommand(`A secondary (${CLIF.yellow("start")}|${CLIF.yellow("stop")}) command is required.`)
        }
        const profileName = await this.#discernProfileName(input)
        const addresses = this.#discernAddresses(input, profileName)
        switch (input.getCommandByIndex(1)) {
            case "start":
                return await this.#server.start(profileName, addresses)
            case "stop":
                return await this.#server.stop(addresses)
            default:
                throw new UnrecognizedCommand(`${CLIF.yellow(input.getCommandByIndex(1))}, a secondary (${CLIF.yellow("start")}|${CLIF.yellow("stop")}) command is required.`)
        }
    }

}