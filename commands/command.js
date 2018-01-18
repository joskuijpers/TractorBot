class Command {
    constructor(identifier, aliases) {
        this.identifier = identifier
        this.aliases = aliases || []
    }

    hasPermission(permissions) {
        return true
    }

    helpLines() {
        return []
    }

    channels() {
        return []
    }

    help(message) {
        return message.reply(this.helpLines().join("."))
    }

    message(message, args) {
    }
}

exports.Command = Command
