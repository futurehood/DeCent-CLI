# DeCent-CLI

DeCent-CLI is a Node.js-compatible toolset for building, testing, validating, managing, and self-hosting Decentralized Web Apps (DWAs). The package is also available on NPM <a href="">here</a>.

NOTE: An implementation of a DCNT server is included in the package to provide DCNT peer connection signaling and a self-hosted SSL/TLS context for locally-installed DWAs. The server class presumably has unrealized security vulnerabilities, so exposing it to a public network directly, especially continuously, is probably unwise. The environment is intended for DWA development and testing.

<img src="/readme/decent-cli.png" width="65%">

## Contents
- <a href="">Introduction</a>
- <a href="">Installation</a>
- <a href="">Usage</a>
- <a href="">About</a>
- <a href="">Contribute</a>

## Introduction

DeCent-CLI is a CLI written in JavaScript for Node.js and/or Node.js-compatible environments. There is a single NPM dependency on JSZIP, for extracting ZIP archives of downloaded DWAs. The CLI is intended to provide a simple, pain-free development experience for DWA developers by providing a toolset of shortcuts and conveniences.

The CLI offers three primary benefits:
1. Test/Validate DWAs - The CLI includes a tool to validate DWA packages, helping to ensure that the DWA ecosystem is standardized and interoperable.
2. Install/Self-Host DWAs - The CLI includes options to install DWAs locally for self-hosted access.
3. Embedded DCNT server - The CLI includes an embedded DCNT-compatible signaling server for use in testing DCNT-powered peer connections between browsers.
