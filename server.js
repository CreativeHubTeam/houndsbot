const { Client, Intents, MessageEmbed } = require('discord.js');

class Main {
    constructor(config) {
        this.config = config;
        this.client = new Client({
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MEMBERS,
                Intents.FLAGS.GUILD_PRESENCES,
                Intents.FLAGS.GUILD_MESSAGES,
            ],
        });
        this.loadcache = false;
        this.channelsCache = {};
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.client.once('ready', () => {
            console.log('The script loaded the discord.js module!');
            this.updateCache();
            setInterval(() => this.updateCache(), 15 * 60 * 1000); //15 minutes
        });
    }
    
    login() {
        this.client.login(this.config.discordBotToken);
    }

    /**
     * @param {string} playerName - The name of the player.
     * @param {Array} foundMessages - message found by the script
     */
    async sendmembed(playerName, foundMessages) {
        const sendChannel = this.client.channels.cache.get(this.config.sendChannelId);
        if (!sendChannel) {
            console.warn(`Channel with ID ${this.config.sendChannelId} does not exist!`);
            return;
        }

        const embedConfig = this.config.embedConfig;
        const embed = new MessageEmbed()
            .setTitle(embedConfig.title)
            .setDescription(embedConfig.descriptionTemplate.replace('{playerName}', playerName))
            .setColor(embedConfig.color)
            .setThumbnail(embedConfig.thumbnailUrl)
            .setFooter({ text: embedConfig.footerText });

        if (embedConfig.timestamp) {
            embed.setTimestamp();
        }

        foundMessages.forEach(({ content, channelName, channelId, messageId, messageTime, identifiers }) => {
            const link = `https://discord.com/channels/${this.config.houndsdiscord}/${channelId}/${messageId}`;
            const identifierStrings = [];
        
            for (const k in identifiers) {
                if (identifiers.hasOwnProperty(k)) {
                    identifierStrings.push(...identifiers[k]);
                }
            }
        
            embed.addField(
                `**Channel**: ${channelName}`,
                `[More](${link})\n\n**Message ID:** ${messageId}\n\n**Content:** ${content.substring(0, 300)}...\n\n**Detected Identifiers:** ${identifierStrings.join(', ')}\n\n**Message Date:** ${messageTime.toLocaleString()}`
            );
        });
        
        try {
            await sendChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error(`Error sending message to channel ${sendChannel.id}:`, error);
        }
    }

    async updateCache() {
        this.loadcache = false;
        const startTime = Date.now();
        console.log('[2;37m[2;33m[Hounds all Server] [0m[2;37m[0m Updating cache...');
        for (const channelId of this.config.checkChannels) {
            console.log(`[2;37m[2;33m[Hounds all Server] [0m[2;37m[0m Fetching messages from channel: ${channelId}`);
            const channel = await this.client.channels.fetch(channelId).catch(error => {
                console.error(`Unable to fetch channel with ID ${channelId}:`, error);
            });
            if (!channel) {
                console.warn(`Channel with ID ${channelId} does not exist or the bot does not have access!`);
                continue;
            }

            try {
                let messages = await this.fetchAllMessages(channel);
                this.channelsCache[channelId] = messages;
                console.log(`[2;37m[2;33m[Hounds all Server] [0m[2;37m[0m Cached ${messages.length} messages from channel ${channelId}.`);
            } catch (error) {
                console.error(`Error fetching messages for cache from channel ${channelId}:`, error);
            }
        }
        const endTime = Date.now();
        this.loadcache = true;
        console.log(`[2;37m[2;33m[Hounds all Server] [0m[2;37m[0m Cache updated. Duration: ${(endTime - startTime) / 1000} seconds.`);
    }

    /**
     * @param {Array} channel - channel info discord
     * @returns {Array} - message found.
     */

    async fetchAllMessages(channel) {
        let allMessages = [];
        let lastMessageId;
        const endDateTimestamp = new Date(this.config.endDate).getTime();

        while (1 > 0) {
            const options = { limit: 100 };
            if (lastMessageId) options.before = lastMessageId;
            const messages = await channel.messages.fetch(options).catch(error => {
                console.error(`Error fetching messages from channel ${channel.id}:`, error);
                return null;
            });

            if (!messages || messages.size === 0) break;

            messages.forEach(message => {
                if (this.config.endDate && message.createdTimestamp < endDateTimestamp) return;
                allMessages.push(message);
            });

            lastMessageId = messages.last()?.id;
            if (!lastMessageId) break;
        }

        return allMessages;
    }

    /**
     * @param {string} text - The text from which to extract identifiers.
     * @returns {Array} - An array of extracted identifiers.
     */

    checktext(text) {
        const identp = {
            steam: /steam:1[0-9a-f]+/gi,
            discord: /discord:\d+/gi,
            license: /license:[0-9a-f]+/gi,
            xbl: /xbl:\d+/gi,
            live: /live:\d+/gi,
            fivem: /fivem:\d+/gi,
            playerID: /Player ID:\s*(\d+)/gi,
            rockstarLicense: /Licencja Rockstar:\s*(license:[0-9a-f]+)/gi,
            tokens: /\b\d{17,19}\b/g
        };
    
        let i = {};
        for (const [k, p] of Object.entries(identp)) {
            const m = text.match(p);
            if (m) {
                i[k] = m;
            }
        }
        return i;
    }

    /**
     * @param {number} channelId - ID channel.
     * @returns {Array} foundMessages - message found by the script
     */

    async findIdentifiers(channelId, identifiers) {
        let foundMessages = [];
        const cachedMessages = this.channelsCache[channelId] || [];
    
        for (const message of cachedMessages) {
            const messageIdentifiers = this.checktext(message.content);
            let found = this.checkidentifiers(messageIdentifiers, identifiers);
    
            if (!found && message.embeds.length > 0) {
                for (const embed of message.embeds) {
                    const embedText = `${embed.title || ''}\n${embed.description || ''}`;
                    const embedIdentifiers = this.checktext(embedText);
                    found = this.checkidentifiers(embedIdentifiers, identifiers);
                    if (found) {
                        break;
                    }
                }
            }
    
            if (found) {
                foundMessages.push({
                    content: message.content,
                    channelName: message.channel.name,
                    channelId: message.channel.id,
                    messageId: message.id,
                    messageTime: message.createdAt,
                    identifiers: messageIdentifiers
                });
            }
        }
    
        return foundMessages;
    }

    /**
     * @param {Array} identifierGroups - Identifiers table.
     * @returns {boolean} 
     */   
    checkidentifiers(identifierGroups, identifiers) {
        for (const itype in identifierGroups) {
            if (identifierGroups.hasOwnProperty(itype)) {
                const identifierArray = identifierGroups[itype];
                if (Array.isArray(identifierArray)) {
                    for (const i of identifiers) {
                        if (identifierArray.includes(i)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    /**
     * @param {Array} identifiers - Identifiers table.
     * @returns {boolean} 
     */   

    filtr(identifiers, ipdisabled) {
        return identifiers.filter(identifier => {
            const isIP = identifier.startsWith("ip:");
            return ipdisabled ? !isIP : true;
        });
    }

    /**
     * @param {number} player - ID players.
     * @returns {Array} - table identifiers
     */   

    GetPlayerIdentifiers(player) {
        const identifiers = Array.from(
            { length: GetNumPlayerIdentifiers(player) },
            (_, i) => GetPlayerIdentifier(player, i)
        );

        const tokens = Array.from(
            { length: GetNumPlayerTokens(player) },
            (_, i) => GetPlayerToken(player, i)
        );
        return this.filtr([...identifiers, ...tokens], config.ipdisable)
    }


    /**
     * @param {Array} players - ID table players.
     */   

    async checkPlayers(players) {
        for (const player of players) {
            const identifiers = this.GetPlayerIdentifiers(player);
            const playerName = GetPlayerName(player);

            for (const checkChannelId of this.config.checkChannels) {
                const found = await this.findIdentifiers(checkChannelId, identifiers);
                if (found.length > 0) {
                    console.log(`Cheater Detected: ${playerName}`);
                    await this.sendmembed(`${playerName} (${player})`, found);
                }
            }
            console.log(`Finished checking channels for player: ${playerName} (${player})`);
        }
    }
}


const config = {
    "discordBotToken": "",
    "sendChannelId": "",
    "ipdisable": true,
    "houndsdiscord": "829385448345305128",
    "endDate": "2024-01-01",
    "checkChannels": [
        "1187831821396885657", // trujca
        "829392430297382952", // cocorp
        "829416209161519153", // realmrp
        "991486546156998667", // grandrdm
        "1113917598329999400", // 4rdm
        "924794155669012501", // hyperp
        "1112724890794074142", // adrenalinarp
        "1124717448181063883", // onlyrp
        "989979352169054209", // neonrp
        "1015007025773678612", // 77rp
        "999450502163075102", // nightsiderp
        "995743748770242570", // betterside
        "1020026499241349191", // waitrp
        "1054901681286025349", // xenonrp
        "1128082880111849502", // fazerp
        "1132684812436643890", // wavesrp
        "1120121781345333339", // flushrp
        "1120992396868587640", // luna-rp
        "1142245676344934410", // leangg
        "1172601237238190181", // mystory
        "1184187836166053908", // x-rp
        "1184087452466544703", // continentalrp
        "1183911527913361568", // exumarp
        "1172600743144980623", // oslorp
        "1084082698563358780", // richrp
        "1109113316707663923", // 3rp
    ],
    "embedConfig": {
        "title": "Wykryto frajera!",
        "descriptionTemplate": "Gracz **{playerName}** został wykryty jako cheater wypisane na hounds all!",
        "color": "124304",
        "thumbnailUrl": "https://i.imgur.com/VLnUaOz.png",
        "footerText": "©️ Trujca.gg created by junredzikkk",
        "timestamp": true
    }
};


const script = new Main(config);

on('trujca:join', async (playerId) => { //rename esx:playerLoaded for the esx framework or another custom for your 
    const player = playerId;
    const playersToCheck = [player];
    if (script.loadcache) {
        await script.checkPlayers(playersToCheck);
    }
});

script.login();
