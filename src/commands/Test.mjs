export class Test {

    #application

    constructor(application) {
        this.#application = application
    }

    async handleCommand (input) {
        throw new Error("Not yet implemented.")
    }

}