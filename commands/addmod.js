const { Command } = require('./command')

class AddModLineCommand extends Command {
    constructor(logger, storage) {
        super("addline")
        this.logger = logger
        this.storage = storage
    }

    hasPermission(permissions) {
        return permissions.has("ADMINISTRATOR")
    }

    helpLines() {
        return [["Add mod line", "`!" + this.identifier + " <en|de> <text>`"]]
    }

    message(message, args) {
        if (args.length < 2) {
            return this.help(message)
        }

        const language = args[0]
        const line = args.splice(1).join(" ")

        return this.storage.db.run("INSERT INTO MOD_LINES (lang, line) VALUES (?, ?)", [language, line])
            .then(result => message.reply("Added line '" + line + "' as number " + result.stmt.lastID))
            .catch(error => {
                this.logger.error(error)
                return message.reply("Failed to add line: " + error.message)
            })
    }
}

exports.command = AddModLineCommand
