import fs from "fs"
import path from "path"
import JSZip from "jszip"
import {CLIFormatter as CLIF} from "./CLIFormatter.mjs";

export class DWAInstaller {

    #application
    #installationPath

    constructor (application) {
        this.#application = application
        this.#installationPath = process.cwd()+path.sep+"apps"+path.sep
    }

    appExists (appPath) {
        return fs.existsSync(this.#installationPath+path.sep+appPath)
    }

    async #storeApplicationFiles (appPath, files, replacePath = undefined) {
        // Get root folder
        // TODO: Do this based off of start_url file location
        replacePath = replacePath ?? appPath
        const rootFolder = files[0].name.split(path.sep).find(fn => fn.includes(replacePath))
        if (!fs.existsSync(this.#installationPath)) {
            this.#application.log(CLIF.green("Creating apps directory"))
            fs.mkdirSync(this.#installationPath)
            this.#application.log(CLIF.green("Created apps directory."))
        }
        if (!fs.existsSync(this.#installationPath+appPath)) {
            this.#application.log(CLIF.green(`Creating app directory for ${CLIF.white(appPath)}`))
            fs.mkdirSync(this.#installationPath+appPath)
            this.#application.log(CLIF.green(`Created app directory for ${CLIF.white(appPath)}`))

        }
        for (const file of files) {
            const targetFilePath = `${this.#installationPath}${appPath+path.sep}${file.name.replace(rootFolder, "")}`
            if (file.dir) {
                if (!fs.existsSync(targetFilePath)) {
                    fs.mkdirSync(targetFilePath)
                }
            } else {
                await fs.promises.writeFile(
                    targetFilePath,
                    Buffer.from(await file.async("arrayBuffer"))
                )
            }
        }
        this.#application.log(CLIF.green(`Successfully installed ${CLIF.bold(CLIF.white(appPath))}${ CLIF.green(` in ${  CLIF.bold(CLIF.white(this.#installationPath)) } ${ CLIF.green("directory")}`)} `))
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
        this.#application.log(CLIF.green(`Validating ${CLIF.white(fullPath)} ${CLIF.green("installed at")} ${CLIF.white(fullPath)}`))
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

    async validate (appPath) {
        if (this.appExists(appPath)) {
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
            return JSON.parse(await fs.promises.readFile(`${this.#installationPath}/${appPath}/${manifestFileName}`))
        }
    }

    async #validateDWAFiles (files) {
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

    async #formatArchiveFilesObjectToArray (files) {
        const array = []
        for (const file in files) {
            array.push(files[file])
        }
        return array
    }

    async #loadFilesFromArchive (url) {
        const response = await fetch(url.href).catch((e) => {
            throw new Error("There was a problem fetching the archive. Make sure the URL is valid.")
        })
        const jszip = new JSZip()
        const unzipped = await jszip.loadAsync(response.arrayBuffer())
        return await this.#formatArchiveFilesObjectToArray(unzipped.files)
    }

    async #loadFilesFromRepository (url, validate = true, appPath = undefined) {
        appPath = appPath ? appPath : url.pathname.substring(1).split("/")[1]
        const repositoryArchiveURL = url.href+"/archive/refs/heads/main.zip"
        if (fs.existsSync(this.#installationPath+appPath)) {
            const question = `${CLIF.magenta("Application exists: ")}${CLIF.yellowBright(`There's already an app installed in the`)} ${CLIF.bold(CLIF.white(appPath))} ${CLIF.yellowBright("directory. Do you want to install")} ${CLIF.white(url)} ${CLIF.yellowBright("somewhere else?")} y/n:`
            if (!await this.#application.getConfirmation(
                question,
                async (command) => {
                    if (command === "y" || command === "Y") {
                        const question = `Input the name of the path where the application files will be stored:`
                        await this.#application.getConfirmation(question, async (command) => {
                            return await this.#loadFilesFromRepository(url, validate, command)
                        })
                    }
                    if (command === "n" || command === "N") {
                        const question = `${CLIF.magenta("Application exists: ")}${CLIF.yellowBright(`There's already an app installed in the`)} ${CLIF.bold(CLIF.white(appPath))} ${CLIF.yellowBright("directory. Do you want to delete the existing app and install")} ${CLIF.white(url)}? y/n:`
                        return await this.#application.getConfirmation(question, async (command) => {
                            if (command === "y") {
                                return await this.uninstall(appPath)
                            }
                        })
                    }
                    return false
                }
            )) {
                return false
            }
        }
        this.#application.log(CLIF.green(`Downloading application files from repository: ${CLIF.bold(CLIF.white(url.href))}`))
        const files = await this.#loadFilesFromArchive(new URL(repositoryArchiveURL))
        if (validate) {
            this.#application.log(CLIF.green(`Validating application files from: ${CLIF.bold(CLIF.white(url.href))}`))
            const validation = await this.#validateDWAFiles(files)
            if (validation.errors) {
                this.#application.log(CLIF.red("DWA validation failed."))
                return validation
            }
            this.#application.log(CLIF.green("DWA validation passed."))
        }
        await this.#application.getConfirmation(CLIF.yellowBright(`Suggested installation path is ${CLIF.white(appPath)}${CLIF.yellowBright(", proceed?")} y/n:`), async (command) => {
            if (command === "y") {
                return await this.#storeApplicationFiles(appPath, files, url.pathname.substring(1).split("/")[1])
            } else {
                await this.#application.getConfirmation(`${CLIF.yellowBright("Input the path name where the app files will be stored:")}`, async (command) => {
                    if (!command.length) {
                        throw new Error("Input a valid app path.")
                    }
                    return await this.#storeApplicationFiles(command, files, appPath)
                })
            }
        })
    }

    async #loadFilesFromURL (url) {
        const supportedRepositoryHosts = [
            "github.com",
            "gitlab.com",
            "codeberg.org"
        ]
        if (supportedRepositoryHosts.includes(url.host)) {
            return await this.#loadFilesFromRepository(url)
        }
        throw new Error("Loading application files from arbitrary endpoints not supported yet.")
    }

    async install (url) {
        if (url.href.endsWith(".zip")) {
            return await this.#loadFilesFromArchive(url)
        } else {
            return await this.#loadFilesFromURL(url)
        }
    }

    async uninstall (appPath) {
        this.#application.log(CLIF.red(`Uninstalling ${CLIF.bold(CLIF.white(appPath))}`))
        if (this.appExists(appPath)) {
            await this.#application.getConfirmation(`${CLIF.yellowBright("Confirm delete?")} y/n:`, async (command) => {
                if (command === "y") {
                    this.#application.log(CLIF.green(`Deleting files associated with ${CLIF.white(appPath)}`))
                    await fs.promises.rm(this.#installationPath+appPath, { recursive: true })
                    this.#application.log(CLIF.green(`Successfully uninstalled ${CLIF.bold(CLIF.white(appPath))}`))
                    return true
                }
                return false
            })
            return true
        } else {
            throw new Error("No application is installed at that path.")
        }
    }

}
