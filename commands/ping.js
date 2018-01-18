const { Command } = require('./command');
const tools = require('../tools')

class PingCommand extends Command {
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
        message.reply("Pong!");
    }
}

exports.command = PingCommand;
