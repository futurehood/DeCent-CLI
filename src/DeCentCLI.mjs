
import { DCNTServer } from "./DCNTServer.mjs";
import { DWAInstaller } from "./DWAInstaller.mjs";
import { DWALauncher } from "./DWALauncher.mjs";
import { CertificateManager } from "./CertificateManager.mjs";
import {CLIFormatter as CLIF, CLIFormatter} from "./CLIFormatter.mjs";
import readline from 'readline/promises'

export class DeCentCLI {

    #server
    #installer = new DWAInstaller(this)
    #launcher = new DWALauncher(this)

    #readLine

    #debug = false

    constructor(debug = false) {
        this.#debug = debug
    }

    log (string) {
        console.log(string)
    }

    async run (args = []) {
        try {
            if (args.length) {
                await this.#handleCommand(args)
            } else {
                await this.#handleMenuCommand(args)
            }

        } catch (error) {
            this.log(CLIFormatter.red(`Something went wrong: ${ CLIFormatter.white(error.message) }`))
            if (this.#debug) {
                this.log(error.stack)
            }
        }
        return await this.#getInput()
    }

    async #handleCommand (args) {
        if (!args.length) {
            throw new Error("No command given!")
        }
        await this.#discernAndExecuteCommand(args)
    }

    async #discernAndExecuteCommand (args) {
        switch (args[0]) {
            case "--h":
            case "help":
            case "menu":
                return await this.#handleMenuCommand(args)
            case "server":
                return await this.#handleServerCommand(args)
            case "install":
                return await this.#handleInstallCommand(args)
            case "uninstall":
                return await this.#handleUninstallCommand(args)
            case "validate":
                return await this.#handleValidateCommand(args)
            case "launch":
                return await this.#handleLaunchCommand(args)
            case "exit":
                if (this.#readLine) {
                    this.#readLine.close()
                }
                process.exit()
        }
    }

    async #renderCommandPrompt () {
        const command = await this.#readLine.question("Type a command: ")
        const args = command.split(" ")
        process.stdout.moveCursor(0, -1)
        process.stdout.clearLine(1)
        return await this.run(args)
    }

    async getConfirmation (question = undefined, handler) {
        return await this.#getInput(question ? question+" " : "Confirm? y/n: ", handler)
    }

    async #getInput (question = undefined, commandHandler = undefined) {
        if (!this.#readLine) {
            this.#readLine = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            })
        }
        if (question) {
            const command = await this.#readLine.question(question)
            return await commandHandler(command)
        } else {
            await this.#renderCommandPrompt()
        }
    }

    formatMenu (menu, indentLevel = 0) {
        let string = ""
        if (indentLevel === 0) {
            string += `*************************************************************************************\n* ${CLIF.green("DeCent-CLI v1.0")}                                                                   *\n* DCNT server status: ${CLIF.magenta("Offline")}                                                       *\n* Use commands "help", "menu", or "--h" to return here at any time.                 *\n*************************************************************************************\n`
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
                    string += this.formatMenu(menu[command], indentLevel + 1)
                    break
                default:
                    let formattedCommand = CLIF.yellow(command)
                    if (!menu[command].command) {
                        formattedCommand = CLIF.yellowBright("<")+formattedCommand+CLIF.yellowBright(">")
                    }
                    let line = `${"  ".repeat(indentLevel)}${CLIF.italic(indentLevel === 0 ? CLIF.yellow(command) :   formattedCommand )} ${generateCommandPadding(command, (2 * indentLevel))} ${menu[command].description}\n`
                    string += line
                    break
            }
            if (menu[command].arguments) {
                string += this.formatMenu(menu[command], indentLevel + 1)
            }
        }
        return string
    }

    async #handleMenuCommand (args) {
        const menu = {
            test: {
                description: "Run unit tests for a DWA (soon).",
                arguments: {
                    "appPath": {
                        description: "Runs unit tests for the DWA installed at the given <appPath>."
                    }
                }
            },
            validate: {
                description: "Validate a DWA package.",
                arguments: {
                    "appPath": {
                        description: "Validates the DWA installed at the given <appPath>."
                    }
                }
            },
            install: {
                description: "Install DWAs to the base application installation path.",
                arguments: {
                    "URL": {
                        description: "The <URL> of a supported (Github, Gitlab) DWA repository"
                    },
                    "ZIP": {
                        description: "The <URL> of a ZIP archive containing DWA files."
                    },
                    "alias": {
                        description: "Repository alias, format: @futurehood/DCNT-JS-DWA-Template."
                    }
                }
            },
            uninstall: {
                description: "Uninstall locally-installed applications.",
                arguments: {
                    "appPath": {
                        description: "Uninstalls the application at the given <appPath>"
                    }
                }
            },
            server: {
                description: "Manage the local DCNT server.",
                arguments: {
                    configure: {
                        command: true,
                        description: "Configure the DCNT server and manage profiles (soon)."
                    },
                    start: {
                        command: true,
                        description: "Starts the local DCNT server.",
                        arguments: {
                            profile: {
                                description: "Starts the local DCNT server using profile <profile>."
                            }
                        }
                    },
                    stop: {
                        command: true,
                        description: "Stops the local DCNT server."
                    }
                }
            },
            launch: {
                description: "Launch DWAs in a web browser.",
                arguments: {
                    "appPath": {
                        description: "Launches an app at <appPath> using the default browser."
                    },
                    "URL": {
                        description: "Launches an app by <URL> using the default browser.",
                        arguments: {
                            "browser": {
                                description: "Launches an app by <appPath> or <URL> using the specified <browser>."
                            }
                        }
                    }
                }
            }


        }
        this.log(this.formatMenu(menu))
    }

    async #handleServerCommand (args) {
        switch (args[1]) {
            case "start":
                return await this.#startServer(args[2] ? args[2] : null)
            case "stop":
                this.log(CLIFormatter.green("Stopping server"))
                return await this.#stopServer()
        }
    }

    async #handleInstallCommand (args) {
        if (!args[1]) {
            throw new Error ("Not enough arguments to perform installation. Please include a valid URL.")
        }
        return await this.#installer.install(new URL(args[1]))
    }

    async #handleUninstallCommand (args) {
        if (!args[1]) {
            throw new Error ("Not enough arguments to perform uninstallation. Please include a valid path of an installed app.")
        }
        const appPath = args[1]
        return await this.#installer.uninstall(appPath)
    }

    async #handleValidateCommand (args) {
        if (!args[1]) {
            throw new Error ("Not enough arguments to perform DWA validation Please include a valid path of an installed app.")
        }
        await this.#installer.validate(args[1])
    }

    async #handleLaunchCommand (args) {
        if (!args[1]) {
            throw new Error ("Not enough arguments to launch an app. Please include a valid app path.")
        }
        const appPath = args[1]
        if (!this.#installer.appExists(appPath)) {
            throw new Error(`${CLIF.bold(appPath)} is not installed.`)
        }
        if (!this.#server) {
            await this.#startServer()
        }
        if (this.#server && this.#server.isRunning()) {
            const address = this.#server.getAddress().address
            const port = this.#server.getAddress().port
            return await this.#launcher.launch(address, port, args)
        }
        throw new Error("There was a problem starting the server.")
    }

    async #startServer (profile = undefined) {
        const profileName = CLIFormatter.bold(CLIFormatter.white(profile ? profile : "Default"))
        this.log(CLIFormatter.green(`Starting DCNT server with ${ profileName } ${ CLIFormatter.green("profile") }`))
        const certificateManager = new CertificateManager(this, profile)
        this.#server = new DCNTServer(this, await certificateManager.getBuffers())
        return this.#server.start(5200)
    }

    async #stopServer () {
        this.#server.stop()
        this.#server = undefined
    }

}
