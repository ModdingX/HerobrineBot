import {
    APIActionRowComponent,
    APIComponentInMessageActionRow,
    APIEmbed,
    APIEmbedField,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    Client as DiscordClient,
    InteractionUpdateOptions,
    MessageActionRowComponentBuilder
} from "discord.js";

import {JavadocAccess, SearchResultEntry} from "./javadocAccess";
import * as dcu from '../discordbot/discordUtil'
import {JavaClass, JavaConstructor, Javadoc, JavaExecutable, JavaField, JavaMethod} from "./meta";
import { JavadocConfig } from "../discordbot/botConfig";
const turndown: { turndown(html: string): string } = new (require('turndown'))()

export function startJavadocQuery(client: DiscordClient, config: JavadocConfig): void {
    const access = new JavadocAccess(config.url)
    let nextId = 0
    const resultCache: Record<number, SearchResultEntry> = {}

    client.on('interactionCreate', async interaction => {
        if (!interaction.isChatInputCommand()) return;
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
                            embeds: [dcu.embed('No Results', `No results for search query: ${term}`, config.icon)]
                        })
                    } else {
                        await interaction.editReply({
                            embeds: [dcu.embed('Too Many Results', `Your search produced too many results. Make it more specific.`, config.icon)]
                        })
                    }
                    return
                }
                if (result.results.length == 1) {
                    await sendFinalResult(result.results[0], config, msg => interaction.editReply(msg))
                } else {
                    const buttonRows: APIActionRowComponent<APIComponentInMessageActionRow>[] = []
                    for (const entry of result.results) {
                        const n = nextId++
                        resultCache[n] = entry
                        setTimeout(() => delete resultCache[n], 1000 * 60 * 5)
                        buttonRows.push(new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`javadoc_select_${n}`)
                                .setLabel(labelText(entry))
                                .setStyle(ButtonStyle.Primary)
                        ).toJSON())
                    }
                    await interaction.editReply({
                        embeds: [dcu.embed('Select target', 'Your search term matched multiple targets. Select one.', config.icon)],
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
            await sendFinalResult(result, config, msg => interaction.update(msg))
        } catch (err) {
            console.error(err)
        }
    })
}

async function sendFinalResult(result: SearchResultEntry, config: JavadocConfig, send: (msg: InteractionUpdateOptions) => Promise<unknown>): Promise<void> {
    switch (result.type) {
        case "class":
            await send({
                embeds: [ createClassEmbed(result.data, config) ],
                components: []
            })
            break;
        case "constructor":
            await send({
                embeds: [ createConstructorEmbed(result.data, result.cls, config) ],
                components: []
            })
            break;
        case "field":
            await send({
                embeds: [ createFieldEmbed(result.data, result.cls, config) ],
                components: []
            })
            break;
        case "method":
            await send({
                embeds: [ createMethodEmbed(result.data, result.cls, config) ],
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

function createDocText(cls: JavaClass, config: JavadocConfig, doc: Javadoc | undefined): [string, APIEmbedField[]] {
    if (doc != undefined) {
        const description = `\n${turndown.turndown(doc.text)}`
        const fields: APIEmbedField[] = []
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
        return [description + '\n' + javadocLink(cls, config), fields]
    } else {
        return [javadocLink(cls, config), []]
    }
}

function createMethodDocText(cls: JavaClass, config: JavadocConfig, method: JavaExecutable): [string, APIEmbedField[]] {
    const [ docText, fields ] = createDocText(cls, config, method.doc)
    if (method.doc != undefined) {
        const paramFields: APIEmbedField[] = []
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

function javadocLink(cls: JavaClass, config: JavadocConfig): string {
    const url = (config.url.endsWith('/') ? config.url : config.url + '/') + cls.name.replace('$', '.')
    return `[Javadoc of ${cls.simpleName}](${url})`
}

function createClassEmbed(data: JavaClass, config: JavadocConfig): APIEmbed {
    let description = `Name: \`${data.sourceName}\`\n`
    description += `Modifiers: ${data.modifiers.map(m => `\`${m}\``).join(' ')}\n`
    if (data.superClass != undefined) description += `Extends: \`${data.superClass.signature}\`\n`
    if (data.interfaces != undefined && data.interfaces.length > 0) description += `Implements: ${data.interfaces.map(itf => `\`${itf.signature}\``).join(", ")}\n`
    if (data.enumValues != undefined && data.enumValues.length > 0) description += `Enum Values: ${data.enumValues.map(v => `\`${v}\``).join(", ")}\n`
    const [docText, fields] = createDocText(data, config, data.doc)
    description += docText
    return dcu.embedList("Class " + data.simpleName, description, config.icon, fields)
}

function createFieldEmbed(data: JavaField, cls: JavaClass, config: JavadocConfig): APIEmbed {
    let description = `Name: \`${data.name}\`\n`
    description += `Modifiers: ${data.modifiers.map(m => `\`${m}\``).join(' ')}\n`
    description += `Type: \`${data.type.name}\`\n`
    if (data.constant != undefined) description += `Value: \`${data.constant}\`\n`
    const [docText, fields] = createDocText(cls, config, data.doc)
    description += docText
    return dcu.embedList("Field " + cls.simpleName + "#" + data.name, description, config.icon, fields)
}

function createConstructorEmbed(data: JavaConstructor, cls: JavaClass, config: JavadocConfig): APIEmbed {
    let description = `Modifiers: ${data.modifiers.map(m => `\`${m}\``).join(' ')}\n`
    description += `Type: \`${data.typeId}\`\n`
    if (data.throws != undefined && data.throws.length > 0) description += `Throws: ${data.throws.map(v => `\`${v.name}\``).join(', ')}\n`
    const [docText, fields] = createMethodDocText(cls, config, data)
    description += docText
    return dcu.embedList("Constructor " + cls.simpleName, description, config.icon, fields)

}

function createMethodEmbed(data: JavaMethod, cls: JavaClass, config: JavadocConfig): APIEmbed {
    let description = `Name: \`${data.name}\`\n`
    description += `Modifiers: ${data.modifiers.map(m => `\`${m}\``).join(' ')}\n`
    description += `Type: \`${data.typeId}\`\n`
    if (data.throws != undefined && data.throws.length > 0) description += `Throws: ${data.throws.map(v => `\`${v.name}\``).join(', ')}\n`
    const [docText, fields] = createMethodDocText(cls, config, data)
    description += docText
    return dcu.embedList("Method " + cls.simpleName + "#" + data.name, description, config.icon, fields)
}
