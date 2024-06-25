import {
    APIEmbed,
    APIEmbedField,
    ChannelType,
    Client as DiscordClient,
    EmbedBuilder,
    Interaction,
    Snowflake,
    TextChannel,
    ThreadChannel
} from "discord.js";

export async function tryAnyTextChannel(discordClient: DiscordClient, id: Snowflake | undefined): Promise<TextChannel | ThreadChannel | null> {
    try {
        return await textChannel(discordClient, id);
    } catch (err) {
        return null;
    }
}

export async function tryTextChannel(discord: DiscordClient, id: Snowflake | undefined): Promise<TextChannel | null> {
  try {
      const channel = await textChannel(discord, id);
      return channel.isThread() ? null : channel as TextChannel;
  } catch (err) {
    return null;
  }
}

export async function tryThreadChannel(discord: DiscordClient, id: Snowflake | undefined): Promise<ThreadChannel | null> {
    try {
        const channel = await textChannel(discord, id);
        return channel.isThread() ? channel as ThreadChannel : null;
    } catch (err) {
        return null;
    }
}

export async function textChannel(discord: DiscordClient, id: Snowflake | undefined): Promise<TextChannel | ThreadChannel> {
    if (id == undefined) {
        throw new Error("No channel given")
    }
    const channel = await discord.channels.fetch(id)
    if (channel == null) {
        throw new Error("Discord channel not found: " + channel)
    }
    if (channel.type != ChannelType.GuildText && channel.type != ChannelType.PublicThread) {
        throw new Error('Discord channel is not a text/thread channel: ' + channel);
    }
    return channel as TextChannel | ThreadChannel
}

export function embed(title: string | null, description: string | null, image: string | null): APIEmbed {
    return embedList(title, description, image, [])
}

export function embedList(title: string | null, description: string | null, image: string | null, fields: Array<APIEmbedField>): APIEmbed {
        const builder = new EmbedBuilder()
        if (title != null) {
            builder.setTitle(title)
        }
        if (description != null) {
            builder.setDescription(description)
        }
        if (image != null) {
            builder.setThumbnail(image)
        }
        if (fields.length != 0) {
            builder.addFields(fields)
        }
        builder.setColor('#34C200')
        builder.setTimestamp()
        builder.setFooter({
          text: 'Herobrine',
          iconURL: 'https://cdn.discordapp.com/avatars/905189688770428959/3a69c647d31fc557281ae5a0aa2c16e1.webp'
        })
        return builder.toJSON();
}

export async function sendError(interaction: Interaction, text: string): Promise<void> {
  if (interaction.isCommand()) {
    await interaction.reply({
      content: text,
      ephemeral: true,
      fetchReply: true
    })
  }
}
