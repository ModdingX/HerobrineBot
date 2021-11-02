import {Client as DiscordClient, Intents} from "discord.js";

export async function registerDiscord(): Promise<DiscordClient> {
    if (process.env.DISCORD_TOKEN === undefined) {
        throw new Error("No discord token provided");
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
    return client
}