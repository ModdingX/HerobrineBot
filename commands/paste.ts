import {ContextMenuCommandBuilder} from '@discordjs/builders'
import {ApplicationCommandType} from "discord-api-types";

export const data = new ContextMenuCommandBuilder()
	.setName('Create_Paste')
	.setType(ApplicationCommandType.Message)
