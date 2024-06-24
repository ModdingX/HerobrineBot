import {Client as DiscordClient, Guild} from "discord.js";
import {textChannel} from "./discordUtil";
import {BotConfig} from "./botConfig";
import {addReactionRole} from "./discordReaction";
import {startJavadocQuery} from "../javadoc/javadocQuery";
import {startPortalHandler} from "../to/portalHandler";
import {startPasteHandler} from "../paste/pasteHandler";

export async function startDiscordBot(discord: DiscordClient, config: BotConfig): Promise<void> {
    const guild: Guild = await discord.guilds.fetch(config.guild);

    startJavadocQuery(discord, config.javadoc)
    startPortalHandler(discord)
    startPasteHandler(discord)

    const roleChannel = await textChannel(discord, config.role_channel);
    const roleMessage = await roleChannel.messages.fetch(config.role_message)
    for (const emote of Object.keys(config.roles)) {
        await addReactionRole(discord, guild, roleMessage, emote, config.roles[emote])
    }
}
