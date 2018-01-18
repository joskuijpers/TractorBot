case "remmod": {
    if (!messageIsFromAdmin(message)) break

    if (args.length < 2) {
        message.reply("To remove mod text: `!remmod [en|de] [text]`")
        break
    }

    let lang = args[0]

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
