import {CLIFormatter as CLIF} from "./CLIFormatter.mjs";

export class CLIRenderer {

    #application
    constructor (application) {
        this.#application = application
    }

    renderCommandPrompt () {
        const serverStatus = this.#application.isRunning() ? CLIF.green("Online") : CLIF.magenta("Offline")
        this.#application.log(`${CLIF.bold("CWD")}: ${process.cwd()}, ${CLIF.bold("Server")}: ${ serverStatus } `)
    }

    renderMenu (menu, indentLevel = 0) {
        const serverStatus = this.#application.isRunning() ? CLIF.green("Online") : CLIF.magenta("Offline")
        let string = ""
        if (indentLevel === 0) {
            string += `*************************************************************************************\n* ${CLIF.green("DeCent-CLI v1.0")}                                                                   *\n* DCNT server status: ${serverStatus}                                                       *\n* Use commands "menu", "help", or "--h" to return here at any time.                 *\n*************************************************************************************\n`
            string += "-------------------------------------------------------------------------------------\n"
            string += "| Command/<Argument>         | Description                                          |\n"
            string += "-------------------------------------------------------------------------------------\n"
        }
        function generateCommandPadding (command, drop = 0) {
            return ".".repeat((28 - command.length) - drop)
        }
        for (const command in menu) {
            switch (command) {
                case "description":
                    break
                case "command":
                    break
                case "arguments":
                    string += this.renderMenu(menu[command], indentLevel + 1)
                    break
                default:
                    let formattedCommand = CLIF.yellow(command)
                    if (!menu[command].command) {
                        formattedCommand = CLIF.yellowBright("<")+formattedCommand+CLIF.yellowBright(">")
                    }
                    let line = `${"  ".repeat(indentLevel)}${CLIF.italic(indentLevel === 0 ? CLIF.yellow(""+command) : formattedCommand )} ${generateCommandPadding(command, (2 * indentLevel))} ${menu[command].description}\n`
                    string += line
                    break
            }
            if (menu[command].arguments) {
                string += this.renderMenu(menu[command], indentLevel + 1)
            }
        }
        return string
    }

}