export class CLIFormatter {

    static red (string = "") {
        return `\x1b[91m${string}\x1b[39m`
    }

    static blue (string = "") {
        return `\x1b[34m${string}\x1b[89m`
    }

    static yellow (string = "") {
        return `\x1b[93m${string}\x1b[39m`
    }

    static yellowBright (string = "") {
        return `\x1b[93m${string}\x1b[39m`
    }

    static green (string = "") {
        return `\x1b[92m${string}\x1b[39m`
    }

    static cyan (string = "") {
        return `\x1b[96m${string}\x1b[39m`
    }

    static magenta (string = "") {
        return `\x1b[95m${string}\x1b[39m`
    }

    static gray (string = "") {
        return `\x1b[30m${string}\x1b[89m`
    }

    static white (string = "") {
        return `\x1b[97m${string}\x1b[39m`
    }

    static bold (string = "") {
        return `\x1b[1m${string}\x1b[22m`
    }

    static italic (string = "") {
        return `\x1b[3m${string}\x1b[23m`
    }

    static underline (string = "") {
        return `\x1b[4m${string}\x1b[24m`
    }

    static strikethrough (string = "") {
        return `\x1b[9m${string}\x1b[29m`
    }

    static reset (string = "") {
        return `\x1b[0m${string}\x1b[0m`
    }
    
}