const { Command } = require('./command')
const tools = require('../tools')

class FS19Command extends Command {
    constructor(logger) {
        super("fs19")
        this.logger = logger
    }

    message(message, args) {
        message.reply("We won't be disclosing any more of the FS19 features for now so don't bother asking here.")
    }
}

exports.command = FS19Command
