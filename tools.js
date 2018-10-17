exports.messageIsFromBotChannel = function(message) {
    return message.channel.name == "bot" || message.channel.name == "🔥war-room"
}

exports.messageIsFromAdmin = function(message) {
    return message.channel.permissionsFor(message.member).has("ADMINISTRATOR")
}
