const Discord = require("discord.js")
const winston = require("winston")
const _ = require("lodash")
const tools = require("./tools")
const { Storage } = require("./storage")

// Configure a logger
const logger = winston.createLogger({
    level: process.env["NODE_ENV"] == "production" ? "info" : "debug",
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
    ),
    transports: [
        new winston.transports.Console({colorize: true}),
    ]
})

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
    "fs19"
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

const gameData = {
    helloChannelId: "459293598203248641",

    welcomeMessage: "Hello! Welcome to the Farming Simulator Discord!\n\nWe have this awesome team system here.",

    regionMessage: "Please select one of the regions by clicking on a reaction. If you clicked wrong, just click another.",
    regions: [
        {
            name: "eu",
            icon: "🇪🇺",
            role: "EU"
        },
        {
            name: "us",
            icon: "🇺🇸",
            role: "US"
        },
        {
            name: "other",
            icon: "🌏",
            role: "Other"
        }
    ],

    languageMessage: "Choose a language that you understand to get access to channels:",
    languages: [
        {
            name: "en",
            icon: "🇬🇧",
            role: "EN"
        },
        {
            name: "de",
            icon: "🇩🇪",
            role: "DE"
        },
        {
            name: "fr",
            icon: "🇫🇷",
            role: "FR"
        },
        {
            name: "nl",
            icon: "🇳🇱",
            role: "NL"
        },
        {
            name: "pl",
            icon: "🇵🇱",
            role: "PL"
        },
        {
            name: "es",
            icon: "🇪🇸",
            role: "ES"
        }
    ],
    languageCancel: {
        icon: "❌"
    },

    moddingMessage: "Are you a modder or are you interested in modding? Join the modding community:",
    moddingRole: "Modding",
    moddingActivate: {
        icon: "🔧"
    },
    moddingDeactivate: {
        icon: "❌"
    }
}

client.on("ready", async (evt) => {
    logger.info("Connected")
    logger.info("Logged in as: ")
    logger.info(client.user.username + " - (" + client.user.id + ")")

    startGameSystem()
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


client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) {
        // Ignore ourselves: that is annoying and circular
        return
    }

    const removal = reaction.remove(user)

    await handleGameReaction(reaction, user)
        .catch(logger.error)

    return removal
})

async function startGameSystem() {
    let gameChannel = client.channels.get(gameData.helloChannelId)
    gameData.helloChannel = gameChannel

    logger.info("Clearing all messages in #" + gameChannel.name)

    // Remove all possible message in the welcome channel
    await gameChannel
        .fetchMessages({ limit: 10 })
        .then(async messages => Promise.all(_.mapValues([...messages], message => message[1].delete())))
        .catch(logger.error)

    logger.info("Adding welcome message")

    await gameChannel
        .send(gameData.welcomeMessage)
        .then(async message => gameData.welcomeMessageObject = message )
        .catch(logger.error)

    logger.info("Adding region message")

    // Add the welcome text
    await gameChannel
        .send(gameData.regionMessage)
        .then(async message => {
            gameData.regionMessageObject = message

            logger.info("Adding reactions to region message")

            for (region of gameData.regions) {
                await message.react(region.icon)
            }
        })
        .catch(logger.error)

    logger.info("Adding language message")

    await gameChannel
        .send(gameData.languageMessage)
        .then(async message => {
            gameData.languageMessageObject = message

            logger.info("Adding reactions to language message")

            for (language of gameData.languages) {
                await message.react(language.icon)
            }

            await message.react(gameData.languageCancel.icon)
        })
        .catch(logger.error)

    logger.info("Adding modding message")

    await gameChannel
        .send(gameData.moddingMessage)
        .then(async message => {
            gameData.moddingMessageObject = message

            logger.info("Adding reactions to modding message")

            await message.react(gameData.moddingActivate.icon)
            await message.react(gameData.moddingDeactivate.icon)
        })
        .catch(logger.error)

    logger.info("Done")
}

async function handleGameReaction(reaction, user) {
    const message = reaction.message
    const guild = message.guild
    const member = guild.member(user)

    async function addRole(roleName) {
        const role = guild.roles.find("name", roleName)
        if (role) {
            return member.addRole(role)
        } else {
            return Promise.resolve()
        }
    }

    async function removeRole(roleName) {
        const role = guild.roles.find("name", roleName)
        if (role) {
            return member.removeRole(role)
        } else {
            return Promise.resolve()
        }
    }

    if (reaction.message.equals(gameData.regionMessageObject)) {
        const region = _.find(gameData.regions, region => region.icon == reaction.emoji.name)

        if (region != null) {
            const role = guild.roles.find("name", region.role)

            if (role != null && !member.roles.has(role.id)) {
                // Only allow 1 region so first delete all and then add the role
                return Promise
                    .all(_.map(gameData.regions, region => removeRole(region.role)))
                    .then(e => member.addRole(role))
            }
        }

    } else if (reaction.message.equals(gameData.languageMessageObject)) {
        const language = _.find(gameData.languages, lang => lang.icon == reaction.emoji.name)

        if (language != null) {
            return addRole(language.role)
        }

        if (reaction.emoji.name == gameData.languageCancel.icon) {
            return Promise.all(_.map(gameData.languages, language => removeRole(language.role)))
        }

    } else if (reaction.message.equals(gameData.moddingMessageObject)) {
        if (reaction.emoji.name == gameData.moddingActivate.icon) {
            return addRole(gameData.moddingRole)
        } else if (reaction.emoji.name == gameData.moddingDeactivate.icon) {
            return removeRole(gameData.moddingRole)
        }
    }

    return Promise.resolve()
}


storage
    .open()
    .then(() => client.login(process.env["DISCORD_TOKEN"]))
    .catch(logger.error)
