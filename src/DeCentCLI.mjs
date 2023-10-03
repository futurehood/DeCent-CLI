
import readline from 'readline/promises'

import { menu } from "./menu.mjs";
import { DCNTServer } from "./DCNTServer.mjs";
import {CLIArguments} from "./CLIArguments.mjs";
import {CLIRenderer} from "./CLIRenderer.mjs";
import {ProfileManager} from "./ProfileManager.mjs";
import {DWAServer} from "./DWAServer.mjs";
import {DWAValidator} from "./DWAValidator.mjs";
import {DWAInstaller} from "./DWAInstaller.mjs";
import {DWALauncher} from "./DWALauncher.mjs";
import {Menu} from "./commands/Menu.mjs";
import {Validate} from "./commands/Validate.mjs";
import {Install} from "./commands/Install.mjs";
import {Uninstall} from "./commands/Uninstall.mjs";
import {Server} from "./commands/Server.mjs";
import {Launch} from "./commands/Launch.mjs";
import {Test} from "./commands/Test.mjs";
import {Publish} from "./commands/Publish.mjs";
import {Profiles} from "./commands/Profiles.mjs";
import {UnrecognizedCommand} from "./exceptions/UnrecognizedCommand.mjs";

export class DeCentCLI {

    // CLI modules
    #renderer = new CLIRenderer(this)
    #profileManager = new ProfileManager(this)

    // DWA-specific modules
    #DWAInstaller = new DWAInstaller(this)
    #DWAValidator = new DWAValidator(this)
    #DWAServer = new DWAServer(this, this.#profileManager, new DCNTServer(this))
    #DWALauncher = new DWALauncher(this, this.#DWAInstaller, this.#DWAServer)

    // Primary command modules
    #menu = new Menu(this, this.#renderer)
    #validate = new Validate(this, this.#DWAValidator, this.#DWAInstaller)
    #install = new Install(this, this.#DWAInstaller, this.#DWAValidator)
    #uninstall = new Uninstall(this, this.#DWAInstaller)
    #server = new Server(this, this.#profileManager, this.#DWAServer)
    #launch = new Launch(this, this.#DWAServer, this.#DWALauncher)
    #test = new Test(this)
    #publish = new Publish(this)
    #profiles = new Profiles(this, this.#profileManager)

    #readLine
    #debug = false

    constructor(debug = false) {
        this.#debug = debug
    }

    log (string) {
        console.log(string)
    }

    async run (args = [], getInput = true) {
        const input = new CLIArguments(args)
        try {
            if (input.hasCommands()) {
                await this.#discernAndExecuteCommand(input)
            } else {
                this.#menu.handleCommand(input)
            }
        } catch (exception) {
            this.log(exception.message)
            if (this.#debug || input.hasFlag("--d")) {
                this.log(exception.stack)
            }
        }
        if (getInput) {
            return await this.#getInput()
        }
    }

    async #discernAndExecuteCommand (input) {
        switch (input.getCommandByIndex(0)) {
            case "--h":
            case "help":
            case "menu":
                return this.#menu.handleCommand(input)
            case "validate":
                return await this.#validate.handleCommand(input)
            case "install":
                return await this.#install.handleCommand(input)
            case "uninstall":
                return await this.#uninstall.handleCommand(input)
            case "server":
                return await this.#server.handleCommand(input)
            case "launch":
                return await this.#launch.handleCommand(input)
            case "test":
                return await this.#test.handleCommand(input)
            case "publish":
                return await this.#publish.handleCommand(input)
            case "profiles":
                return await this.#profiles.handleCommand(input)
            case "exit":
                if (this.#readLine) {
                    this.#readLine.close()
                }
                return process.exit()
            default:
                throw new UnrecognizedCommand(input.getCommandByIndex(0))
        }
    }

    async #getInput (question = undefined, commandHandler = undefined) {
        if (!this.#readLine) {
            this.#readLine = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            })
        }
        if (question && commandHandler) {
            const command = await this.#readLine.question(question)
            return await commandHandler(command)
        }
        await this.#getCommand()
    }

    async #getCommand () {
        await this.#renderer.renderCommandPrompt()
        const command = await this.#readLine.question("Type a command: ")
        const args = command.trim().split(" ").filter(a => a !== "")
        return await this.run(args)
    }

    async getConfirmation (question = undefined, handler) {
        return await this.#getInput(question ? question+" " : "Confirm? y/n: ", handler)
    }

    isRunning () {
        return this.#DWAServer && this.#DWAServer.isRunning()
    }

    async hasProfile (name) {
        return await this.#profileManager.hasProfile(name)
    }

    async validatePackage (files) {
        return await this.#DWAValidator.validatePackage(files)
    }

    async appExists (appPath) {
        return await this.#DWAInstaller.appExists(appPath)
    }

}