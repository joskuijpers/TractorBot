const Discord = require("discord.js")
const winston = require("winston")
const moment = require('moment')
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
    // "role",
    // "norole",
    "lines",
    "addmod",
    "remmod",
    // "fsGame",
    // "meme",
    "timeout",
    "timeouts",
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

    welcomeMessage: "Welcome to the official Farming Simulator Discord\nPlease keep all conversations social and friendly.\n\nPlease chose from the following options to customise your Discord experience and tailor it to your liking.\nYou can come back to the welcome channel at any time to adjust your settings.\n\n",

    platformMessage: "Please select the platforms you play Farming Simulator on.\nBitte wähle die Plattformen auf denen du den Landwirtschafts-Simulator spielst aus.",
    platforms: [
        {
            name: "pc",
            icon: "🖥️",
            role: "PC/Mac",
            "id": "🖥️"
        },
        {
            name: "xbox",
            icon: '679310690212773899',
            role: "Xbox",
            id: "xbox"
        },
        {
            name: "ps",
            icon: '679310689763983381',
            role: "Playstation",
            id: "playstation"
        },
        {
            name: "mobile",
            icon: "📱",
            role: "Mobile",
            id: "📱"
        },
        {
            name: "switch",
            icon: '679310689961246740',
            role: "Nintendo Switch",
            id: "switch"
        }
    ],
    platformCancel: {
        icon: "❌"
    },

    languageMessage: "Choose a language that you understand to get access to channels:\nBitte wählt eure Sprache(n):",
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

    voiceMessage: "Do you want to see the voice channels?\nWollt ihr die Voice-Kanäle sehen?",
    voiceRole: "Voice",
    voiceActivate: {
        icon: "🔈"
    },
    voiceDeactivate: {
        icon: "🔇"
    },

    moddingMessage: "Are you a modder or are you interested in modding? Join the modding community:",
    moddingRole: "Modding",
    moddingActivate: {
        icon: "🔧"
    },
    moddingDeactivate: {
        icon: "❌"
    },
    privacyMessage: "You can find our privacy policy at https://giants-software.com/privacyPolicy.php"
}

client.on("ready", async (evt) => {
    logger.info("Connected")
    logger.info("Logged in as: ")
    logger.info(client.user.username + " - (" + client.user.id + ")")

    startGameSystem()
    startTimeoutHandler()
})

async function handleCommandMessage(message) {
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

    const member = message.member
    if (member == null) {
        return
    }

    const permissions = message.channel.permissionsFor(member)
    if (!command.hasPermission(permissions, message.member)) {
        if (message.channel.name == "bot") {
            return message.reply("You do not have permission to use this command.")
        } else {
            return Promise.resolve()
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

async function handleMessage(message) {
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

client.on("message", async (message) => {
    const result = handleMessage(message)
    if (result && result.catch) {
        result.catch(logger.error)
    }
})
client.on("error", logger.error)

client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot || !gameData.helloChannel.equals(reaction.message.channel)) {
        // Ignore ourselves: that is annoying and circular
        return
    }

    return handleGameReaction(reaction, user)
        .then(x => reaction.users.remove(user))
        .catch(logger.error)
})

// Create an event listener for new guild members
client.on("guildMemberAdd", async (member) => {
    console.log("NEW MEMBER")
    return onNewGuildMember(member)
});

async function startGameSystem() {
    let gameChannel = await client.channels.fetch(gameData.helloChannelId)
    gameData.helloChannel = gameChannel

    logger.info("Clearing all messages in #" + gameChannel.name)

    gameData.reactionQueue = []

    // Remove all possible message in the welcome channel
    await gameChannel
        .messages.fetch({ limit: 10 })
        .then(async messages => Promise.all(_.mapValues([...messages], message => message[1].delete())))
        .catch(logger.error)

    logger.info("Adding welcome message")

    await gameChannel
        .send(gameData.welcomeMessage)
        .then(async message => gameData.welcomeMessageObject = message )
        .catch(logger.error)

    logger.info("Adding platform message")

    // Add the welcome text
    await gameChannel
        .send(gameData.platformMessage)
        .then(async message => {
            gameData.platformMessageObject = message

            logger.info("Adding reactions to platform message")

            for (platform of gameData.platforms) {
                await message.react(platform.icon.toString())
            }

            await message.react(gameData.platformCancel.icon)
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

    logger.info("Adding voice message")

    await gameChannel
        .send(gameData.voiceMessage)
        .then(async message => {
            gameData.voiceMessageObject = message

            logger.info("Adding reactions to voice message")

            await message.react(gameData.voiceActivate.icon)
            await message.react(gameData.voiceDeactivate.icon)
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

    logger.info("Adding privacy policy")

    await gameChannel
        .send(gameData.privacyMessage)

    logger.info("Done")
}

async function handleGameReaction(reaction, user) {
    const message = reaction.message
    const guild = message.guild
    const member = guild.member(user)


    // reactionQueue
    /*

    Find message
    Find reaction ID
    Find member ID: if not known, fetch first (with function: addActionToQueue())
    Then add to queue
    Clean up queue

    - if clear languages: remove all commands to set language
    - if remove lang X, remove all previous lang X commands
    - if set/unset modding, voice, remove all previous modding, voice commands

    If queue was empty, trigger queue handler (async, timeout)
    Then remove the reaction (always)

    When processing queue:
    - Execute action. For change of membership of region, clear only current one, add new one (=2 calls, not 4)
    - For language clear, only remove current

    If queue is not empty, trigger handler again

     */

    if (member == null) {
        logger.error("Has null member " + user.username)
        return Promise.resolve()
    }

    async function addRole(roleName) {
        guild.roles.fetch().then(roles => {
            const role = roles.cache.find(r => r.name == roleName)
            if (role) {
                return member.roles.add(role)
            }
        })
    }

    async function removeRole(roleName) {
        guild.roles.fetch().then(roles => {
            const role = roles.cache.find(r => r.name == roleName)
            if (role) {
                return member.roles.remove(role)
            }
        })
    }

    if (reaction.message.equals(gameData.platformMessageObject)) {
        const platform = _.find(gameData.platforms, platform => platform.id == reaction.emoji.name)

        if (platform != null) {
            return addRole(platform.role)
        }

        if (reaction.emoji.name == gameData.platformCancel.icon) {
            return Promise.all(_.map(gameData.platforms, platform => removeRole(platform.role)))
        }

    } else if (reaction.message.equals(gameData.languageMessageObject)) {
        const language = _.find(gameData.languages, lang => lang.icon == reaction.emoji.name)

        if (language != null) {
            return addRole(language.role)
        }

        if (reaction.emoji.name == gameData.languageCancel.icon) {
            return Promise.all(_.map(gameData.languages, language => removeRole(language.role)))
        }

    } else if (reaction.message.equals(gameData.voiceMessageObject)) {
        if (reaction.emoji.name == gameData.voiceActivate.icon) {
            return addRole(gameData.voiceRole)
        } else if (reaction.emoji.name == gameData.voiceDeactivate.icon) {
            return removeRole(gameData.voiceRole)
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

async function startTimeoutHandler() {
    const channel = await client.channels.fetch("502134763512135700")
    if (!channel) {
        return
    }
    const guild = channel.guild

    // Remove all possible message in the welcome channel
    await channel
        .messages.fetch({ limit: 10 })
        .then(async messages => Promise.all(_.mapValues([...messages], message => message[1].delete())))
        .catch(logger.error)

    await channel
        .send("You have been put in time-out. You are not able to send any messages or reactions until your time-out has passed.")
        .catch(logger.error)

    setTimeout(timeoutHandler, 30000)
}

async function timeoutHandler() {
    const channel = await client.channels.fetch("502134763512135700")
    if (!channel) {
        return
    }
    const guild = channel.guild

    const query = "SELECT id, userId, nickname, startDate, endDate FROM TIMEOUTS WHERE endDate < ? AND active = 1"
    storage.db.all(query, [moment().unix()])
        .then(rows => {
            if (rows) {
                guild.roles.fetch().then(roles => {
                    const timeoutRole = roles.cache.find(v => v.name.toLowerCase() == "timeout")

                    return Promise
                        .all(_.map(rows, row =>
                            client.users.fetch(row.userId)
                                .then(user => guild.members.fetch(user))
                                .then(member => member.roles.remove(timeoutRole))
                                .then(_ => storage.db.run("UPDATE TIMEOUTS SET active=0 WHERE id = ?", [row.id]))
                                .catch(e => {
                                    logger.error(e)
                                    return storage.db.run("UPDATE TIMEOUTS SET active=0 WHERE id = ?", [row.id])
                                })
                        ))
                        .then(_ => setTimeout(timeoutHandler, 30000))
                        .catch(logger.error)
                })
            }

            setTimeout(timeoutHandler, 30000)
        })
        .catch(logger.error)
}

async function onNewGuildMember(member) {
    const channel = await client.channels.fetch("502134763512135700")
    if (!channel) {
        return
    }
    const guild = channel.guild

    const query = "SELECT 1 FROM TIMEOUTS WHERE startDate < ? AND endDate > ? AND active = 1 AND userId = ?"
    const now = moment().unix()
    return storage.db.get(query, [now, now, member.id])
        .then(item => {
            if (item) {
                guild.roles.fetch().then(roles => {
                    const timeoutRole = roles.cache.find(v => v.name.toLowerCase() == "timeout")
                    return member.roles.add(timeoutRole)
                })
            }
        })
        .catch(logger.error)
}

storage
    .open()
    .then(() => client.login(process.env["DISCORD_TOKEN"]))
    .catch(logger.error)
