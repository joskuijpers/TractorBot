case "addmod": {
    if (!messageIsFromAdmin(message)) break

    if (args.length < 2) {
        message.reply("To add mod text: `!addmod [en|de] [text]`")
        break
    }

    let lang = args[0]
    if (lang !== "en" && lang !== "de") {
        message.reply("Language not supported")
        break
    }

    let text = args.splice(1).join(" ")

    console.log("Add text", text)

    // TODO: Make persistent
    listOfModResponses[language].push(text)

    break
}



const { Command } = require('./command');
const tools = require('../tools')

class RoleCommand extends Command {
    constructor(logger) {
        super("ping");
        this.logger = logger;
    }

    hasPermission(permissions) {
        return permissions.has("ADMINISTRATOR")
    }

    helpLines() {
        return ["Ping", "`!ping`"];
    }

    message(message, args) {
    }
}

exports.command = RoleCommand;
