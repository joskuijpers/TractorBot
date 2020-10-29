const { Command } = require('./command')
const _ = require('lodash')
const Discord = require('discord.js')

class MemeCommand extends Command {
    constructor(logger) {
        super("meme")
        this.logger = logger
    }

    helpLines() {
        return [["Create a meme", "`!meme <type>; <top text>; <bottom text>`"]]
    }

    channels() {
        return ["bot"]
    }

    async message(message, args) {
        const text = message.content.substr(6).toLowerCase()
        const parts = _.map(text.split(";"), _.trim)
        if (parts.length < 2) {
            return this.help(message)
        }

        let safeParts = _.map(parts, v => v.replace(/[\/\"\']/ig, "")).filter(v => v.length > 0)
        let url = "http://urlme.me/" + encodeURI(safeParts.join("/")) + ".jpg"
        let embed = new Discord.RichEmbed().setImage(url)

        return message.reply({embed})
    }
}

exports.command = MemeCommand
