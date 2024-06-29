import { SlashCommandBuilder } from '@discordjs/builders'
import { ChannelType } from "discord-api-types/v10";

export const data = new SlashCommandBuilder()
    .setName('to')
    .setDescription('Continue in another channel.')
    .addChannelOption(option =>
        option.setName('channel')
            .addChannelTypes(ChannelType.GuildText, ChannelType.PublicThread)
            .setDescription('Channel to continue in.')
            .setRequired(true)
    )
