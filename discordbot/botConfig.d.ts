export interface BotConfig {
    guild: string
    javadoc: JavadocConfig
    role_channel: string
    role_message: string
    roles: Record<string, string>
}

export interface JavadocConfig {
    url: string
    icon: string
}
