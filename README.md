# Twitch Hate Raid Anti-Spam Bot

This bot stores the most recent messages from a Twitch chat. When prompted by a chat mod, it uses message similarity detection to determine if two messages are similar and, if detected, bans the users who sent those messages.

Contributions are more than welcome!

```bash
$ npm install tmi.js
$ npm install dotenv
```

I recommend using this site (unaffiliated) to get your oauth token after registering on Twitch's dev portal: https://twitchapps.com/tmi/