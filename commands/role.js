const { Command } = require('./command')
const tools = require('../tools')

class RoleCommand extends Command {
    constructor(logger) {
        super("role")
        this.logger = logger
    }

    helpLines() {
        return [["Add a role", "`!role <role name>`"]]
    }

    channels() {
        return ["bot"]
    }

    message(message, args) {
        if (args.length == 0) {
            return this.help(message)
        }

        let roleName = args[0].toLowerCase()
        let role = message.guild.roles.find(v => v.name.toLowerCase() == roleName)

        if (role && message.member) {
            return message.member.addRole(role)
                .then(_ => message.reply("Done!"))
                .catch(error => {
                    if (error.message == "Missing Permissions") {
                        message.reply("I can't give you this role")
                    } else {
                        this.logger.error(error)
                    }
                })
        }
    }
}

exports.command = RoleCommand
