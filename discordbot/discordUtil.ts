import {Client as DiscordClient, EmbedFieldData, MessageEmbed, Snowflake, TextChannel} from "discord.js";

export async function textChannel(discord: DiscordClient, id: Snowflake | undefined): Promise<TextChannel> {
    if (id == undefined) {
        throw new Error("No channel given")
    }
    const channel = await discord.channels.fetch(id)
    if (channel == null) {
        throw new Error("Discord channel not found: " + channel)
    }
    if (channel.type != "GUILD_TEXT") {
        throw new Error("Discord channel is not a text channel: " + channel)
    }
    return channel as TextChannel
}

export function embed(title: string, description: string | null, image: string | null): MessageEmbed {
    return embedList(title, description, image, [])
}

export function embedList(title: string, description: string | null, image: string | null, fields: Array<EmbedFieldData>): MessageEmbed {
        const embed = new MessageEmbed()
        embed.setTitle(title)
        if (description != null) {
            embed.setDescription(description)
        }
        if (image != null) {
            embed.setThumbnail(image)
        }
        if (fields.length != 0) {
            embed.addFields(fields)
        }
        embed.setColor('#FFFF00')
        embed.setTimestamp()
        embed.setFooter('Bot by noeppi_noeppi', 'https://avatars.githubusercontent.com/u/63002502?s=400&u=b78c86cb9c60a2aba648bd01b4be77469c04913e&v=4');
        return embed;
}