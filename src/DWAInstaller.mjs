import fs from "fs"
import path from "path"
import JSZip from "jszip"
import {CLIFormatter as CLIF} from "./CLIFormatter.mjs";

export class DWAInstaller {

    #application
    #path = process.cwd()+path.sep+"apps"+path.sep

    #providers = {
        github: {
            repository: "https://github.com/${user}/${repository}",
            zipArchive: "/archive/refs/heads/main.zip"
        },
        gitlab: {
            repository: "https://gitlab.com/${user}/${repository}",
            zipArchive: "/-/archive/main/${repository}-main.zip"
        },
        codeberg: {
            repository: "https://codeberg.org/${user}/${repository}",
            zipArchive: "/archive/main.zip"
        },
    }

    constructor (application) {
        this.#application = application
    }

    hasProvider (provider) {
        return this.#providers[provider] !== undefined
    }

    async appExists (appPath) {
        try {
            await fs.promises.access(this.#path+path.sep+appPath)
            return true
        } catch (error) {
            return false
        }
    }

    async #loadManifest (manifest) {
        if (manifest._data) {
            // If manifest came in from JSZIP file list, load JSON accordingly
            const manifestBuffer = Buffer.from(await manifest.async("arrayBuffer"))
            return JSON.parse(manifestBuffer.toString())
        } else {
            return JSON.parse(await fs.promises.readFile(`${this.#path}/${appPath}/${manifestFileName}`))
        }
    }

    getApplicationStartURLDirectory (startURL, files) {
        if (startURL === "." || startURL === "/") {
            startURL = "index.html"
        }
        // Check for multiple matches, and use the shortest one as the start_url file
        const startURLMatches = files.filter(f => f.name.includes(startURL)).sort((a, b) => a.name.length - b.name.length)
        if (!startURLMatches.length) {
            throw new Error("No manifest start_url match was found in the application files.")
        }
        return startURLMatches[0].name.replace(startURL, "")
    }

    async #getRootDirectoryPath (files) {
        const manifestFile = files.find(file => file.name.endsWith(".webmanifest") || file.name.endsWith(".manifest"))
        if (!manifestFile) {
            throw new Error("No application manifest found during installation!")
        }
        const manifestBuffer = Buffer.from(await manifestFile.async("arrayBuffer"))
        const manifest = JSON.parse(manifestBuffer.toString())
        if (!manifest.start_url) {
            throw new Error("Application manifest is missing the start_url attribute.")
        }
        return this.getApplicationStartURLDirectory(manifest.start_url, files)
    }

    async #appPathExists (appPath) {
        try {
            await fs.promises.access(this.#path+appPath)
            return true
        } catch (Error) {
            return false
        }
    }

    async #createAppPath (appPath) {
        try {
            await fs.promises.mkdir(this.#path+appPath)
        } catch (Error) {
            throw new Error("There was a problem creating the app install path.")
        }
        this.#application.log(CLIF.green(`Created app directory ${appPath}.`))
    }

    async #storeApplicationFiles (appPath, files) {
        // Get root folder
        // TODO: Do this based off of start_url file location
        const rootFolder = await this.#getRootDirectoryPath(files)
        console.log("Root folder", rootFolder)
        if (!await this.#appPathExists(appPath)) {
            await this.#createAppPath(appPath)
        }
        if (!fs.existsSync(this.#path+appPath)) {
            await fs.promises.mkdir(this.#path+appPath)
            this.#application.log(CLIF.green(`Created app directory for ${CLIF.white(appPath)}`))
        }
        for (const file of files) {
            const targetFilePath = this.#path+appPath+path.sep+file.name.toLowerCase().replace(rootFolder.toLowerCase(), "")
            if (file.dir) {
                if (!fs.existsSync(targetFilePath)) {
                    await fs.promises.mkdir(targetFilePath)
                }
            } else {
                await fs.promises.writeFile(
                    targetFilePath,
                    Buffer.from(await file.async("arrayBuffer"))
                )
            }
        }
        this.#application.log(CLIF.green(`Successfully installed ${CLIF.bold(CLIF.white(appPath))}${ CLIF.green(` in ${  CLIF.bold(CLIF.white(this.#path)) } ${ CLIF.green("directory")}`)} `))
    }

    async #handleExistingInstallation (url, appPath, validate) {
        const question = `${CLIF.magenta("Application exists: ")}${CLIF.yellowBright(`There's already an app installed in the`)} ${CLIF.bold(CLIF.white(appPath))} ${CLIF.yellowBright("directory. Do you want to install")} ${CLIF.white(url)} ${CLIF.yellowBright("somewhere else?")} y/n:`
        if (!await this.#application.getConfirmation(
            question,
            async (command) => {
                if (command === "y" || command === "Y") {
                    const question = CLIF.yellow(`Input the name of the path where the application files will be stored:`)
                    await this.#application.getConfirmation(question, async (command) => {
                        if (command.length) {
                            return await this.#installFromURL(new URL(url), command, validate)
                        }
                        throw new Error("Invalid path name given.")
                    })
                }
                if (command === "n" || command === "N") {
                    const question = `${CLIF.magenta("Application exists: ")}${CLIF.yellowBright(`There's already an app installed in the`)} ${CLIF.bold(CLIF.white(appPath))} ${CLIF.yellowBright("directory. Do you want to delete the existing app and install")} ${CLIF.white(url)}? y/n:`
                    return await this.#application.getConfirmation(question, async (command) => {
                        if (command === "y") {
                            const uninstalled = await this.uninstall(appPath)
                            if (uninstalled) {
                                return await this.#installFromURL(url, appPath)
                            }
                        }
                        return false
                    })
                }
                return false
            }
        )) {
            return false
        }
    }

    async #handleInstallationConfirmation (url, appPath, files) {
        const prompt = CLIF.yellowBright(`Suggested installation path is ${CLIF.white(this.#path+appPath)}${CLIF.yellowBright(", proceed?")} y/n:`)
        await this.#application.getConfirmation(prompt, async (command) => {
            if (command === "y") {
                return await this.#storeApplicationFiles(appPath, files)
            } else {
                await this.#application.getConfirmation(`${CLIF.yellowBright("Input the path name where the app files will be stored:")}`, async (command) => {
                    if (!command.length) {
                        throw new Error("Input a valid app path.")
                    }
                    return await this.#storeApplicationFiles(command, files)
                })
            }
        })
    }

    async #handleValidation (source, files) {
        this.#application.log(CLIF.green(`Validating application files from: ${CLIF.bold(CLIF.white(source))}`))
        const validation = await this.#application.validatePackage(files)
        if (validation.errors) {
            this.#application.log(CLIF.red("DWA validation failed."))
            return validation
        }
        this.#application.log(CLIF.green("DWA validation passed."))
    }

    async #formatArchiveFilesObjectToArray (files) {
        const array = []
        for (const file in files) {
            array.push(files[file])
        }
        return array
    }

    async #loadFilesFromArchive (url) {
        const options = {
            method: "GET",
            credentials: "include",
            // mode: "no-cors",
            headers: {
                "Accept-Language": "en-US,en;q=0.5",
                "Accept": "application/zip, application/octet-stream",
                // Cookie: "_cfuvid=XCTpiPSFpxnUA5n3weAoUl.YY5i7y5vnpmoSvP0PT.0-1696277958970-0-604800000"
                "Accept-Encoding": "gzip, deflate, br",
                // Cookie: "_cfuvid=4R2ZGMawAW9OEqk2ZkOpK.tWjzOSd9NQaiCwrYErplI-1696275726525-0-604800000; path=/; domain=.gitlab.com; HttpOnly; Secure; SameSite=None"
            }
        }
        const response = await fetch(url.href, options).catch((e) => {
            throw new Error("There was a problem fetching the archive. Make sure the URL is valid.")
        })
        if (response.status === 200){
            if ((response.headers.get("content-type") === "application/zip" ||
                response.headers.get("content-type") === "application/octet-stream")) {
                const jszip = new JSZip()
                const unzipped = await jszip.loadAsync(response.arrayBuffer()).catch((error) => {
                    throw new Error(`Invalid ZIP archive: ${error.message}`)
                })
                return await this.#formatArchiveFilesObjectToArray(unzipped.files)
            }
        }
        throw new Error(`The server responded with status code ${response.status}`)
    }

    #getArchiveURLFromRepositoryURL (url) {
        if (this.#providers[url.host.split(".")[0]]) {
            const provider = this.#providers[url.host.split(".")[0]]
            const repositoryName = url.pathname.substring(1).split("/")[1]
            const archivePath = provider.zipArchive.replace("${repository}", repositoryName)
            return new URL(url+archivePath)
        }
        throw new Error("Could not create archive URL")
    }

    async #loadFilesFromURL (url) {
        if (this.#providers[url.host.split(".")[0]]) {
            if (!url.href.endsWith(".zip")) {
                url = this.#getArchiveURLFromRepositoryURL(url)
            }
            return await this.#loadFilesFromArchive(url)
        }
        throw new Error("Loading application files from arbitrary endpoints not supported yet.")
    }

    #getAppPathFromRepositoryURL (url) {
        const pathNameParts = url.pathname.substring(1).split("/")
        if (!pathNameParts[1]) {
            throw new Error("The repository URL seems to be missing the repository name segment.")
        }
        return url.pathname.substring(1).split("/")[1]
    }

    async #installFromURL (url, appPath = undefined, validate = true) {
        appPath = appPath ? appPath : this.#getAppPathFromRepositoryURL(url)
        if (await this.#appPathExists(appPath)) {
            return await this.#handleExistingInstallation(url, appPath, validate)
        }
        this.#application.log(CLIF.green(`Downloading application files from repository: ${CLIF.bold(CLIF.white(url.href))}`))
        const files = await this.#loadFilesFromURL(url)
        if (validate) {
            await this.#handleValidation(url.href, files)
        }
        return await this.#handleInstallationConfirmation(url, appPath, files)
    }

    async #getURLFromAlias (alias, provider) {
        const [userName, repositoryName] = alias.substring(1).split("/")
        if (!userName || !repositoryName) {
            throw new Error(`Malformed alias, expected format is "@username/repository"`)
        }
        if (!provider) {
            provider = "github"
        }
        if (this.#providers[provider]) {
            let url = this.#providers[provider].repository
            url = url.replace("${user}", userName)
            url = url.replace("${repository}", repositoryName)
            return url
        }
        throw new Error("Alias is invalid")
    }

    async install (source, appPath, provider) {
        try {
            if (source.startsWith("@")) {
                source = await this.#getURLFromAlias(source, provider)
            }
            const url = new URL(source)
            return await this.#installFromURL(url, appPath)
        } catch (error) {
            throw new Error(`Invalid package source: ${error.message}`)
        }
    }

    async uninstall (appPath) {
        this.#application.log(CLIF.red(`Uninstalling ${CLIF.bold(CLIF.white(appPath))}`))
        if (await this.appExists(appPath)) {
            await this.#application.getConfirmation(`${CLIF.yellowBright("Confirm delete?")} y/n:`, async (command) => {
                if (command === "y") {
                    this.#application.log(CLIF.green(`Deleting files associated with ${CLIF.white(appPath)}`))
                    await fs.promises.rm(this.#path+appPath, { recursive: true })
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




// async #validateManifest (manifest) {
//     const errors = []
//     if (!manifest.name) {
//         errors.push("The application manifest is missing the name property.")
//     }
//     if (!manifest.description) {
//         errors.push("The application manifest is missing the description property.")
//     }
//     if (!manifest.icons.length) {
//         errors.push("The application manifest is missing an icon.")
//     }
//     if (!manifest.start_url) {
//         errors.push("The application manifest is missing the start_url property.")
//     }
//     return { errors: errors }
// }
//
// async #validateInstalledDWA (appPath) {
//     const fullPath = `${process.cwd()+path.sep}apps${path.sep+appPath}`
//     this.#application.log(CLIF.green(`Validating ${CLIF.white(fullPath)} ${CLIF.green("installed at")} ${CLIF.white(fullPath)}`))
//     const files = await fs.promises.readdir(fullPath)
//     const manifestFileName = files.find(fileName =>
//         fileName.endsWith(".webmanifest") ||
//             fileName.endsWith(".manifest")
//     )
//     try {
//         const manifest = JSON.parse(await fs.promises.readFile(fullPath+path.sep+manifestFileName))
//         const validation = await this.#validateManifest(manifest)
//         if (!validation.errors.length) {
//             this.#application.log(CLIF.green("Manifest validation passed."))
//             return true
//         }
//         return validation
//
//     } catch (error) {
//         this.#application.log("There was a problem reading the application manifest.")
//     }
//     return true
// }
//
// async validate (appPath) {
//     if (this.appExists(appPath)) {
//         this.#application.log(CLIF.green(`Validating ${CLIF.white(appPath)}`))
//         const validation = await this.#validateInstalledDWA(appPath)
//         if (validation.errors) {
//             for (const error of validation.errors) {
//                 this.#application.log(CLIF.red(error))
//             }
//             return false
//         } else {
//             this.#application.log(CLIF.green("DWA validation passed."))
//         }
//         return true
//     } else {
//         throw new Error(`${CLIF.bold(appPath)} is not installed.`)
//     }
// }

// async #loadManifestFromFiles (files, appPath = undefined) {
//     const manifest = files.find(file => file.name.endsWith(".webmanifest") || file.name.endsWith(".manifest"))
//     if (!manifest) {
//         return { errors: ["No manifest was found."] }
//     }
//     if (!appPath) {
//         // If manifest came in from JSZIP file list, load JSON accordingly
//         const manifestBuffer = Buffer.from(await manifest.async("arrayBuffer"))
//         return JSON.parse(manifestBuffer.toString())
//     } else {
//         return JSON.parse(await fs.promises.readFile(`${this.#path}/${appPath}/${manifestFileName}`))
//     }
// }
//
// async #validateDWAFiles (files) {
//     const manifest = await this.#loadManifestFromFiles(files)
//     if (manifest) {
//         const manifestValidation = await this.#validateManifest(manifest)
//         if (!manifestValidation.errors.length) {
//             this.#application.log(CLIF.green("Manifest validation passed."))
//             return true
//         }
//         return manifestValidation
//     }
//     return {
//         errors: ["No application manifest could be found."]
//     }
// }