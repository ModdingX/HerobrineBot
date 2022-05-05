import { SlashCommandBuilder } from '@discordjs/builders'
import { ChannelType } from "discord-api-types/v9";

export const data = new SlashCommandBuilder()
    .setName('to')
    .setDescription('Continue in another channel.')
    .addChannelOption(option =>
        option.setName('channel')
            .addChannelType(ChannelType.GuildText)
            .setDescription('Channel to continue in.')
            .setRequired(true)
    )
