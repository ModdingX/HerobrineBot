import { SlashCommandBuilder } from '@discordjs/builders'

export const data = new SlashCommandBuilder()
	.setName('jd')
	.setDescription('Look up LibX javadoc.')
	.addStringOption(option =>
		option.setName('search')
			.setDescription('Javadoc search term.')
			.setRequired(true)
    );
