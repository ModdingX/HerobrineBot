import {Client as DiscordClient, Guild, GuildMember, Message, MessageReaction, PartialUser, User} from "discord.js";

export async function addReactionRole(discord: DiscordClient, guild: Guild, roleMessage: Message, emote: string, roleId: string) {
    const role = await guild.roles.fetch(roleId)
    if (role == undefined) {
        console.log("Role not found: " + roleId)
    } else {
        discord.on("messageReactionAdd", async (reaction: MessageReaction, user: User | PartialUser) => {
            if (emote == reaction.emoji.id && reaction.message.id == roleMessage.id && reaction.message.guild != null) {
                let member: GuildMember = await reaction.message.guild.members.fetch(user.id);
                await member.roles.add(role.id);
            }
        })

        discord.on("messageReactionRemove", async (reaction: MessageReaction, user: User | PartialUser) => {
            if (emote == reaction.emoji.id && reaction.message.id == roleMessage.id && reaction.message.guild != null) {
                let member: GuildMember = await reaction.message.guild.members.fetch(user.id);
                await member.roles.remove(role.id);
            }
        })
    }
}