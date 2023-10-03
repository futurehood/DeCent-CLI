export class CLIArguments {

    #commands = []
    #flags = []

    constructor (args) {
        let quotedArg = ""
        for (const arg of args) {
            if (arg.startsWith("--")) {
                this.#flags.push(arg)
            } else {
                if (arg.startsWith('"') && !arg.endsWith('"')) {
                    quotedArg += arg.substring(1)
                } else if (!arg.startsWith('"') && arg.endsWith('"')) {
                    quotedArg += " "+arg.slice(0, -1)
                    this.#commands.push(quotedArg)
                    quotedArg = ""
                } else if (quotedArg.length) {
                    quotedArg += ` ${arg}`
                } else {
                    this.#commands.push(arg)
                }
            }
        }
    }

    hasCommands (number = 1) {
        return this.#commands.length >= number
    }

    countCommands () {
        return this.#commands.length
    }

    getCommands() {
        return this.#commands
    }

    getCommandByIndex (index) {
        return this.#commands[index]
    }

    getFlags () {
        return this.#flags
    }

    hasFlag (flag) {
        return this.#flags.find(f => f === flag)?.length > 0
    }

}