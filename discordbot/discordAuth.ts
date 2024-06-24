import {Client as DiscordClient, Partials} from "discord.js";

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
        partials: [Partials.Channel, Partials.Message, Partials.Reaction, Partials.GuildMember, Partials.User],
        intents: ["GuildMessageReactions", "DirectMessageReactions"]
    });
    await client.login(process.env.DISCORD_TOKEN);
    client.user?.setStatus('online')
    console.log("Connected to discord")
    
    return {
        client: client,
        clientId: process.env.DISCORD_CLIENT_ID
    }
}
