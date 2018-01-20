const { LanguageProcessor } = require('./processor')
const _ = require('lodash')

const matchResponses = [
    [
        /your life/i,
        "It all started with the big bangs..."
    ],
    [
        /john\s*deer[e]?/i,
        [
            "Everybody keeps asking, but even I don't know.",
            "<Missing License. Abort>"
        ]
    ],
    [
        /how are you( doing)?\?/,
        "I am fine, thank you."
    ]
]

class SimpleProcessor extends LanguageProcessor {
    match(content) {
        // Find first (or best) match
        let i = _.findIndex(matchResponses, p => _.isArray(content.match(p[0])))
        if (i === -1) {
            return null
        }

        let match = content.match(matchResponses[i][0])

        return {
            result: match,
            processor: this,
            index: i
        }
    }

    process(message, content, match) {
        let text = matchResponses[match.index][1]

        // Allow for multiple random responses
        if (_.isArray(text)) {
            text = _.sample(text)
        }

        return message.reply(text)
    }
}

exports.processor = SimpleProcessor
