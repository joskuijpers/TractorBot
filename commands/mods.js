const { Command } = require('./command');
const _ = require("lodash");

const listOfModResponses = {
    "en": [
        "Perhaps.",
        "Are there any mods coming today? - Oh, malfunction detected...",
        "The mods are still in the oven.",
        "They still need some time to get them juuuuuust right.",
        "I am TractorBot, human-cyborg relations. I am fluent in over 6 Million ways of saying: We will not answer this.",
        "How should I know? I'm just a Bot",
        "A mod is never late, nor is it early. It arrives precisely when it means to.",
        "To mod or not to mod, that's the question"
    ],
    "de": [
        "Vielleicht.",
        "Die Mods sind noch im Ofen.",
        "Ich bin TractorBot, human-cyborg relations. Ich kann dir in über 6 Millionen Sprachen sagen: Wir werden diese Frage nicht beantworten.",
        "Mod oder nicht Mod, das ist hier die Frage",
        "Ein Mod kommt nie zu spät. Ebensowenig zu früh. Er trifft genau dann ein, wenn er es für richtig hält"
    ]
};

class ModsCommand extends Command {
    constructor(logger) {
        super("mods", ["mod"]);
        this.logger = logger;
    }

    hasPermission(permissions) {
        return true;
    }

    helpLines() {
        return ["Random no-mods answer", "`!mods [nickname]`"];
    }

    message(message, args) {
        let language = "en";
        if (message.channel.name.endsWith("de")) {
            language = "de";
        }

        const msg = _.sample(listOfModResponses[language]);

        if (args.length > 0) {
            const name = args[0].toLowerCase();
            const member = message.guild.members.find(u => u.user.username.toLowerCase() == name);

            if (member) {
                return message.channel.send(msg, {reply: member.user});
            }
        }

        return message.reply(msg);
    }
}

exports.command = ModsCommand;
