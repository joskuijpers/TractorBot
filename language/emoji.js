const { LanguageProcessor } = require('./processor')
const _ = require('lodash')
const unicodeMap = require("emoji-unicode-map")

const emojiMap = {
    "love": "\u2764",
    "burn": "\u{1F525}"
}

const inverted = _.invertBy(unicodeMap.emoji)

class EmojiProcessor extends LanguageProcessor {
    channels() {
        return ["bot"]
    }

    match(content) {
        let args = _.words(content.toLowerCase())
        if (args.length < 1) {
            return null
        }

        let emoji = this.client.emojis.find("name", args[0])
        if (!emoji) {
            let lc = content.toLowerCase()

            let unicode = _.find(emojiMap, (v, k) => lc.indexOf(k) !== -1) || _.sample(inverted[args[0]] || [])
            if (unicode) {
                emoji = unicode
            } else {
                return null
            }
        }

        return {
            processor: this,
            emoji: emoji
        }
    }

    process(message, content, match) {
        return message.react(match.emoji)
    }
}

exports.processor = EmojiProcessor
