## DeCent-CLI Usage Guide

### Available Commands
- **<a href="#test">test</a>**: The test command runs unit tests for a DWA. Coming soon.
- **<a href="#validate">validate</a>**: The validate command validates that a package meets the DWA requirements.
- **<a href="#install">install</a>**: The install command installs a DWA package locally.
- **<a href="#uninstall">uninstall</a>**: The uninstall command uninstalls a DWA package locally.
- **<a href="#server">server</a>**: The server command provides access to the embedded DCNT server.
- **<a href="#launch">launch</a>**: The launch command launches a DWA in a web browser.

### Test

*Coming soon*

### Validate

The following command will validate a DWA located in a directory named ***example-app***:

    $ decent-cli validate example-app

The following command will validate a DWA located at remote URL ***https://remote-dwa.com***:

    $ decent-cli validate https://futurehood.github.io/decent-messenger

DeCent-CLI offers a variety of functionality to make developing DWAs as easy as possible. This section will provide an overview of that functionality and should clarify most confusion.

### Install

The following command will download a DWA from a repository URL and install it locally:

    $ decent-cli install https://github.com/futurehood/DCNT-JS-DWA-Template

The following command will validate a DWA located at remote URL ***https://remote-dwa.com***:

    $ decent-cli install https://github.com/futurehood/DCNT-JS-DWA-Template/archive/refs/heads/main.zip

After executing either of the commands above, the user will be prompted to provide a directory name to store the application files in locally:

    $ Suggested application installation path is "DCNT-JS-DWA-Template", proceed? y/n:

An input of ***y*** or ***yes*** will cause the CLI to install the downloaded, validated DWA files in the specified location. An input of ***n*** or ***no*** will cause a second prompt to appear:

    $ Input the desired path for application installation:

Whatever is submitted here will be used as the installation directory.

To bypass validating the DWA being installed, which will cause the installation to abort if failed, the --no-validate flag can be used:

    $ decent-cli install https://github.com/futurehood/DCNT-JS-DWA-Template --no-validate

DeCent-CLI offers a variety of functionality to make developing DWAs as easy as possible. This section will provide an overview of that functionality and should clarify most confusion.
