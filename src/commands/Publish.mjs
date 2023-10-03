export class Publish {

    #application

    constructor(application, server) {
        this.#application = application
    }

    async handleCommand (input) {
        throw new Error("Not yet implemented.")
    }

}