const { Command } = require('./command')
const tools = require('../tools')
const moment = require('moment')
const durationParser = require('parse-duration')

class TimeoutCommand extends Command {
    constructor(logger, storage) {
        super("timeout")
        this.logger = logger
        this.storage = storage
    }

    helpLines() {
        return [["Give someone a timeout", "`!timeout <person> [duration] [reason]`"]]
    }

    hasPermission(permissions, member) {
        return permissions.has("MANAGE_MESSAGES")
    }

    message(message, args) {
        if (args.length == 0) {
            return this.help(message)
        }
        if (message.mentions.members.size == 0) {
            return this.help(message)
        }

        // Target user
        const member = message.mentions.members.first()
        const timeoutRole = message.guild.roles.find(v => v.name.toLowerCase() == "timeout")

        let duration = moment.duration(10, "m")
        if (args.length >= 2) {
            const parsed = durationParser(args[1])
            if (parsed != 0) {
                duration = moment.duration(parsed)
            }
        }

        if (duration.asDays() > 2) {
            duration = moment.duration(10, "m")
        }

        const reason = args.length > 2 ? args.splice(2).join(" ") : "unknown"
        const start = moment()
        const end = moment().add(duration)

        if (timeoutRole) {
            return this.storage.db.run("INSERT INTO TIMEOUTS (userId, nickname, startDate, endDate, reason, issuedBy, num) VALUES (?, ?, ?, ?, ?, ?, 1) ON CONFLICT(userId) DO UPDATE SET endDate=excluded.endDate, startDate=excluded.startDate, num=excluded.num+1, reason=excluded.reason", [member.id, member.user.username, start.unix(), end.unix(), reason, message.member.user.username])
                .then(result =>
                    member.addRole(timeoutRole)
                        .then(_ => message.reply("Given time-out of " + duration.humanize()))
                        .catch(error => {
                            this.logger.error(error.message)
                        })
                )
                .catch(error => {
                    this.logger.error(error)
                    return message.reply("Failed to add timeout: " + error.message)
                })
        }
    }
}

exports.command = TimeoutCommand
