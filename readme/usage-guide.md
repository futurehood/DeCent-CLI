## DeCent-CLI Usage Guide

### Available Commands
- **<a href="#test">test</a>**: The test command runs unit tests for a DWA. Coming soon.
- **<a href="#validate">validate</a>**: The validate command validates that a package meets the DWA requirements.
- **<a href="#install">install</a>**: The install command installs a DWA package locally.
- **<a href="#uninstall">uninstall</a>**: The uninstall command uninstalls a DWA package locally.
- **<a href="#server">server</a>**: The server command provides access to the embedded DCNT server.
- **<a href="#launch">launch</a>**: The launch command launches a DWA in a web browser.

<hr/>

### Test

*Coming soon*

<hr/>

### Validate

The following command will validate a DWA located in a directory named ***example-app***:

    $ decent-cli validate example-app

The following command will validate a DWA located at a remote URL:

    $ decent-cli validate https://futurehood.github.io/decent-messenger

<hr/>

### Install

The following command will download a DWA from a repository URL and install it locally:

    $ decent-cli install https://github.com/futurehood/DCNT-JS-DWA-Template

The following command will download a DWA ZIP archive located at remote URL and install it locally:

    $ decent-cli install https://github.com/futurehood/DCNT-JS-DWA-Template/archive/refs/heads/main.zip

The following command will install a DWA from repository alias:

    $ decent-cli install @futurehood/DCNT-JS-DWA-Template

***NOTE:*** To bypass validating the DWA being installed, which will cause the installation to abort if failed, the ***--no-validate*** flag can be used:

    $ decent-cli install https://github.com/futurehood/DCNT-JS-DWA-Template --no-validate

After executing one of the commands above successfully, the user will be prompted to provide a directory name to store the application files in locally:

    $ Suggested application installation path is "DCNT-JS-DWA-Template", proceed? y/n:

An input of ***y*** or ***yes*** will cause the CLI to install the downloaded, validated DWA files to a directory of the specified name in the configured location for installed apps. An input of ***n*** or ***no*** will cause a second prompt to appear:

    $ Input the desired path for application installation:

The received input will be used as the name of the local directory the application files are stored in.

<hr/>

### Uninstall

The following command will uninstall a DWA installed locally in the given *appPath*

    $ decent-cli uninstall DCNT-JS-DWA-Template

<hr/>

### Server

The following command will start the embedded server using the ***default*** profile:

    $ decent-cli server start

The following command will start the embedded server using the specified ***example-profile*** profile:

    $ decent-cli server start example-profile

The following command will stop the embedded server:

    $ decent-cli server stop

<hr/>

### Launch

The following command will launch the specified locally-installed DWA in the default web browser:

    $ decent-cli launch DCNT-JS-DWA-Template

The following command will attempt to launch the specified locally-installed DWA in the Firefox web browser:

    $ decent-cli launch DCNT-JS-DWA-Template firefox

The following command will attempt to launch the specified locally-installed DWA in the Brave web browser:

    $ decent-cli launch DCNT-JS-DWA-Template brave

The following command will attempt to launch the specified locally-installed DWA in the Edge web browser:

    $ decent-cli launch DCNT-JS-DWA-Template edge

The following command will attempt to launch the specified locally-installed DWA in the Chrome web browser:

    $ decent-cli launch DCNT-JS-DWA-Template chrome
