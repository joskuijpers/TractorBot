const Discord = require("discord.js")
const logger = require("winston")
const _ = require("lodash")
const tools = require("./tools")

// Configure a logger

logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = "debug";

// Load storage

// Load command system
const commandNames = [
    "mods",
    "ping",
    "role",
    "norole"
];

const commands = _.flatMap(commandNames, n => {
    const cls = require("./commands/" + n).command;
    return new cls(logger)
});

// Initialize Discord Bot
const client = new Discord.Client()

client.on("ready", (evt) => {
    logger.info("Connected")
    logger.info("Logged in as: ")
    logger.info(client.user.username + " - (" + client.user.id + ")")
})

function handleCommandMessage(message) {
    let args = message.content.substring(1).split(" ");
    const cmd = args[0].toLowerCase();
    args = args.splice(1);

    // Special help command
    if (cmd == "help") {
        if (!tools.messageIsFromBotChannel(message)) {
            return
        }

        const permissions = message.channel.permissionsFor(message.member)
        const list = _(commands)
                        .filter(c => c.hasPermission(permissions))
                        .flatMap(commands, c => c.helpLines())
                        .values()

        // TODO: make it a card
        return message.reply("My commands are:\n" + list.join("\n"))
    }

    const command = _(commands)
                    .filter(c => {
                        const channels = c.channels(message);
                        return channels.length === 0 || channels.indexOf(message.channel.name) !== - 1
                    })
                    .find(c => c.identifier === cmd || c.aliases.indexOf(cmd) !== -1);

    if (!command) {
        return
    }

    const permissions = message.channel.permissionsFor(message.member)
    if (!command.hasPermission(permissions)) {
        if (message.channel.name == "bot") {
            return message.reply("You do not have permission to use this command.")
        }
    }

    return command.message(message, args);
}

client.on("message", message => {
    // Parse commands
    if (message.content.substring(0, 1) == "!") {
        const result = handleCommandMessage(message)

        if (result && result.catch) {
            result.catch(logger.error);
        }
    }


    let lowerContent = message.content.toLowerCase()
    if (lowerContent.startsWith("tractorbot")) {
        if (lowerContent.indexOf("your life") !== -1) {
            message.reply("It all started with the big bang...")
        // } else if (lowerContent.indexOf("best mod?") !== -1) {
        //     message.reply("The best mod is Seasons, of course...")
        } else if (tools.messageIsFromBotChannel(message)) {
            var args = lowerContent.substring(1).split(" ").splice(1)

            if (args.length == 1) {
                let emoji = client.emojis.find("name", args[0])
                if (emoji) {
                    message.react(emoji)
                }
            }
        }
    }
})

client.on("error", logger.error)

// TODO: if kicked from server: rejoin

client.login(process.env["DISCORD_TOKEN"])
