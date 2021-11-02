import {Client as DiscordClient, Guild} from "discord.js";
import {textChannel} from "./discordUtil";
import {BotConfig} from "./botConfig";
import {addReactionRole} from "./discordReaction";


export async function startDiscordBot(discord: DiscordClient, config: BotConfig): Promise<void> {
    if (process.env.DISCORD_GUILD == null) {
        throw new Error("No guild given")
    }
    const guild: Guild = await discord.guilds.fetch(config.guild);
    const roleChannel = await textChannel(discord, config.role_channel);
    const roleMessage = await roleChannel.messages.fetch(config.role_message)
    
    for (const emote of Object.keys(config.roles)) {
        await addReactionRole(discord, guild, roleMessage, emote, config.roles[emote])
    }
}