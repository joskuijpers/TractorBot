const { Command } = require('./command')

class ModsCommand extends Command {
    constructor(logger, storage) {
        super("mods", ["mod"])
        this.logger = logger
        this.storage = storage
    }

    helpLines() {
        return [["Random no-mods answer", "`!mods [nickname]`"]]
    }

    message(message, args) {
        let language = "en"
        if (message.channel.name.endsWith("de")) {
            language = "de"
        }

        const query = "SELECT line FROM MOD_LINES WHERE lang = ? ORDER BY RANDOM() LIMIT 1"
        return this.storage.db.get(query, [language]).then(row => {
            if (!row) return

            const msg = row.line;

            if (args.length > 0) {
                const name = args.join(" ").toLowerCase()
                const member = message.guild.members.find(u => u.user.username.toLowerCase() == name)

                if (member) {
                    return message.channel.send(msg, {reply: member.user})
                }
            }

            return message.reply(msg)
        })
    }
}

exports.command = ModsCommand
