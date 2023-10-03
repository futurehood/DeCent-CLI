import fs from 'fs'
import https from 'https'
import  { WebSocketServer } from 'ws'
import {CLIFormatter as CLIF, CLIFormatter} from "./CLIFormatter.mjs"

export class DCNTServer {

    #application

    #httpsServers = []
    #wssServers = []

    #localConnections = new Map()
    #localProtocols = new Map()

    #remoteConnections = new Map()
    #remoteProtocols = new Map()

    constructor (application) {
        this.#application = application
    }

    /******************************************************************************
     * Server control methods
     *****************************************************************************/

    #createHTTPSServer (sslConfiguration, address, port) {
        const httpServer = https.createServer(sslConfiguration, this.#httpRequestHandler.bind(this))
        httpServer.listen(port, address)
        this.#httpsServers.push(httpServer)
        return httpServer
    }

    #createWSSServer (httpServer) {
        const wsServer = new WebSocketServer({ server: httpServer })
        wsServer.on("connection", async (ws, request) => {
            await this.#onConnection(ws, request)
        })
        this.#wssServers.push(wsServer)
        return wsServer
    }

    start (sslConfiguration, address, port) {
        if (!this.hasServer(address)) {
            const server = this.#createHTTPSServer(sslConfiguration, address, port)
            this.#createWSSServer(server)
            // const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
            // await delay(50)
            return true
        }
        return false
    }

    #stopWssListenerByAddress (address) {
        const wss = this.#wssServers.find(ws => ws.address().address === address)
        if (wss) {
            wss.close()
            this.#wssServers.splice(this.#wssServers.indexOf(wss), 1)
            return true
        }
        return false
    }

    #stopHttpsListenerByAddress (address) {
        const https = this.#httpsServers.find(h => h.address().address === address)
        if (https) {
            https.close()
            this.#httpsServers.splice(this.#httpsServers.indexOf(https), 1)
            return true
        }
        return false
    }

    #stopListenersByAddress (address) {
        const stoppedWSS = this.#stopWssListenerByAddress(address)
        if (!stoppedWSS) {
            this.#application.log(CLIF.yellow(`No WebSocket listener with address `)+CLIF.white(address)+CLIF.yellow(" found."))
        }
        const stoppedHTTPS = this.#stopHttpsListenerByAddress(address)
        if (!stoppedHTTPS) {
            this.#application.log(CLIF.yellow(`No HTTPS listener with address `)+CLIF.white(address)+CLIF.yellow(" found."))
        }
        if (stoppedWSS || stoppedHTTPS) {
            this.#application.log(CLIFormatter.green(`DCNT server successfully stopped listening on ${CLIF.white(address)}`))
        }
    }

    #stopAllListeners () {
        for (let [index, wss] of this.#wssServers.entries()) {
            wss.close()
        }
        this.#wssServers = []
        for (const [index, https] of this.#httpsServers.entries()) {
            https.close()
        }
        this.#httpsServers = []
    }

    stop (address) {
        if (address) {
            this.#stopListenersByAddress(address)
        } else {
            this.#stopAllListeners()
        }
        return true
    }

    /******************************************************************************
     * Server event listener methods
     *****************************************************************************/

    async #getContentType (filePath) {
        const mimeTypes = {
            html: "text/html",
            css: "text/css",
            js: "application/javascript",
            mjs: "text/javascript",
            json: "application/json",
            svg: "image/svg+xml",
            png: "image/png"
        }
        const extension = filePath.split(".")[filePath.split(".").length - 1]
        if (mimeTypes[extension]) {
            return mimeTypes[extension]
        }
        return null
    }

    async #httpRequestHandler (request, response) {
        const filePath = request.url
        // this.#application.log("FILEPATH", filePath)
        if (filePath !== "/") {
            const fullPath = process.cwd()+"/apps"+filePath
            if (fs.existsSync(fullPath)) {
                if (fs.lstatSync(fullPath).isDirectory()) {
                    // TODO: Make this better
                    if (fs.lstatSync(fullPath+"index.html")) {
                        const file = await fs.promises.readFile(fullPath+"/index.html")
                        return response.end(file)
                    }
                } else {
                    const file = await fs.promises.readFile(fullPath)
                    const contentType = await this.#getContentType(filePath)
                    if (contentType) {
                        response.setHeader("Content-Type", contentType)
                    }
                    return response.end(file)
                }
            }

        }
        response.end("YESH")
    }

    /******************************************************************************
     * Server state methods
     *****************************************************************************/
    //
    // getAddress () {
    //     return this.#wss.address()
    // }

    hasServer (address) {
        return this.#httpsServers.find(s => s.address().address === address) !== undefined
    }

    #getLocalServer () {
        return this.#httpsServers.find(s => s.address().address === "127.0.0.1")
    }

    getLocalAddress () {
        return this.#getLocalServer().address().address
    }

    getLocalPort () {
        return this.#getLocalServer().address().port
    }

    isRunning () {
        return this.#wssServers.length > 0
    }

    /******************************************************************************
     * Convenience methods
     *****************************************************************************/

    #hostIsLocal (host) {
        // TODO: Implement key based authentication and customizable local hosts list
        if (host.includes("127.0.0.1")) {
            return true
        }
        return false
    }

    #getSessionId (ws) {
        const host = ws._socket.remoteAddress
        if (!this.#hostIsLocal(host)) {
            return this.#remoteConnections.get(ws)
        } else {
            return this.#localConnections.get(ws)
        }
    }

    #getConnectionById (map, sessionId) {
        for (const [ws, id] of map) {
            if (id === sessionId) {
                return ws
            }
        }
        return undefined
    }

    #getCompatibleConnections (ws) {
        if (!this.#hostIsLocal(ws._socket.remoteAddress)) {
            const sessionId = this.#remoteConnections.get(ws)
            const protocols = []
            for (const [k, v] of this.#remoteProtocols) {
                if (v.includes(sessionId)) {
                    protocols.push(k)
                }
            }
            const targets = []
            for (const protocolMatch of protocols) {
                if (this.#localProtocols.has(protocolMatch)) {
                    const sessionIds = this.#localProtocols.get(protocolMatch)
                    for (const sessionId of sessionIds) {
                        const target = this.#getConnectionById(this.#localConnections, sessionId)
                        if (target) {
                            targets.push(target)
                        }
                    }
                }
            }
            return targets
        }
    }

    #getRemoteConnectionBySessionId (sessionId) {
        for (const [ws, id] of this.#remoteConnections) {
            if (id === sessionId) {
                return ws
            }
        }
        return undefined
    }

    /******************************************************************************
     * DCNT-specific signaling handler methods
     *****************************************************************************/

    #handleLocalSdpMessage (ws, json) {
        const target = this.#getRemoteConnectionBySessionId(json.session_id)
        const frame = {
            remote_id: json.remote_id,
            sdp: json.sdp
        }
        if (json.local_id) {
            frame.local_id = json.local_id
        } else {
            frame.from = ws._socket.remoteAddress+":"+ws._socket.remotePort
        }
        if (target) {
            target.send(JSON.stringify(frame))
        }
    }

    #handleRemoteSdpMessage(ws, sessionId, json) {
        const connections = this.#getCompatibleConnections(ws)
        for (const target of connections) {
            const frame = {
                session_id: sessionId,
                remote_id: json.remote_id,
                sdp: json.sdp
            }
            target.send(JSON.stringify(frame))
        }
    }

    #handleSdpMessage (ws, sessionId, json) {
        if (this.#hostIsLocal(ws._socket.remoteAddress)) {
            this.#handleLocalSdpMessage(ws, json)
        } else {
            this.#handleRemoteSdpMessage(ws, sessionId, json)
        }
    }

    #handleLocalIceMessage (json) {
        const target = this.#getRemoteConnectionBySessionId(json.session_id)
        const frame = {
            local_id: json.local_id,
            remote_id: json.remote_id,
            ice: json.ice
        }
        if (target) {
            target.send(JSON.stringify(frame))
        }
    }

    #handleRemoteIceMessage (ws, sessionId, json) {
        const connections = this.#getCompatibleConnections(ws)
        for (const target of connections) {
            const frame = {
                session_id: sessionId,
                local_id: json.local_id,
                remote_id: json.remote_id,
                ice: json.ice
            }
            target.send(JSON.stringify(frame))
        }
    }

    #handleIceMessage (ws, sessionId, json) {
        if (this.#hostIsLocal(ws._socket.remoteAddress)) {
            this.#handleLocalIceMessage(json)
        } else {
            this.#handleRemoteIceMessage(ws, sessionId, json)
        }
    }

    /******************************************************************************
     * Authorization methods
     *****************************************************************************/

    #checkAuthorizationState (ws, sessionId) {
        const host = ws._socket.remoteAddress
        let flag = false
        if (!this.#hostIsLocal(host)) {
            this.#remoteProtocols.forEach((uuids, index) => {
                if (uuids.includes(sessionId)) {
                    flag = true
                }
            })
        } else {
            this.#localProtocols.forEach((uuids, index) => {
                if (uuids.includes(sessionId)) {
                    flag = true
                }
            })
        }
        return flag
    }

    #setCheckAuthorizationStateTimeout (ws, sessionId) {
        setTimeout(() => {
            const authorized = this.#checkAuthorizationState(ws, sessionId)
            if (authorized === false) {
                ws.close(1000, "Unauthorized")
            }
        }, 1000)
    }

    #handleAuthorizedMessage (ws, sessionId, json) {
        if (json.sdp) {
            this.#handleSdpMessage(ws, sessionId, json)
        } else if (json.ice) {
            this.#handleIceMessage(ws, sessionId, json)
        }
    }

    #registerRemoteProtocols (ws, protocols) {
        const sessionId = this.#remoteConnections.get(ws)
        for (const protocol of protocols) {
            if (!this.#remoteProtocols.has(protocol)) {
                this.#remoteProtocols.set(protocol, [])
            }
            const array = this.#remoteProtocols.get(protocol)
            array.push(sessionId)
            this.#remoteProtocols.set(protocol, array)
        }
    }

    #registerLocalProtocols (ws, protocols) {
        const sessionId = this.#localConnections.get(ws)
        for (const protocol of protocols) {
            if (!this.#localProtocols.has(protocol)) {
                this.#localProtocols.set(protocol, [])
            }
            const array = this.#localProtocols.get(protocol)
            array.push(sessionId)
            this.#localProtocols.set(protocol, array)
        }
    }

    #handleApplicationProtocolRegistration (ws, protocols) {
        if (!this.#hostIsLocal(ws._socket.remoteAddress)) {
            this.#registerRemoteProtocols(ws, protocols)
        } else {
            this.#registerLocalProtocols(ws, protocols)
        }
    }

    #handleUnauthorizedMessage (ws, json) {
        if (json.protocols && json.protocols.constructor === Array) {
            this.#handleApplicationProtocolRegistration(ws, json.protocols)
        } else {
            ws.close("Unauthorized")
        }
    }

    /******************************************************************************
     * Connection management methods
     *****************************************************************************/

    #addConnection (ws) {
        const sessionId = crypto.randomUUID()
        if (!this.#hostIsLocal(ws._socket.remoteAddress)) {
            this.#remoteConnections.set(ws, sessionId)
        } else {
            this.#localConnections.set(ws, sessionId)
        }
        return sessionId
    }

    #cleanupRelatedRemoteSessions (sessionId) {
        // Get local protocols that the session is subscribed to
        const relatedProtocols = []
        for (const [localProtocol, sessionIds] of this.#localProtocols) {
            if (sessionIds.includes(sessionId)) {
                relatedProtocols.push(localProtocol)
            }
        }
        for (const relatedProtocol of relatedProtocols) {
            if (this.#remoteProtocols.has(relatedProtocol)) {
                // Get the remote session IDs attached to this protocol
                const sessionIds = this.#remoteProtocols.get(relatedProtocol)
                for (const sessionId of sessionIds) {
                    this.#cleanupRemoteProtocols(sessionId)
                }

            }
        }
    }

    #cleanupLocalProtocols (sessionId) {
        for (const [protocol, sessionIds] of this.#localProtocols) {
            if (sessionIds.includes(sessionId)) {
                sessionIds.splice(sessionIds.indexOf(sessionId), 1)
                this.#localProtocols.set(protocol, sessionIds)
                if (!sessionIds.length) {
                    this.#localProtocols.delete(protocol)
                }
            }
        }
    }

    #removeLocalConnection (ws) {
        const sessionId = this.#getSessionId(ws)
        this.#cleanupRelatedRemoteSessions(sessionId)
        this.#cleanupLocalProtocols(sessionId)
        this.#localConnections.delete(ws)
    }

    #cleanupRemoteProtocols (sessionId) {
        for (const [protocol, sessionIds] of this.#remoteProtocols) {
            if (sessionIds.includes(sessionId)) {
                sessionIds.splice(sessionIds.indexOf(sessionId), 1)
                this.#remoteProtocols.set(protocol, sessionIds)
                if (!sessionIds.length) {
                    this.#remoteProtocols.delete(protocol)
                }
            }
        }
    }

    #removeRemoteConnection (ws) {
        const sessionId = this.#getSessionId(ws)
        this.#cleanupRemoteProtocols(sessionId)
        this.#remoteConnections.delete(ws)
    }

    #removeConnection (ws) {
        if (!this.#hostIsLocal(ws._socket.remoteAddress)) {
            if (this.#remoteConnections.has(ws)) {
                this.#removeRemoteConnection(ws)
            }
        } else {
            if (this.#localConnections.has(ws)) {
                this.#removeLocalConnection(ws)
            }
        }
        return true
    }

    /******************************************************************************
     * WebSocket connection event handler methods
     *****************************************************************************/

    async #onConnection (ws, request) {
        const sessionId = this.#addConnection(ws)
        ws.on("message", (message) => {
            this.#onMessage(ws, message)
        })
        ws.on("error", (error) => {
            this.#onError(ws, error)
        })
        ws.on("close", (code) => {
            this.#onClose(ws)
        })
        this.#setCheckAuthorizationStateTimeout(ws, sessionId)
    }

    #onError (ws, error) {
        this.#removeConnection(ws)
    }

    #onMessage (ws, data) {
        try {
            const json = JSON.parse(data)
            const sessionId = this.#getSessionId(ws)
            if (this.#checkAuthorizationState(ws, sessionId)) {
                this.#handleAuthorizedMessage(ws, sessionId, json)
            } else {
                this.#handleUnauthorizedMessage(ws, json)
            }
        } catch (error) {
            ws.close(1000, "l8rz")
        }
    }

    #onClose (ws) {
        this.#removeConnection(ws)
    }

}