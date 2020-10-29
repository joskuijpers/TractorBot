const sqlite3 = require('sqlite3')
const { open } = require('sqlite')

class Storage {

    constructor(path) {
        this.path = path || "./TractorBot.sqlite"
    }

    async open() {
        const options = process.env["NODE_ENV"] != "production" ? { force: "last" } : {}

        return open({
            filename: this.path,
            driver: sqlite3.Database
        }).then((db) => {
            this.db = db;
            return db.migrate(options)
        })
    }

    async get(query) {
        return this.db.get(query)
    }
}

exports.Storage = Storage
