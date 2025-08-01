import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config()
// Read and parse JSON manually
const config = process.env

const commands = [
    new SlashCommandBuilder()
        .setName('catfacts')
        .setDescription('Gives you a random fact about cats')
        // .addStringOption(option =>
        //     option.setName('message')
        //         .setDescription('prompt')
        //         .setRequired(true) // User can send /ping without this
        // )
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