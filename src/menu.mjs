export const menu = {
    validate: {
        description: "Validate a DWA package.",
        arguments: {
            "appPath": {
                description: "Validates the DWA installed at the given <appPath>."
            }
        }
    },
    install: {
        description: "Install DWAs to the app installation path.",
        arguments: {
            "URL": {
                description: "The <URL> of a supported (Github, Gitlab) DWA repository"
            },
            "ZIP": {
                description: "The <URL> of a ZIP archive containing DWA files."
            },
            "alias": {
                description: "Repository alias, format: @futurehood/DCNT-JS-DWA-Template."
            }
        }
    },
    uninstall: {
        description: "Uninstall locally-installed applications.",
        arguments: {
            "appPath": {
                description: "Uninstalls the application at the given <appPath>"
            }
        }
    },
    server: {
        description: "Manage the local DCNT server.",
        arguments: {
            start: {
                command: true,
                description: "Starts the local DCNT server.",
                arguments: {
                    profile: {
                        description: "Starts the server using profile <profile>."
                    }
                }
            },
            stop: {
                command: true,
                description: "Stops the local DCNT server.",
            }
        }
    },
    launch: {
        description: "Launch DWAs in a web browser.",
        arguments: {
            "appPath": {
                description: "Launches an app at <appPath> using the default browser."
            },
            "URL": {
                description: "Launches an app by <URL> using the default browser.",
                arguments: {
                    "browser": {
                        description: "Launches an app by <appPath> or <URL> using the specified <browser>."
                    }
                }
            }
        }
    },
    test: {
        description: "Run unit tests for a DWA (soon).",
        arguments: {
            "appPath": {
                description: "Runs unit tests for the DWA installed at the given <appPath>."
            }
        }
    },
    publish: {
        description: "Publish a DWA package.",
        arguments: {
            "appPath": {
                description: "Publishes the app located at <appPath> to a package archive.",
                arguments: {
                    "provider": {
                        description: "Publishes the app located at <appPath> to a repository."
                    }
                }
            },
        }
    },
    profiles: {
        description: "Manage application profiles.",
        arguments: {
            add: {
                command: true,
                description: "Creates a new profile.",
                arguments: {
                    "profile": {
                        description: "Creates profile <profile>."
                    }
                }
            },
            remove: {
                command: true,
                description: "Deletes a profile.",
                arguments: {
                    "profile": {
                        description: "Deletes profile <profile>."
                    }
                }
            },
            configure: {
                command: true,
                description: "Configures a profile.",
                arguments: {
                    "profile": {
                        description: "Configures <profile> via prompt.",
                        arguments: {
                            "property": {
                                description: "Configures <property> on <profile> via prompt.",
                                arguments: {
                                    "value": {
                                        description: "Configures <property> with <value> on <profile>."
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}