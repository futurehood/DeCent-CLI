import fs from "fs"
import pem from "pem"

export class CertificateManager {

    #application
    #path

    constructor (application, profile) {
        this.#path = profile ? `/certs/${profile}/` : "/certs/"
    }

    async #initialize () {
        const privateKeyPath = this.#path+"/private_key.pem"
        const certificatePath = this.#path+"/certificate.pem"
        if (!await fs.promises.exists(privateKeyPath) || !await fs.promises.exists(certificatePath)) {
            await this.generateCertificate()
        }
        return {
            privateKeyPath: privateKeyPath,
            certificatePath: certificatePath
        }
    }

    async generateCertificate () {
        const cwd = process.cwd()
        const certPath = cwd+"/"+this.#path
        if (!await fs.promises.exists(certPath)) {
            await fs.promises.mkdir(certPath)
        }
        const keys = await pem.promisified.createCertificate({days: 90, selfSigned: true})
        const fileError = (e) => { if (e) { throw new Error("Error writing file.") } }
        await fs.promises.writeFile(certPath+"/private_key.pem", keys.clientKey, fileError)
        await fs.promises.writeFile(certPath+"/certificate.pem", keys.certificate, fileError)
    }

    async getBuffers () {
        return {
            key: await this.getPrivateKeyBuffer(),
            cert: await this.getCertificateBuffer()
        }
    }

    async getPrivateKeyBuffer () {
        return await fs.promises.readFile(`${process.cwd()}/${this.#path}/private_key.pem`)
    }

    async getCertificateBuffer () {
        return await fs.promises.readFile(`${process.cwd()}/${this.#path}/certificate.pem`)
    }

}
