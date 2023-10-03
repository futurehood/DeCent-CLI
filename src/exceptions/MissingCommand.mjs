import {Exception} from "./Exception.mjs";
import {CLIFormatter as CLIF} from "../CLIFormatter.mjs";

export class MissingCommand extends Exception {

    constructor (command) {
        super(`${CLIF.magenta("Missing command")}: ${command}`)
    }

}