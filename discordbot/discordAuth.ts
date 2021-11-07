import {Client as DiscordClient, Intents} from "discord.js";
import {REST} from '@discordjs/rest'

export interface DiscordAuth {
    client: DiscordClient
    rest: REST
    clientId: string
}

export async function registerDiscord(): Promise<DiscordAuth> {
    if (process.env.DISCORD_CLIENT_ID === undefined) {
        throw new Error("No discord client id provided");
    }
    if (process.env.DISCORD_TOKEN === undefined) {
        throw new Error("No discord application token provided");
    }
    if (process.env.DISCORD_BOT_TOKEN === undefined) {
        throw new Error("No discord bot token provided");
    }
    const client = new DiscordClient({
        partials: ["CHANNEL", "MESSAGE", "REACTION", "GUILD_MEMBER", "USER"],
        intents: [
            Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
            Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
        ]
    });
    await client.login(process.env.DISCORD_BOT_TOKEN);
    await client.user?.setStatus('online')
    console.log("Connected to discord")
    
    const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN);
    
    return {
        client: client,
        rest: rest,
        clientId: process.env.DISCORD_CLIENT_ID
    }
}