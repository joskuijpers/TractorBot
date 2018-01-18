const { Command } = require('./command');
const tools = require('../tools')

class NoRoleCommand extends Command {
    constructor(logger) {
        super("norole");
        this.logger = logger;
    }

    helpLines() {
        return ["Remove a role", "`!norole <role name>`"];
    }

    channels() {
        return ["bot"];
    }

    message(message, args) {
        if (args.length == 0) {
            return this.help(message);
        }

        let roleName = args[0].toLowerCase()
        let role = message.guild.roles.find(v => v.name.toLowerCase() == roleName)

        if (role) {
            return message.member.removeRole(role)
                .then(_ => message.reply("Done!"))
                .catch(error => {
                    if (error.message == "Missing Permissions") {
                        message.reply("I can't remove this role")
                    } else {
                        this.logger.error(error)
                    }
                });
        }
    }
}

exports.command = NoRoleCommand;
