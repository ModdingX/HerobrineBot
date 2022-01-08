import {
    Client as DiscordClient, CommandInteraction, TextChannel, Message
} from "discord.js";

import * as dcu from '../discordbot/discordUtil'

export function startPortalHandler(client: DiscordClient): void {
    client.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) return;
        if (interaction.commandName == 'to') {
            try {
                const channelId = interaction.options.getChannel('channel')
                if (channelId != null) {
                    const fromChannel = interaction.channel
                    if (fromChannel != null && fromChannel.type == 'GUILD_TEXT') {
                        const toChannel = await dcu.textChannel(client, channelId.id);
                        await handleToCommand(client, interaction, fromChannel, toChannel)
                    }
                }
            } catch (err) {
                console.log(err)
            }
        }
    })
}

async function handleToCommand(client: DiscordClient, interaction: CommandInteraction, from: TextChannel, to: TextChannel) {
    const messageId = await interaction.deferReply({
        ephemeral: false,
        fetchReply: true
    })
    const message = from.messages.resolve(messageId.id)
    if (message == null) {
        await interaction.deleteReply();
        throw new Error('Reply message not found.')
    } else {
        const otherMessage = await to.send({
            embeds: [dcu.embed(null, `**From [#${from.name}](${messageLink(message)})**`, null)]
        })
        await interaction.editReply({
            embeds: [dcu.embed(null, `**To [#${to.name}](${messageLink(otherMessage)})**`, null)]
        })
    }
}

function messageLink(message: Message) {
    return `https://discord.com/channels/${message.guild?.id}/${message.channel.id}/${message.id}`
}
