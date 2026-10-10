import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("godcomplex.js", "utf8");
const MARKER = "[GODCOMPLEX]";

function run({ messages = [], lastMessage, personality = "arrogant tyrant", description = "", scenario = "" } = {}) {
    const context = {
        character: { personality, description, scenario },
        chat: { last_messages: messages, last_message: lastMessage }
    };
    vm.runInNewContext(source, { context, console });
    return context;
}

test("is valid JavaScript script syntax and runs with no context", () => {
    new vm.Script(source);
    const context = {};
    vm.runInNewContext(source, { context, console });
    assert.equal(context.character.scenario, "");
});

test("activation preserves existing scenario and keeps a complete note in budget", () => {
    const context = run({ scenario: "Character card.", lastMessage: "I challenge your authority. I refuse to obey." });
    const result = context.character.scenario;
    assert.ok(result.startsWith("Character card.\n\n" + MARKER));
    const added = result.slice("Character card.".length);
    assert.ok(Math.ceil(added.length / 4) <= 170);
    assert.ok(added.endsWith("."));
    assert.match(added, /Do not invent powers or beliefs/);
    assert.match(added, /control the user's character/);
});

test("ordinary questions don't activate", () => {
    assert.equal(run({ lastMessage: "Can I ask you a question about justice?" }).character.scenario, "");
});

test("a character without established authority or convictions is not made a god", () => {
    assert.equal(run({ personality: "humble and timid", lastMessage: "I challenge your authority!" }).character.scenario, "");
});

test("chronological and newest-first JanitorAI history both work", () => {
    const chronological = [
        { message: "A calm day." },
        { message: "I challenge your orders." },
        { message: "You will obey." }
    ];
    const newest = chronological.slice().reverse();
    const opts = { lastMessage: "You will obey." };
    assert.equal(run({ messages: chronological, ...opts }).character.scenario,
        run({ messages: newest, ...opts }).character.scenario);
});

test("timestamped history is ordered correctly", () => {
    const messages = [
        { date: "2026-10-02T23:00:02Z", content: "You will obey." },
        { date: "2026-10-02T23:00:01Z", content: "A calm day." }
    ];
    assert.match(run({ messages, lastMessage: "You will obey." }).character.scenario, /\[GODCOMPLEX\]/);
});

test("no duplicate note in the same execution context", () => {
    const context = run({ lastMessage: "I challenge your authority!" });
    vm.runInNewContext(source, { context, console });
    assert.equal(context.character.scenario.split(MARKER).length - 1, 1);
});

test("a normal dialogue without explicit power cues stays untouched", () => {
    assert.equal(run({ messages: ["They drink tea.", "They go home."] }).character.scenario, "");
});
