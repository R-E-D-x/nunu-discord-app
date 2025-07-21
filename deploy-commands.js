import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { readFileSync } from "fs";

// Read and parse JSON manually
const config = JSON.parse(readFileSync("./config.json", "utf8"));
console.log(config)

const commands = [
    new SlashCommandBuilder()
        .setName('ai')
        .setDescription('lets chat')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('prompt')
                .setRequired(true) // User can send /ping without this
        )
        .toJSON()
];

const rest = new REST({ version: '10' }).setToken(config.TOKEN);

(async () => {
    try {
        console.log('Refreshing application (/) commands...');
        await rest.put(
            Routes.applicationCommands(config.CLIENT_ID),
            { body: commands }
        );
        console.log('Successfully registered application commands.');
    } catch (error) {
        console.error(error);
    }
})();