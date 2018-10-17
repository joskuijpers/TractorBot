-- Up
CREATE TABLE TIMEOUTS (
    id INTEGER PRIMARY KEY,
    userId TEXT,
    nickname TEXT,
    startDate INTEGER,
    endDate INTEGER,
    reason TEXT,
    issuedBy TEXT,
    num INTEGER
);
CREATE UNIQUE INDEX unique_user_timeout ON TIMEOUTS(userId);

-- Down
DROP TABLE TIMEOUTS;
