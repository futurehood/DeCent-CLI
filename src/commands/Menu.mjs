import { menu } from "../menu.mjs";

export class Menu {

    #application
    #renderer

    constructor (application, renderer) {
        this.#application = application
        this.#renderer = renderer
    }

    handleCommand () {
        this.#application.log(this.#renderer.renderMenu(menu))
        return true
    }

}