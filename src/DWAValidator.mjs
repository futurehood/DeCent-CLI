import {CLIFormatter as CLIF} from "./CLIFormatter.mjs";
import fs from "fs"
import path from "path"


export class DWAValidator {

    #application

    constructor (application) {
        this.#application = application
    }

    async #validateManifest (manifest) {
        const errors = []
        if (!manifest.name) {
            errors.push("The application manifest is missing the name property.")
        }
        if (!manifest.description) {
            errors.push("The application manifest is missing the description property.")
        }
        if (!manifest.icons.length) {
            errors.push("The application manifest is missing an icon.")
        }
        if (!manifest.start_url) {
            errors.push("The application manifest is missing the start_url property.")
        }
        return { errors: errors }
    }

    async #validateInstalledDWA (appPath) {
        const fullPath = `${process.cwd()+path.sep}apps${path.sep+appPath}`
        this.#application.log(CLIF.green(`Validating ${CLIF.white(appPath)} ${CLIF.green("installed at")} ${CLIF.white(fullPath)}`))
        const files = await fs.promises.readdir(fullPath)
        const manifestFileName = files.find(fileName =>
            fileName.endsWith(".webmanifest") ||
            fileName.endsWith(".manifest")
        )
        try {
            const manifest = JSON.parse(await fs.promises.readFile(fullPath+path.sep+manifestFileName))
            const validation = await this.#validateManifest(manifest)
            if (!validation.errors.length) {
                this.#application.log(CLIF.green("Manifest validation passed."))
                return true
            }
            return validation

        } catch (error) {
            this.#application.log("There was a problem reading the application manifest.")
        }
        return true
    }

    async #loadManifestFromFiles (files, appPath = undefined) {
        const manifest = files.find(file => file.name.endsWith(".webmanifest") || file.name.endsWith(".manifest"))
        if (!manifest) {
            return { errors: ["No manifest was found."] }
        }
        if (!appPath) {
            // If manifest came in from JSZIP file list, load JSON accordingly
            const manifestBuffer = Buffer.from(await manifest.async("arrayBuffer"))
            return JSON.parse(manifestBuffer.toString())
        } else {
            // return JSON.parse(await fs.promises.readFile(`${this.#installationPath}/${appPath}/${manifestFileName}`))
        }
    }

    async validatePackage (files) {
        const manifest = await this.#loadManifestFromFiles(files)
        if (manifest) {
            const manifestValidation = await this.#validateManifest(manifest)
            if (!manifestValidation.errors.length) {
                this.#application.log(CLIF.green("Manifest validation passed."))
                return true
            }
            return manifestValidation
        }
        return {
            errors: ["No application manifest could be found."]
        }
    }

    async validate (appPath) {
        if (await this.#application.appExists(appPath)) {
            this.#application.log(CLIF.green(`Validating ${CLIF.white(appPath)}`))
            const validation = await this.#validateInstalledDWA(appPath)
            if (validation.errors) {
                for (const error of validation.errors) {
                    this.#application.log(CLIF.red(error))
                }
                return false
            } else {
                this.#application.log(CLIF.green("DWA validation passed."))
            }
            return true
        } else {
            throw new Error(`${CLIF.bold(appPath)} is not installed.`)
        }
    }

}