import * as fs from 'fs'
import {DiscordAuth} from "./discordbot/discordAuth";
import {promisify} from "util";

export async function reloadSlashCommands(auth: DiscordAuth, guild: string): Promise<boolean> {
    try {
        console.log('Started refreshing application (/) commands.');

        const asyncReaddir = promisify(fs.readdir)
        const commandFiles = (await asyncReaddir('./commands')).filter(f => f.endsWith('.js'));
        
        for (const file of commandFiles) {
            const command = require(`./commands/${file}`);
            // Internal stuff but it works.
            // @ts-ignore
            await auth.client.api.applications(auth.clientId).guilds(guild).commands.post({data: command.data.toJSON()})
        }
        
        console.log('Successfully reloaded application (/) commands.');
        return true
	} catch (error) {
		console.error(error);
        return false
	}
}