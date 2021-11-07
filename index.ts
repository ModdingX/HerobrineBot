import * as fs from "fs";

require('dotenv').config({ path: 'tokens.env' });

import * as discordAuth from "./discordbot/discordAuth"
import * as discordBot from "./discordbot/discordBot"
import * as slashCommands from "./slashCommands"
import {BotConfig} from "./discordbot/botConfig";

(async () => {
    const config: BotConfig = JSON.parse(fs.readFileSync('botconfig.json', { encoding: 'utf-8' }))
    const discord = await discordAuth.registerDiscord();
    await slashCommands.reloadSlashCommands(discord, config.guild)
    await discordBot.startDiscordBot(discord.client, config)
    console.log("Discord bot started.")
})()