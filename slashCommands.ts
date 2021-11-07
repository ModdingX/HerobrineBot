import * as fs from 'fs'
import {DiscordAuth} from "./discordbot/discordAuth";
import {promisify} from "util";

export async function reloadSlashCommands(auth: DiscordAuth, guild: string): Promise<boolean> {
    try {
        console.log('Started refreshing application (/) commands.');

        const asyncReaddir = promisify(fs.readdir)
        const commandFiles = (await asyncReaddir('./commands')).filter(f => f.endsWith('.js'));
        
        const commands = []
        
        for (const file of commandFiles) {
            const command = require(`./commands/${file}`);
            commands.push(command.data.toJSON())
        }

        // Internal stuff but it works.
        // @ts-ignore
        await auth.client.api.applications(auth.clientId).guilds(guild).commands.put({data: commands})

        console.log('Successfully reloaded application (/) commands.');
        return true
	} catch (error) {
		console.error(error);
        return false
	}
}