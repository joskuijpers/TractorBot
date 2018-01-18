const sqlite = require("sqlite")

class Storage {

    constructor(path) {
        this.path = path || "./TractorBot.sqlite"
    }

    open() {
        const options = process.env["NODE_ENV"] != "production" ? { force: "last" } : {}
        return Promise.resolve()
            .then(() => sqlite.open(this.path, { Promise }))
            .then(db => {
                this.db = db;
                return db.migrate(options)
            })
    }

    get(query) {
        return this.db.get(query)
    }
}

exports.Storage = Storage
