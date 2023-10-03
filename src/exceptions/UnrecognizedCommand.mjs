import {Exception} from "./Exception.mjs";
import {CLIFormatter as CLIF} from "../CLIFormatter.mjs";

export class UnrecognizedCommand extends Exception {

    constructor (command) {
        super(`${CLIF.magenta("Unrecognized command")}: ${command}`)
    }

}