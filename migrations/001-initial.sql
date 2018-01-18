-- Up
CREATE TABLE MOD_LINES (
    id INTEGER PRIMARY KEY,
    lang VARCHAR(2),
    line TEXT
);

INSERT INTO MOD_LINES (lang, line) VALUES ('en', 'Perhaps.');
INSERT INTO MOD_LINES (lang, line) VALUES ('en', 'Are there any mods coming today? - Oh, malfunction detected...');
INSERT INTO MOD_LINES (lang, line) VALUES ('en', 'The mods are still in the oven.');
INSERT INTO MOD_LINES (lang, line) VALUES ('en', 'They still need some time to get them juuuuuust right.');
INSERT INTO MOD_LINES (lang, line) VALUES ('en', 'I am TractorBot, human-cyborg relations. I am fluent in over 6 Million ways of saying: We will not answer this.');
INSERT INTO MOD_LINES (lang, line) VALUES ('en', 'How should I know? I''m just a Bot');
INSERT INTO MOD_LINES (lang, line) VALUES ('en', 'A mod is never late, nor is it early. It arrives precisely when it means to.');
INSERT INTO MOD_LINES (lang, line) VALUES ('en', 'To mod or not to mod, that''s the question');

INSERT INTO MOD_LINES (lang, line) VALUES ('de', 'Vielleicht.');
INSERT INTO MOD_LINES (lang, line) VALUES ('de', 'Die Mods sind noch im Ofen.');
INSERT INTO MOD_LINES (lang, line) VALUES ('de', 'Ich bin TractorBot, human-cyborg relations. Ich kann dir in über 6 Millionen Sprachen sagen: Wir werden diese Frage nicht beantworten.');
INSERT INTO MOD_LINES (lang, line) VALUES ('de', 'Mod oder nicht Mod, das ist hier die Frage');
INSERT INTO MOD_LINES (lang, line) VALUES ('de', 'Ein Mod kommt nie zu spät. Ebensowenig zu früh. Er trifft genau dann ein, wenn er es für richtig hält.');

-- Down
DROP TABLE MOD_LINES;





