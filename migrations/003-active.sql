-- Up
ALTER TABLE TIMEOUTS ADD COLUMN active INTEGER;

-- Down
CREATE TABLE TIMEOUTS_NEW (
    id INTEGER PRIMARY KEY,
    userId TEXT,
    nickname TEXT,
    startDate INTEGER,
    endDate INTEGER,
    reason TEXT,
    issuedBy TEXT,
    num INTEGER
);

INSERT INTO TIMEOUTS_NEW SELECT id, userId, nickname, startDate, endDate, reason, issuedBy, num FROM TIMEOUTS;

DROP TABLE TIMEOUTS;

ALTER TABLE TIMEOUTS_NEW RENAME TO TIMEOUTS;

CREATE UNIQUE INDEX unique_user_timeout ON TIMEOUTS(userId);
