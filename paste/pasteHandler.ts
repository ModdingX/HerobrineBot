import {ChannelType, Client as DiscordClient, Message, Snowflake, TextChannel, ThreadChannel} from "discord.js";
import fetch from "node-fetch";

import * as dcu from '../discordbot/discordUtil'
import {formatFile} from "./pasteFormatter";
import {createPaste} from "./pasteApi";

const ALLOWED_SUFFIXES = [
  '.txt', '.log', '.csv', '.md', '.cfg', '.json', '.json5', '.toml', '.yml', '.yaml', '.ini', '.conf', '.html', '.htm',
  '.iml', '.xml', '.sh', '.bat', '.cmd', '.ps1'
]

export function startPasteHandler(client: DiscordClient): void {
  client.on('interactionCreate', async interaction => {
    if (!interaction.isMessageContextMenuCommand()) return;
    if (interaction.commandName == 'Create_Paste') {
      try {
        const channel = await dcu.channel(client, interaction.channelId as Snowflake | null, [ChannelType.GuildText, ChannelType.PublicThread])
        if (channel instanceof dcu.ChannelError) {
          await dcu.sendError(interaction, 'Can\'t create paste: No message selected: ' + channel)
          return
        }
        const msg = await channel.messages.fetch(interaction.targetMessage.id)
        if (msg == null) {
          await dcu.sendError(interaction, 'Can\'t create paste: No message selected.')
        } else {
          const paste = findTextToPaste(msg)
          if (paste == null) {
            await dcu.sendError(interaction, 'Can\'t create paste: No suitable attachment found.')
          } else if (paste == 'too_large') {
            await dcu.sendError(interaction, 'Can\'t paste file: Too large')
          } else if (!dcu.join(channel)) {
            await dcu.sendError(interaction, 'I can\'t join here.')
          } else {
            await interaction.deferReply({
              ephemeral: true,
              fetchReply: true
            })
            const text = await (await fetch(paste.url)).text()
            const formatted = formatFile(paste.fileName, text)
            const result = await createPaste(paste.fileName, formatted)

            await channel.send({
              content: `:page_facing_up: <${result.url}>`,
              reply: {
                messageReference: msg,
                failIfNotExists: false
              },
              allowedMentions: {
                repliedUser: false
              }
            })
            await interaction.editReply({
              // angle brackets needed so discord won't try to create an embed which would cause the
              // link to be called and delete the paste
              content: '**Delete paste:** <' + result.delete + '>'
            })
          }
        }
      } catch (err) {
        console.log(err)
      }
    }
  })
}

function findTextToPaste(msg: Message): PasteText | 'too_large' | null {
  let defaultReturn: 'too_large' | null = null
  for (const attachment of msg.attachments.values()) {
    const name = attachment.name
    if (name != null && ALLOWED_SUFFIXES.some(suffix => name.toLowerCase().endsWith(suffix))) {
      if (attachment.size > (100 * 1024)) {
        defaultReturn = 'too_large'
      } else {
        return {
          fileName: name,
          url: attachment.url
        }
      }
    }
  }
  return defaultReturn;
}

interface PasteText {
  fileName: string,
  url: string
}
