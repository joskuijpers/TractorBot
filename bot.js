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

// Initialize Discord Bot
const client = new Discord.Client()

// Load command system
const commandNames = [
    "mods",
    "ping",
    "role",
    "norole",
    "lines",
    "addmod",
    "remmod",
    // "meme"
]

const commands = _.map(commandNames, n => {
    const { command } = require("./commands/" + n)
    return new command(logger, storage)
})

// Load language processing system
const processorNames = [
    "simple",
    "emoji",
]

const languageProcessors = _.map(processorNames, n => {
    const { processor } = require("./language/" + n)
    return new processor(client, logger, storage)
})

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

function handleLanguageMessage(message, content) {
    const match = _(languageProcessors)
                // filter on channel
                .filter(processor => {
                    if (message.channel.type === "dm") {
                        return true
                    }

                    const channels = processor.channels(message)
                    return channels.length === 0 || channels.indexOf(message.channel.name) !== - 1
                })
                // find matches
                .map(processor => processor.match(content))
                // remove failed matches
                .filter(v => !!v)
                // take the first (find best match?)
                .first()

    if (match) {
        return match.processor.process(message, content, match)
    }

    if (content.toLowerCase().indexOf("new mods?") !== -1) {
        const com = _.find(commands, c => c.identifier === "mods")
        return com.message(message, [])
    }
}

function handleMessage(message) {
    if (message.author.bot) return

    // Parse commands
    if (message.channel.type !== "dm"
        && message.content.substring(0, 1) == "!") {
        return handleCommandMessage(message)
    }

    // Parse language on DM
    if (message.channel.type === "dm") {
        return handleLanguageMessage(message, message.content)
    }

    // Parse language
    let content = message.content
    if (content.toLowerCase().startsWith("tractorbot") // listens to tractorbot
        || (content[0] == "<" /*speed*/ && content.startsWith("<@" + client.user.id + ">"))) { // and a mention/ping
        // Remove the mention or name
        let firstSpace = content.indexOf(" ")
        if (firstSpace == -1) {
            return
        }
        content = content.substr(firstSpace).trim()

        return handleLanguageMessage(message, content)
    }
}

client.on("message", message => {
    const result = handleMessage(message)
    if (result && result.catch) {
        result.catch(logger.error)
    }
})
client.on("error", logger.error)

// TODO: if kicked from server: rejoin

storage
    .open()
    .then(() => client.login(process.env["DISCORD_TOKEN"]))
    .catch(logger.error)

