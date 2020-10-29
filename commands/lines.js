const Discord = require("discord.js")
const { Command } = require('./command')
const _ = require('lodash')

class LinesCommand extends Command {
    constructor(logger, storage) {
        super("lines")
        this.logger = logger
        this.storage = storage
    }

    hasPermission(permissions) {
        return permissions.has("ADMINISTRATOR")
    }

    helpLines() {
        return [["Show all mods lines", "`!lines [en|de]`"]]
    }

    async message(message, args) {
        let query = "SELECT lang, line, id FROM MOD_LINES"
        let params = []

        if (args.length > 0 && (args[0] == "en" || args[0] == "de")) {
            query = "SELECT lang, line FROM MOD_LINES WHERE lang = ?"
            params = args[0]
        }

        return this.storage.db.all(query, params).then(rows => {
            if (!rows) return

            const text = _(rows)
                .map(l => "[" + l.lang + "] " + l.line + " (" + l.id +  ")")
                .reduce((acc, v) => acc + "\n" + v)

            return message.reply("\n" + text)
        })
    }
}

exports.command = LinesCommand
