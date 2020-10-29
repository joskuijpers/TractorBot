const { Command } = require('./command')

class RemModLineCommand extends Command {
    constructor(logger, storage) {
        super("remline", ["rmline"])
        this.logger = logger
        this.storage = storage
    }

    hasPermission(permissions) {
        return permissions.has("ADMINISTRATOR")
    }

    helpLines() {
        return [["Remove mod line", "`!" + this.identifier + " <id>`"]]
    }

    async message(message, args) {
        if (args.length < 1) {
            return this.help(message)
        }

        let id = parseInt(args[0], 10)
        if (isNaN(id)) {
            return this.help(message)
        }

        return this.storage.db.run("DELETE FROM MOD_LINES WHERE id = ?", [id])
            .then(result => message.reply("Removed line with number " + id))
            .catch(error => {
                this.logger.error(error)
                return message.reply("Failed to remove line: " + error.message)
            })
    }
}

exports.command = RemModLineCommand
