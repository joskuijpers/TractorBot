const Discord = require("discord.js")
const logger = require("winston")
const _ = require("lodash")
const tools = require("./tools")
const { Storage } = require("./storage")

// Configure a logger
logger.remove(logger.transports.Console)
logger.add(logger.transports.Console, {
    colorize: true
})
logger.level = process.env["NODE_ENV"] == "production" ? "info" : "debug"

// Load storage
const storage = new Storage()

// Load command system
const commandNames = [
    "mods",
    "ping",
    "role",
    "norole",
    "lines",
    "addmod",
    "remmod"
]

const commands = _.flatMap(commandNames, n => {
    const { command } = require("./commands/" + n)
    return new command(logger, storage)
})

// Initialize Discord Bot
const client = new Discord.Client()

client.on("ready", (evt) => {
    logger.info("Connected")
    logger.info("Logged in as: ")
    logger.info(client.user.username + " - (" + client.user.id + ")")
})

function handleCommandMessage(message) {
    let args = message.content.substring(1).split(" ")
    const cmd = args[0].toLowerCase()
    args = args.splice(1)

    // Special help command
    if (cmd == "help") {
        if (!tools.messageIsFromBotChannel(message)) {
            return
        }

        let embed = new Discord.RichEmbed()
            .setTitle("TractorBot Commands")
            .setDescription("These are the commands I accept from you, " + message.author.username + ":")
            .setTimestamp()

        const permissions = message.channel.permissionsFor(message.member)

        _(commands)
            .filter(c => c.hasPermission(permissions))
            .flatMap(c => c.helpLines())
            .forEach(h => embed = embed.addField(h[0], h[1], true))

        return message.channel.send({embed})
    }

    const command = _(commands)
                    .filter(c => {
                        const channels = c.channels(message)
                        return channels.length === 0 || channels.indexOf(message.channel.name) !== - 1
                    })
                    .find(c => c.identifier === cmd || c.aliases.indexOf(cmd) !== -1)

    if (!command) {
        return
    }

    const permissions = message.channel.permissionsFor(message.member)
    if (!command.hasPermission(permissions)) {
        if (message.channel.name == "bot") {
            return message.reply("You do not have permission to use this command.")
        }
    }

    return command.message(message, args)
}

function handleMessage(message) {
    if (message.author.bot) return
    if (message.channel.type == "dm") return

    // Parse commands
    if (message.content.substring(0, 1) == "!") {
        const result = handleCommandMessage(message)

        if (result && result.catch) {
            result.catch(logger.error)
        }
    }


    let lowerContent = message.content.toLowerCase()
    if (lowerContent.startsWith("tractorbot")) {
        if (lowerContent.indexOf("your life") !== -1) {
            message.reply("It all started with the big bang...")
        } else if (lowerContent.indexOf("new mods?") !== -1) {
            const com = _.find(commands, c => c.identifier === "mods")
            com.message(message, [])
        } else if (lowerContent.indexOf("love") !== -1) {
            message.react("\u2764")
        } else if (tools.messageIsFromBotChannel(message)) {
            var args = lowerContent.substring(1).split(" ").splice(1)

            if ((args.length == 1 && args[0].toLowerCase() == "johndeere")
                || (args.length == 2 && args[0].toLowerCase() == "john" && args[1].toLowerCase().startsWith("deer"))) {
                message.reply("Everybody keeps asking, but even I don't know.")
            } else if (args.length == 1) {
                let emoji = client.emojis.find("name", args[0])
                if (emoji) {
                    message.react(emoji)
                }
            }
        }
    }
}

client.on("message", handleMessage)
client.on("error", logger.error)

// TODO: if kicked from server: rejoin

storage
    .open()
    .then(() => client.login(process.env["DISCORD_TOKEN"]))
    .catch(logger.error)

