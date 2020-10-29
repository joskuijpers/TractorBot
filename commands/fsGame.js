const { Command } = require('./command')
const tools = require('../tools')

class FSGameCommand extends Command {
    constructor(logger) {
        super("fs22")
        this.logger = logger
    }

    async message(message, args) {
        let user
        let msg = "We won't be disclosing any more of the FS22 features for now so don't bother asking here."

        if (message.mentions.users.size > 0) {
            user = message.mentions.users.first()
        } else {
            let member = message.guild.members.find(u => u.user.username.toLowerCase() == name)
            if (!!member) {
                user = member.user
            }
        }

        if (user) {
            return message.channel.send(msg, {reply: user})
        } else {
            message.reply(msg)
        }
    }
}

exports.command = FS19Command
