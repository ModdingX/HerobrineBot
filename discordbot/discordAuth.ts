import {Client as DiscordClient, Intents} from "discord.js";

export interface DiscordAuth {
    client: DiscordClient
    clientId: string
}

export async function registerDiscord(): Promise<DiscordAuth> {
    if (process.env.DISCORD_CLIENT_ID === undefined) {
        throw new Error("No discord client id provided");
    }
    if (process.env.DISCORD_TOKEN === undefined) {
        throw new Error("No discord bot token provided");
    }
    const client = new DiscordClient({
        partials: ["CHANNEL", "MESSAGE", "REACTION", "GUILD_MEMBER", "USER"],
        intents: [
            Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
            Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
        ]
    });
    await client.login(process.env.DISCORD_TOKEN);
    await client.user?.setStatus('online')
    console.log("Connected to discord")
    
    return {
        client: client,
        clientId: process.env.DISCORD_CLIENT_ID
    }
}
