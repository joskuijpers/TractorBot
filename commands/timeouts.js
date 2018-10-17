const { Command } = require('./command')
const tools = require('../tools')
const moment = require('moment')
const _ = require('lodash')

class TimeoutsCommand extends Command {
    constructor(logger, storage) {
        super("timeouts")
        this.logger = logger
        this.storage = storage
    }

    helpLines() {
        return [["List timeouts", "`!timeouts [all]`"]]
    }

    hasPermission(permissions, member) {
        return permissions.has("MANAGE_MESSAGES")
    }

    channels() {
        return ["🔥war-room", "bot"]
    }

    message(message, args) {
        let query = "SELECT nickname, startDate, endDate, reason, issuedBy, num FROM TIMEOUTS WHERE endDate > ? AND startDate < ?"
        let params = [moment().unix(), moment().unix()]

        if (args.length > 0 && (args[0] == "all")) {
            query = "SELECT nickname, startDate, endDate, reason, issuedBy, num FROM TIMEOUTS"
            params = []
        }

        return this.storage.db.all(query, params).then(rows => {
            if (!rows || rows.length == 0) {
                return message.reply("No timeouts")
            }

            const text = _(rows)
                .map(timeOut => {
                    const start = moment.unix(timeOut.startDate)
                    const end = moment.unix(timeOut.endDate)

                    return "[" + timeOut.nickname + "] for '" + timeOut.reason + "' by " + timeOut.issuedBy +  ". From " + start.calendar() + " until " + end.calendar() + " (#" + timeOut.num + ")"
                })
                .reduce((acc, v) => acc + "\n" + v)

            return message.reply("\n" + text)
        })

    }
}

exports.command = TimeoutsCommand
