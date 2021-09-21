require('dotenv').config();
const tmi = require('tmi.js');
let broadcasterName = process.env.BROADCASTER_NAME.toLowerCase();
let botName = process.env.BOT_NAME;
let token = process.env.OAUTH_TOKEN;
let maxMessages = process.env.MAX_MESSAGES;
let pauseTime = parseInt(process.env.PAUSE_TIME);
const BASE = process.env.LARGE_PRIME_BASE;
const DEFAULT_THRESHOLD = process.env.DEFAULT_THRESHOLD;
let storedMessages = [];

const client = new tmi.Client({
    options: { debug: true },
    connection: {
        reconnect: true,
        secure: true
    },
    identity: {
        username: botName,
        password: token
    },
    channels: [broadcasterName]
});

client.connect();

client.on('message', (channel, tags, message, self) => {

    if (self) {
        return;
    }

    if (tags.username == broadcasterName || tags.mod == true) {
        //Begins detection and bans of similar messages
        if (message.startsWith('!zap')) {
            let args = message.split(' ');
            let threshold = DEFAULT_THRESHOLD;
            bans = 0;
            if (args.length > 1) {
                threshold = parseInt(args[1]);
            }

            for (let i = 0; i < storedMessages.length; i++) {
                for (let j = i + 1; j < storedMessages.length; j++) {
                    if (findSimilarity(storedMessages[i].message, storedMessages[j].message) >= threshold) {
                        banSimilarUsers(channel, storedMessages[i].username, storedMessages[j].username);
                    }
                }
            }

            client.say(channel, `@${tags.username} Zap complete.`);
        }
    } else if (tags.username != broadcasterName && tags.subscriber == false && tags.mod == false) {
        //Stores latest non-mod, non-broadcaster, non-subscriber messages
        if (storedMessages.length >= maxMessages) {
            storedMessages.shift();
        }
        storedMessages.push({ message: message, username: tags.username });
    }
})

/**
 * Bans two given usernames. Checks if usernames are identical.
 * @param {string} channel 
 * @param {string} username1 
 * @param {string} username2 
 */
async function banSimilarUsers(channel, username1, username2) {
    try {
        pause();
        let result1 = await client.ban(channel, username1, "Zapped by AntiSpamBot for similar messages.");
        client.say(channel, `Banned @${username1} for similar messages.`);
        //Checks for exception where both usernames are the same
        if (username1 != username2) {
            pause();
            let result2 = await client.ban(channel, username2, "Zapped by AntiSpamBot for similar messages.");
            client.say(channel, `Banned @${username2} for similar messages.`);
        }
    } catch (error) {
        console.log(`Error when banning ${username1} & ${username2}.`)
    }
}

/**
 * Calculates similarity of two given messages.
 * @param {string} message1 
 * @param {string} message2 
 * @returns Percentage of similarity between message1 and message2, from 0 to 100.
 */
function findSimilarity(message1, message2) {
    let words1 = message1.split(' ');
    let words2 = message2.split(' ');
    let similarity = 0.0;

    //Handling messages of different word length
    if (words1.length > words2.length) {
        similarity = compareWords(words2, words1);
    } else {
        similarity = compareWords(words1, words2);
    }

    return similarity;
}

/**
 * Compares words from words1 and words2 and calculates similarity between both messages.
 * @param {string[]} words1 Array of words from 1st message
 * @param {string[]} words2 Array of words from 2nd message
 * @returns Percentage of similarity between message1 and message2, from 0 to 100.
 */
function compareWords(words1, words2) {

    let sameHash = 0;
    let totalHash1 = 0;
    let totalHash2 = 0;
    let hash1 = [];
    let hash2 = [];

    for (let i = 0; i < words1.length; i++) {
        hash1[i] = computeHash(words1[i]);
        totalHash1++;
    }

    for (let j = 0; j < words2.length; j++) {
        hash2[j] = computeHash(words2[j]);
        totalHash2++;
    }

    for (let i = 0; i < hash1.length; i++) {
        for (let j = 0; j < hash2.length; j++) {
            if (hash1[i] == hash2[j]) {
                sameHash++;
                break;
            }
        }
    }

    return ((2 * sameHash) / (totalHash1 + totalHash2)) * 100;
}

/**
 * Converts input word into a Rabin-Karp hash. 
 * @param {string} word Word to be converted into hash.
 * @returns Calculated Rabin-Karp hash value.
 */
function computeHash(word) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
        hash += word.charCodeAt(i) * (BASE ** (word.length - 1 - i));
    }
    return hash;
}

/**
 * Very wacky function that returns after default pause time.  
 * Curse you, JavaScript!
 */
function pause() {
    let now = new Date();
    let exitTime = now.getTime() + pauseTime;
    while (true) {
        now = new Date();
        if (now.getTime() > exitTime) {
            return;
        }
    }
}