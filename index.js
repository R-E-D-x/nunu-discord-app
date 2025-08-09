import { Client, GatewayIntentBits } from "discord.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";

import dotenv from 'dotenv';
dotenv.config();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // Required to read messages
        GatewayIntentBits.DirectMessages // for direct messages
    ],
    partials: ['CHANNEL']
});

const coolDown = new Map([
    ['id', 'timer'],
]);
const me = 'rrredx'

async function coolDownUser(user, duration, channel) {
    const date = Date.now();
    duration = Number(duration)
    if (isNaN(duration))
        return `please provide a number`;
    let durationMs = duration * 60 * 1000
    if (!coolDown.has(user)) {
        coolDown.set(user, date + durationMs);

        setTimeout(async () => {
            if (!coolDown.has(user))
                return 'user was forgiven'
            coolDown.delete(user);
            await sendToChannel(channel, `${user}, your suspension is over`)
        }, durationMs);
        return `won't reply to this mf for ${duration} minutes`;
    }
    return `${user} is suspended for a ${Math.abs(date - coolDown.get(user)) / 1000} sec`

}
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

setInterval(async () => {
    await sendToChannel(process.env.MAIN, getQuote());
}, 1000 * 60 * 60 * 10);



async function sendToChannel(id, message) {
    const channel = await client.channels.fetch(id);
    if (channel) channel.send(message);
}
async function catFetch() {
    return await fetch("https://catfact.ninja/fact").then(res => res.json()).then(json => json.fact).catch(err => 'err: ' + err);
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'ping') {
        interaction.reply('pong!');
    }
    const whoPropmted = interaction.member.user.username;

    if (interaction.commandName === 'ai') {
        interaction.reply('not available rn. sry!')
    }

    if (interaction.commandName === 'catfacts') {
        interaction.reply(await catFetch())
    }
    console.log('command used: ' + interaction.commandName);
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    await sendToChannel('1400773015796584508', '--------Online--------');
});

async function getQuote() {
    try {
        const response = await fetch("https://api.api-ninjas.com/v1/quotes", {
            method: "GET",
            headers: { "X-Api-Key": "iU68FBNPrc6zv0IWZ7ZJIxhVphpGILE1qxLT1Hn4" }
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const data = await response.json();
        return `${data[0].quote}\n-${data[0].author}`

    } catch (error) {
        console.log(error)
        return "Error: could'nt fetch data";
    }
}

client.on('messageCreate', async (message) => {
    const msgAuthor = message.author.username
    const msg = message.content
    const usernameMention = message.mentions.users.first() || { username: undefined }
    if (msgAuthor === 'rrredx')
        message.react('😎');


    if (msg.toLocaleLowerCase() === '!catfacts') {
        message.react('😺')
        message.reply(await catFetch())
    }
    if (msgAuthor !== 'nunu' && msgAuthor !== me)
        sendToChannel('1400773015796584508', `${msgAuthor}: ${msg}\n ${message.channelId}`);
});
// ------------------Bot DMs

let targetedPerson;
client.on('messageCreate', async message => {
    const author = message.author.username;
    const msg = message.content;
    if (msg.startsWith('!target')) {

        const id = msg.split(' ')[1];
        targetedPerson = id
        message.reply('targeting:' + ids.get(id));
        return;
    }
    // console.log(message.channel.type);
    if (message.channel.type === 1 && author !== 'nunu') {
        sendToChannel(process.env.DMS, `${author}: ${msg}`);
        return
    }
    if (message.channel.id === '1340747944692809749' && author !== 'nunu') {
        sendToUser(targetedPerson, message.content);
        message.react('👍')
    }
});




function randPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}

async function sendToUser(id, message) {
    const user = await client.users.fetch(id); // Replace with actual user ID
    if (user) await user.send(message);
}


client.login(process.env.TOKEN);