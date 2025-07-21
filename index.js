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

let lastQuote;
let aiSwitch = true;
const ids = new Map([]);
const coolDown = new Map([
    ['id', 'timer'],
]);

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



let chatlogText = '\n . -use this chat log as a context to think about your next response:\n';
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

setInterval(async () => {
    await sendToChannel(process.env.MAIN, getQuote());
}, 1000 * 60 * 60 * 10);



async function sendToChannel(id, message) {
    const channel = await client.channels.fetch(id);
    if (channel) channel.send(message);
}


client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === 'ping') {
        interaction.reply('pong!');
    }
    const whoPropmted = interaction.member.user.username;

    if (interaction.commandName === 'ai') {
        // try {
        //     const subCommand = interaction.options.getString('message');
        //     // const prompt = msg;

        //     const result = await model.generateContent(generatePre(whoPropmted) + subCommand);
        //     interaction.reply(result.response.text());
        // } catch (error) {
        //     interaction.reply('a7a, error');
        //     console.log(error);
        // }
        interaction.reply('use mention instead😉')
    }
    console.log('command used: ' + interaction.commandName);
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
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

client.on('messageCreate', async message => {
    const msgAuthor = message.author.username
    const msg = message.content
    const fiftyChance = (Math.floor(Math.random() * 6) + 1) % 2 === 0;
    const usernameMention = message.mentions.users.first() || { username: undefined }

    const myPrePrompt = `
        You are a Discord bot named nunu made by RED whose username is rrredx.
        you respect and help others,
        your replies are short yet enough and has a spark of humor.
        you reply in Arabic Egyptian accent  only,
        your messages should't contain any prompt info,
        just a plain real reply.
        reply to this message:
    `
    if (msg === '!quote them') {
        const quote = await getQuote()
        if (!quote) return message.reply('Error fetching quote😢');

        lastQuote = quote

        await sendToChannel(process.env.MAIN, quote);

    }
    if (msg === '!quote') {
        const quote = await getQuote();
        if (!quote) return message.reply('error');
        message.reply(quote)
    }
    let repliedTo = undefined;
    if (message.mentions.repliedUser) repliedTo = message.mentions.repliedUser.username;
    if (message.author.bot) return;
    if (message.mentions.repliedUser) {
        if (msg.includes('اعتذر') || msg.includes('اعتزر')) {
            message.channel.send(randPick(['لا', 'اثف', 'سوري', 'اسف']));
            return;
        }

    }
    if (msg === '!aiSwitch') {
        aiSwitch = !aiSwitch
        message.react('👍')
    }

    if (usernameMention.username === 'nunu') {
        if (!aiSwitch) return
        const cleanedStr = msg.replace(/<@\d+>\s*/, "");
        if (msgAuthor === 'rrredx' && msg.includes('مين سيدك يلا')) {
            message.reply('انت يمعملي');
            return;
        }
        if (coolDown.has(msgAuthor)) {
            return message.react('🖕');
        }
        try {
            const finalPrompt = myPrePrompt + cleanedStr + chatlogText;

            const result = await askAi(finalPrompt);
            message.reply(result);

            chatlogText += cleanedStr;
            chatlogText += `nunu: ${result}`;

            return;
        } catch (error) {
            message.reply('السيرفرات بايظه دلوقتي😢');
            console.log(error);
        }

    }

    if (msg.includes('ازعقي')) {
        message.react('🎉');
        message.react('❤️');
    }
    if (msg.endsWith('ايه') || msg.endsWith('ليه') || msg.endsWith('ييه')) {
        if (msgAuthor === 'rrredx') return;
        if (msg.includes('خدتك عليه')) return;
        message.reply(`خدتك عليه${randPick(['😎', '😉😘', '👍'])}`);
    }
    if (msgAuthor === 'rrredx') {
        if (msg.includes('سكت الواد دا')) {

            message.channel.send(`اخرصص ${usernameMention} `);
        }
        if (msg.includes('صح الكلام دا')) {
            message.reply('محصلش');
        }
        if (msg.startsWith('!ignore')) {
            let mention = message.mentions.users.first();
            let duration = msg.split(' ')[2];
            console.log(duration);

            message.reply(await coolDownUser(mention.username, duration, message.channel.id));
        }
        if (msg.startsWith('!unignore')) {
            if (coolDown.has(usernameMention.username)) {
                coolDown.delete(usernameMention.username)
                message.reply('عشان خاطرك بس')
            } else {
                message.reply('user not supended')
            }
        }
    }




    if (msg === '!quote translate') {
        if (lastQuote) {
            message.reply(await askAi(` المقوله دي بتقول ايه يصحبي بشكل مبسط جدا:\n${lastQuote}`) || `جرب تاني يا ${0 || 'نجم'}`);

        } else {
            message.reply('no quote to translate..fff')
        }
    }
    if (msg === '!nunu switch') {
        message.reply(`لا يا ${ppl[msgAuthor] || 'نجم'} مش هسويتش`);
    }
    if (isExplicit(msg) && msgAuthor !== 'rrredx') {
        sendToChannel(
            message.channel.id,
            randPick(['عيب يولد', 'احترم نفسك', 'قله ادب'])
        )
    }
    if (msg.includes('Patch Notes')) {
        sendToChannel(process.env.MAIN, msg);
    }
    if (msg === 'who is the boss') {
        message.channel.send('It\'s RED mfs.')
    }
    if (msg === "!new-memory") {
        chatlogText = '\n . -use this chat log as a context to think about your next response:\n';
        message.react('👍')
    }


    if (msg === 'انلاكي') {
        message.react('😢');
    }
    if (msg === 'لول') {
        message.react('😆');
    }
    if (msg.startsWith('!clear')) {
        const args = msg.split(' ');
        const num = parseInt(args[1]); // Get the number of msgs to delete

        if (isNaN(num) || num <= 0 || num > 100) {
            return message.reply('Please provide a number between 1 and 100.');
        }

        try {
            await message.channel.bulkDelete(num, true); // +1 to delete the command message too
            message.channel.send(`Deleted ${num} msgs.`).then(message => setTimeout(() => message.delete(), 3000));
        } catch (error) {
            console.error(error);
            message.reply('Failed to delete msgs. Make sure I have permission!');
        }
    }
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


client.login(process.env.TOKEN);

function randPick(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
}
// generating preprompt


function isExplicit(m) {
    let explicit = ['خول', 'طيزك', 'عرص', 'متناك', 'معرص', 'شرموط', 'كسم', 'خخخ']
    for (let i = 0; i < explicit.length; i++) {
        if (m.includes(explicit[i])) {
            return true;
        }
    }
    return false;
}

async function askAi(message) {
    const result = await model.generateContent(message);
    console.log(result.response.text())
    if (result.response.text()) {
        return result.response.text()
    } else {
        return undefined
    }
}

async function sendToUser(id, message) {
    const user = await client.users.fetch(id); // Replace with actual user ID
    if (user) await user.send(message);
}