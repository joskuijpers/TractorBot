exports.messageIsFromBotChannel = function(message) {
    return message.channel.name == "bot"
}

exports.messageIsFromAdmin = function(message) {
    return message.channel.permissionsFor(message.member).has("ADMINISTRATOR")
}
