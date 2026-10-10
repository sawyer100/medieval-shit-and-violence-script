"use worker";

/*
 * Godcomplex — JanitorAI
 * Reinforces a character's established convictions and relationship to power.
 * Never assigns new powers, motives, beliefs, or control over the user.
 */

context.character = context.character || {};
context.chat = context.chat || {};
context.character.scenario = context.character.scenario || "";

const CONFIG = {
    DEBUG: false,
    HISTORY_DEPTH: 6,
    MAX_TOKENS: 170,
    MIN_SCORE: 4
};

const MARKER = "[GODCOMPLEX]";

function messageText(item) {
    if (typeof item === "string") return item;
    if (!item || typeof item !== "object") return "";
    if (typeof item.message === "string") return item.message;
    if (typeof item.content === "string") return item.content;
    if (typeof item.text === "string") return item.text;
    return "";
}

const lastMessage = messageText(context.chat.last_message);
const history = Array.isArray(context.chat.last_messages)
    ? context.chat.last_messages.slice()
    : [];

// JanitorAI examples have shown chronological history, while some community
// scripts assume newest-first. Prefer timestamps or last_message when present.
if (history.length > 1) {
    const firstDate = Date.parse(history[0] && history[0].date);
    const lastDate = Date.parse(history[history.length - 1] && history[history.length - 1].date);
    if (Number.isFinite(firstDate) && Number.isFinite(lastDate)) {
        if (firstDate > lastDate) history.reverse();
    } else if (lastMessage && messageText(history[0]) === lastMessage &&
               messageText(history[history.length - 1]) !== lastMessage) {
        history.reverse();
    }
}

const messages = history.map(messageText).filter(Boolean);
if (lastMessage) {
    // Remove every copy before appending the authoritative latest message.
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i] === lastMessage) messages.splice(i, 1);
    }
    messages.push(lastMessage);
}
const recent = messages.slice(-CONFIG.HISTORY_DEPTH);

const card = [
    context.character.personality,
    context.character.description,
    context.character.scenario
].filter(function (value) { return typeof value === "string"; }).join(" ");

// A generic question should not make a gentle or uncertain character suddenly
// act all-powerful. Require that conviction/authority is already in their card.
const ESTABLISHED_CONVICTION = /\b(?:god complex|godlike|divin(?:e|ity)|deity|goddess|immortal|supreme|omnipotent|infallible|megalomaniac|narcissis\w*|arrogant|haughty|prideful|authoritarian|tyrann?ical|tyrant|domineering|power-hungry|self-righteous|uncompromising|fanatic\w*|zealot|dogmatic|commanding|ruler|monarch|emperor|empress|king|queen|conviction(?:s)?|unyielding)\b/i;

const SIGNALS = [
    { id: "challenge", weight: 3, rx: /\b(?:challeng(?:e|es|ed|ing)|defy|defies|defied|defiance|doubt(?:s|ed)? (?:you|him|her|them)|question(?:s|ed|ing)? (?:your|his|her|their) (?:rule|orders|authority)|refus(?:e|es|ed|ing) (?:to obey|your orders|his orders|her orders))\b/i },
    { id: "authority", weight: 2, rx: /\b(?:obey|obedience|kneel|kneels|command(?:s|ed)?|submit|submission|surrender (?:your|his|her|their) (?:authority|power)|absolute (?:power|authority))\b/i },
    { id: "identity", weight: 2, rx: /\b(?:god|goddess|deity|divine|supreme|invincible|immortal|infallible|destiny)\b/i },
    { id: "conviction", weight: 1, rx: /\b(?:beliefs?|ideology|principles|justice|righteous|deserve(?:s|d)?)\b/i },
    { id: "threat", weight: 2, rx: /\b(?:threaten(?:s|ed|ing)?|defeat(?:ed)?|humiliat(?:e|ed|ing)|confront(?:ed|ing)?)\b/i }
];

let score = 0;
if (recent.length && ESTABLISHED_CONVICTION.test(card)) {
    recent.forEach(function (message, index) {
        const weight = index === recent.length - 1 ? 2 : 1;
        SIGNALS.forEach(function (signal) {
            if (signal.rx.test(message)) score += signal.weight * weight;
        });
    });
}

const fullNote = "\n\n" + MARKER + "\n" +
    "Preserve the character's established worldview, convictions, motives, flaws, and limits. " +
    "When challenged, let them answer using their own reasoning instead of automatically " +
    "conceding or becoming generically angry. Express confidence in their established voice " +
    "and choices, whether composed, charismatic, cold, righteous, or arrogant. " +
    "Do not invent powers or beliefs, force conflict or violence, or control the user's character.";

const compactNote = "\n\n" + MARKER + "\n" +
    "Keep the character's established convictions and limits consistent when challenged. " +
    "Let their existing personality determine whether they respond calmly, firmly, " +
    "or arrogantly. Do not invent powers or beliefs, escalate conflict, or control the user.";

function estimateTokens(value) {
    return Math.ceil(value.length / 4);
}

if (recent.length && score >= CONFIG.MIN_SCORE &&
    !context.character.scenario.includes(MARKER)) {
    const note = estimateTokens(fullNote) <= CONFIG.MAX_TOKENS
        ? fullNote : compactNote;
    if (estimateTokens(note) <= CONFIG.MAX_TOKENS) {
        context.character.scenario += note;
    }
}

if (CONFIG.DEBUG) {
    console.log(MARKER, { score: score, cardMatched: ESTABLISHED_CONVICTION.test(card),
        historyCount: recent.length, notePresent: context.character.scenario.includes(MARKER) });
}
