import {Exception} from "./Exception.mjs";
import {CLIFormatter as CLIF} from "../CLIFormatter.mjs";

export class ExceptionableInput extends Exception {

    constructor(message) {
        super(`${CLIF.magenta("Exceptionable input")}: ${message}`)
    }

}