import {Client as DiscordClient, Message} from "discord.js";
import fetch from "node-fetch";

import * as dcu from '../discordbot/discordUtil'
import {createPaste} from "./pasteApi";

const ALLOWED_SUFFIXES = [ '.txt', '.log', '.cfg', '.json', '.json5', '.iml', '.xml', '.yml', '.yaml' ]

export function startPasteHandler(client: DiscordClient): void {
  client.on('interactionCreate', async interaction => {
    if (!interaction.isMessageContextMenu()) return;
    if (interaction.commandName == 'Create_Paste') {
      try {
        const channel = await dcu.tryTextChannel(client, interaction.channelId)
        const msg = await channel?.messages?.fetch(interaction.targetMessage.id)
        if (channel == null || msg == null) {
          await dcu.sendError(interaction, 'Can\'t create paste: No message selected.')
        } else {
          const paste = findTextToPaste(msg)
          if (paste == null) {
            await dcu.sendError(interaction, 'Can\'t create paste: No suitable attachment found.')
          } else {
            await interaction.deferReply({
              ephemeral: true,
              fetchReply: true
            })
            const text = await (await fetch(paste.url)).text()
            const result = await createPaste(paste.title, text)
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
              // code block needed so discord won't try to create an embed which would cause the
              // link to be called and delete the paste
              content: '**Delete paste:** `' + result.delete + '`'
            })
          }
        }
      } catch (err) {
        console.log(err)
      }
    }
  })
}

function findTextToPaste(msg: Message): PasteText | null {
  for (const attachment of msg.attachments.values()) {
    const name = attachment.name
    if (attachment.size <= 1024000 && name != null && ALLOWED_SUFFIXES.some(suffix => name.endsWith(suffix))) {
      return {
        title: name,
        url: attachment.url
      }
    }
  }
  return null;
}

interface PasteText {
  title: string,
  url: string
}
