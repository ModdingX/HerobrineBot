import {
    Client as DiscordClient, CommandInteraction, TextChannel, Message,
    AnyThreadChannel,
    ChannelType,
    Snowflake,
    Interaction
} from "discord.js";

import * as dcu from '../discordbot/discordUtil'

export function startPortalHandler(client: DiscordClient): void {
    client.on('interactionCreate', async interaction => {
        if (!interaction.isChatInputCommand()) return;
        if (interaction.commandName == 'to') {
            try {
                const channelId = interaction.options.getChannel('channel')
                if (channelId != null) {
                    if (channelId.id == interaction.channelId) {
                        await dcu.sendError(interaction, 'You\'re already in that channel.')
                    } else {
                        const fromChannel = await dcu.channel(client, interaction.channelId as Snowflake | null, [ChannelType.GuildText, ChannelType.PublicThread]);
                        if (fromChannel instanceof dcu.ChannelError) {
                            if (fromChannel.type == dcu.ChannelErrorType.WrongType) {
                                await dcu.sendError(interaction, 'You can\'t use this here.')
                            } else {
                                await dcu.sendError(interaction, 'Internal error.')
                            }
                        } else {
                            const toChannel = await dcu.channel(client, channelId.id, [ChannelType.GuildText, ChannelType.PublicThread]);
                            if (toChannel instanceof dcu.ChannelError) {
                                if (toChannel.type == dcu.ChannelErrorType.WrongType) {
                                    await dcu.sendError(interaction, 'I can\'t redirect into that channel')
                                } else {
                                    await dcu.sendError(interaction, 'I do not know this channel.')
                                }
                            } else if (!dcu.join(toChannel)) {
                                await dcu.sendError(interaction, 'I can\'t join the target channel.')
                                return
                            } else {
                                await handleToCommand(client, interaction, fromChannel, toChannel)
                            }
                        }
                    }
                } else {
                    await dcu.sendError(interaction, 'Please supply a channel.')
                }
            } catch (err) {
                console.log(err)
            }
        }
    })
}

async function handleToCommand(client: DiscordClient, interaction: CommandInteraction, from: TextChannel | AnyThreadChannel, to: TextChannel | AnyThreadChannel) {
    const message = await interaction.deferReply({
        ephemeral: false,
        fetchReply: true
    })
    if (message.inGuild()) {
        const otherMessage = await to.send({
            embeds: [dcu.embed(null, `**From ${messageLink(message)}**`, null)]
        })
        await interaction.editReply({
            embeds: [dcu.embed(null, `**To ${messageLink(otherMessage)}**`, null)]
        })
    } else {
        await interaction.deleteReply();
        throw new Error('Reply message not found.')
    }
}

function messageLink(message: Message<true>) {
    return `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`
}
