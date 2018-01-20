class LanguageProcessor {
    constructor(client, logger, storage, regex) {
        this.client = client
        this.logger = logger
        this.storage = storage
        this.regex = regex || null
    }

    channels() {
        return []
    }

    match(content) {
        const match = content.match(this.regex)
        if (!match) {
            return null
        }

        return {
            result: match,
            processor: this
        }
    }

    process(message, content, match) {
    }
}

exports.LanguageProcessor = LanguageProcessor
