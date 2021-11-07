import {
    Client as DiscordClient, EmbedFieldData,
    MessageActionRow, MessageButton, MessageEmbed, MessageOptions
} from "discord.js";

import {JavadocAccess, SearchResultEntry} from "./javadocAccess";
import * as dcu from '../discordbot/discordUtil'
import {JavaClass, JavaConstructor, Javadoc, JavaExecutable, JavaField, JavaMethod} from "./meta";
const turndown: { turndown(html: string): string } = new (require('turndown'))()

const IMAGE_URL = 'https://media.forgecdn.net/avatars/307/587/637388930682019683.png'

export function startJavadocQuery(client: DiscordClient, baseURL: string): void {
    const access = new JavadocAccess(baseURL)
    let nextId = 0
    const resultCache: Record<number, SearchResultEntry> = {}
    
    
    client.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) return;
        if (interaction.commandName == 'jd') {
            await interaction.deferReply({
                ephemeral: false
            })
            try {
                const term = interaction.options.getString('search', true)
                const result = await access.search(term)
                if (!result.success) {
                    if (result.failure == 'no_results') {
                        await interaction.editReply({
                            embeds: [dcu.embed('No Results', `No results for search query: ${term}`, IMAGE_URL)]
                        })
                    } else {
                        await interaction.editReply({
                            embeds: [dcu.embed('Too Many Results', `Your search produced too many results. Make it more specific.`, IMAGE_URL)]
                        })
                    }
                    return
                }
                if (result.results.length == 1) {
                    await sendFinalResult(result.results[0], msg => interaction.editReply(msg))
                } else {
                    const buttonRows: MessageActionRow[] = []
                    for (const entry of result.results) {
                        const n = nextId++
                        resultCache[n] = entry
                        setTimeout(() => delete resultCache[n], 1000 * 60 * 5)
                        buttonRows.push(new MessageActionRow().addComponents(
                            new MessageButton()
                                .setCustomId(`javadoc_select_${n}`)
                                .setLabel(labelText(entry))
                                .setStyle('PRIMARY')
                        ))
                    }
                    await interaction.editReply({
                        embeds: [dcu.embed('Select target', 'Your search term matched multiple targets. Select one.', IMAGE_URL)],
                        components: buttonRows
                    })
                }
            } catch (err) {
                console.error(err)
                try {
                    await interaction.deleteReply()
                } catch (err) {
                    //
                }
                await interaction.followUp({
                    embeds: [dcu.embed('Failure', 'Unknown error', null)]
                })
            }
        }
    });

    
    client.on('interactionCreate', async interaction => {
        if (!interaction.isButton()) return
        if (!interaction.customId.startsWith('javadoc_select_')) return
        try {
            const id = parseInt(interaction.customId.substring(15))
            const result = resultCache[id]
            if (result == undefined) return
            await sendFinalResult(result, msg => interaction.update(msg))
        } catch (err) {
            console.error(err)
        }
    })
}

async function sendFinalResult(result: SearchResultEntry, send: (msg: MessageOptions) => Promise<unknown>): Promise<void> {
    switch (result.type) {
        case "class":
            await send({
                embeds: [ createClassEmbed(result.data) ],
                components: []
            })
            break;
        case "constructor":
            await send({
                embeds: [ createConstructorEmbed(result.data, result.cls) ],
                components: []
            })
            break;
        case "field":
            await send({
                embeds: [ createFieldEmbed(result.data, result.cls) ],
                components: []
            })
            break;
        case "method":
            await send({
                embeds: [ createMethodEmbed(result.data, result.cls) ],
                components: []
            })
            break;
    }
}

function labelText(result: SearchResultEntry): string {
    const str = shortText(result)
    if (str.length <= 80) {
        return str
    } else if (result.type == 'class') {
        return '... ' + str.substring(str.length - 76, str.length)
    } else {
        return str.substring(0, 76) + ' ...'
    }
}

function shortText(result: SearchResultEntry): string {
    switch (result.type) {
        case "class": return result.data.sourceName
        case "constructor": return result.cls.simpleName + '#new' + result.data.typeId
        case "field": return result.cls.simpleName + '#' + result.data.name
        case "method": return result.cls.simpleName + '#' + result.data.name + result.data.typeId
    }
}

function createDocText(doc: Javadoc | undefined): [string, EmbedFieldData[]] {
    if (doc != undefined) {
        const description = `\n${turndown.turndown(doc.text)}`
        const fields: EmbedFieldData[] = []
        if (doc.properties != undefined) {
            for (const block of doc.properties) {
                if ('cls' in block) {
                    fields.push({
                        name: `${block.type}: ${block.cls}`,
                        value: block.text
                    })
                } else {
                    fields.push({
                        name: block.type,
                        value: block.text
                    })
                }
            }
        }
        return [description, fields]
    } else {
        return ['', []]
    }
}

function createMethodDocText(method: JavaExecutable): [string, EmbedFieldData[]] {
    const [ docText, fields ] = createDocText(method.doc)
    if (method.doc != undefined) {
        const paramFields: EmbedFieldData[] = []
        for (const param of method.parameters) {
            if (param.doc == undefined) {
                paramFields.push({
                    name: `Parameter: ${param.name}`,
                    value: `\`${param.type.name}\``
                })
            } else {
                paramFields.push({
                    name: `Parameter: ${param.name}`,
                    value: `\`${param.type.name}\`\n${turndown.turndown(param.doc)}`
                })
            }
        }
        fields.unshift(...paramFields)
    }
    return [ docText, fields ]
}

function createClassEmbed(data: JavaClass): MessageEmbed {
    let description = `Name: \`${data.sourceName}\`\n`
    description += `Modifiers: ${data.modifiers.map(m => `\`${m}\``).join(' ')}\n`
    if (data.superClass != undefined) description += `Extends: \`${data.superClass.signature}\`\n`
    if (data.interfaces != undefined && data.interfaces.length > 0) description += `Implements: ${data.interfaces.map(itf => `\`${itf.signature}\``).join(", ")}\n`
    if (data.enumValues != undefined && data.enumValues.length > 0) description += `Enum Values: ${data.enumValues.map(v => `\`${v}\``).join(", ")}\n`
    const [docText, fields] = createDocText(data.doc)
    description += docText
    return dcu.embedList("Class " + data.simpleName, description, IMAGE_URL, fields)
}

function createFieldEmbed(data: JavaField, cls: JavaClass): MessageEmbed {
    let description = `Name: \`${data.name}\`\n`
    description += `Modifiers: ${data.modifiers.map(m => `\`${m}\``).join(' ')}\n`
    description += `Type: \`${data.type.name}\`\n`
    if (data.constant != undefined) description += `Value: \`${data.constant}\`\n`
    const [docText, fields] = createDocText(data.doc)
    description += docText
    return dcu.embedList("Field " + cls.simpleName + "#" + data.name, description, IMAGE_URL, fields)
}

function createConstructorEmbed(data: JavaConstructor, cls: JavaClass): MessageEmbed {
    let description = `Modifiers: ${data.modifiers.map(m => `\`${m}\``).join(' ')}\n`
    description += `Type: \`${data.typeId}\`\n`
    if (data.throws != undefined && data.throws.length > 0) description += `Throws: ${data.throws.map(v => `\`${v.name}\``).join(', ')}\n`
    const [docText, fields] = createMethodDocText(data)
    description += docText
    return dcu.embedList("Constructor " + cls.simpleName, description, IMAGE_URL, fields)

}

function createMethodEmbed(data: JavaMethod, cls: JavaClass): MessageEmbed {
    let description = `Name: \`${data.name}\`\n`
    description += `Modifiers: ${data.modifiers.map(m => `\`${m}\``).join(' ')}\n`
    description += `Type: \`${data.typeId}\`\n`
    if (data.throws != undefined && data.throws.length > 0) description += `Throws: ${data.throws.map(v => `\`${v.name}\``).join(', ')}\n`
    const [docText, fields] = createMethodDocText(data)
    description += docText
    return dcu.embedList("Method " + cls.simpleName + "#" + data.name, description, IMAGE_URL, fields)
}