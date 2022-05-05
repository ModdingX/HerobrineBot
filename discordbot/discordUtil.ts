import {Client as DiscordClient, EmbedFieldData, Interaction, MessageEmbed, Snowflake, TextChannel} from "discord.js";

export async function tryTextChannel(discord: DiscordClient, id: Snowflake | undefined): Promise<TextChannel | null> {
  try {
    return await textChannel(discord, id)
  } catch (err) {
    return null;
  }
}

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

export function embed(title: string | null, description: string | null, image: string | null): MessageEmbed {
    return embedList(title, description, image, [])
}

export function embedList(title: string | null, description: string | null, image: string | null, fields: Array<EmbedFieldData>): MessageEmbed {
        const embed = new MessageEmbed()
        if (title != null) {
            embed.setTitle(title)
        }
        if (description != null) {
            embed.setDescription(description)
        }
        if (image != null) {
            embed.setThumbnail(image)
        }
        if (fields.length != 0) {
            embed.addFields(fields)
        }
        embed.setColor('#34C200')
        embed.setTimestamp()
        embed.setFooter({
          text: 'Herobrine',
          iconURL: 'https://cdn.discordapp.com/avatars/905189688770428959/3a69c647d31fc557281ae5a0aa2c16e1.webp'
        })
        return embed;
}

export async function sendError(interaction: Interaction, text: string): Promise<void> {
  if (interaction.isApplicationCommand()) {
    await interaction.reply({
      content: text,
      ephemeral: true,
      fetchReply: true
    })
  }
}
