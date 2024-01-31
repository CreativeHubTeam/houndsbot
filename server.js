const {
    Client,
    Intents,
    MessageEmbed
} = require('discord.js');


let config = {
    "discordBotToken": "",
    "sendChannelId": "",
    "ipdisable": true,
    "houndsdiscord": "829385448345305128",
    "endDate": "2024-01-01",
    "checkChannels": [
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
        "title": "Player detected!",
        "descriptionTemplate": "Player **{playerName}** has been detected as a cheater written out on hounds all!",
        "color": "124304",
        "thumbnailUrl": "https://i.imgur.com/VLnUaOz.png",
        "footerText": "©️ Trujca.gg created by junredzikkk",
        "timestamp": true
    }
};



const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_MESSAGES,
    ],
});


client.login(config.discordBotToken);

client.once('ready', () => {
    console.log('Discord bot is ready!');
});

on('trujca:join', async (playerId) => { //rename esx:playerLoaded for the esx framework or another custom for your 
    const player = playerId;
    const playersToCheck = [player];

    await checkPlayers(playersToCheck);
});




async function sendmembed(playerName, foundMessages) {
    const sendChannel = client.channels.cache.get(config.sendChannelId);
    if (!sendChannel) {
        console.warn(`The channel for sending with ID ${sendChannel} does not exist!`);
        return;
    }
    const embed = new MessageEmbed()
        .setTitle(config.embedConfig.title)
        .setDescription(config.embedConfig.descriptionTemplate.replace('{playerName}', playerName))
        .setColor(config.embedConfig.color)

    foundMessages.forEach(({
        content,
        channelName,
        channelId,
        messageId,
        messageTime,
        identifiers
    }) => {
        const link = `https://discord.com/channels/${config.houndsdiscord}/${channelId}/${messageId}`;
        embed.addField(
            `**Kanał**: ${channelName}`,
            `[Więcej](${link})\n\n**ID Wiadomości:** ${messageId}\n\n**Zawartość:** ${content.substring(0, 300)}...\n\n**Wykryte identyfikatory:** ${identifiers.join(', ')}\n\n**Data Wiadomości:** ${messageTime.toLocaleString()}`
        );
    });

    embed.setThumbnail(config.embedConfig.thumbnailUrl)
    embed.setFooter({ text: config.embedConfig.footerText });
    if (config.embedConfig.timestamp) {
        embed.setTimestamp();
    }
    try {
        await sendChannel.send({
            embeds: [embed]
        });
    } catch (error) {
        console.error(`Error sending message to channel ${sendChannel.id}:`, error);
    }
}

function checktext(text) {
    const identifierP = {
        steam: /steam:\d+/i,
        discord: /discord:\d+/i,
        license: /license:[0-9a-f]+/i,
        xbl: /xbl:\d+/i,
        live: /live:\d+/i,
        fivem: /fivem:\d+/i,
        playerID: /Player ID:\s*(\d+)/i,
        rockstarLicense: /Licencja Rockstar:\s*(license:[0-9a-f]+)/i,
        genericID: /\b\d{17,19}\b/
    };

    let i = [];
    for (const [k, p] of Object.entries(identifierP)) {
        const m = text.match(p);
        if (m) {
            i.push(m[0]);
        }
    }
    return i;
}

async function findIdentifiers(channel, identifiers) {
    let foundMessages = [];
    let lastMessageId;
    const endDateTimestamp = new Date(config.endDate).getTime();

    try {
        while (true) {
            const options = { limit: 100 };
            if (lastMessageId) options.before = lastMessageId;
            const messages = await channel.messages.fetch(options);

            if (messages.size === 0) {
                break;
            }
            for (const message of messages.values()) {
                if (config.endDate && message.createdTimestamp < endDateTimestamp) return foundMessages;
                const messageIdentifiers = checktext(message.content);
                for (const identifier of identifiers) {
                    if (messageIdentifiers.includes(identifier)) {
                        foundMessages.push({
                            content: message.content,
                            channelName: channel.name,
                            channelId: channel.id,
                            messageId: message.id,
                            messageTime: message.createdAt,
                            identifiers: messageIdentifiers
                        });
                        break;
                    }
                }

                if (message.embeds.length > 0) {
                    for (const embed of message.embeds) {
                        const embedText = `${embed.title || ''}\n${embed.description || ''}`;
                        const embedIdentifiers = checktext(embedText);
                        for (const identifier of identifiers) {
                            if (embedIdentifiers.includes(identifier)) {
                                foundMessages.push({
                                    content: embedText,
                                    channelName: channel.name,
                                    channelId: channel.id,
                                    messageId: message.id,
                                    messageTime: message.createdAt,
                                    identifiers: embedIdentifiers
                                });
                                break;
                            }
                        }
                    }
                }
            }
            lastMessageId = messages.last().id;
        }
    } catch (error) {
        console.error(`Error while fetching messages from channel ${channel.id}:`, error);
    }

    return foundMessages;
}


function filtr(identifiers, ipdisabled) {
    return identifiers.filter(identifier => {
        const isIP = identifier.startsWith("ip:");

        return ipdisabled ? !isIP : true;
    });
}

function GetPlayerIdentifiers(player) {
    const identifiers = Array.from(
        { length: GetNumPlayerIdentifiers(player) },
        (_, i) => GetPlayerIdentifier(player, i)
    );

    const tokens = Array.from(
        { length: GetNumPlayerTokens(player) },
        (_, i) => GetPlayerToken(player, i)
    );
    return filtr([...identifiers, ...tokens], config.ipdisable)
}

async function checkPlayers(players) {
    for (const player of players) {
        const identifiers = GetPlayerIdentifiers(player);
        const playerName = GetPlayerName(player);

        for (const checkChannelId of config.checkChannels) {
            const checkChannel = client.channels.cache.get(checkChannelId);
            if (!checkChannel) {
                console.warn(`error channel ${checkChannelId}!`);
                continue;
            }

            console.log(`Check channel: ${checkChannel.name} (ID: ${checkChannel.id}) for: ${playerName} (${player})`);
            try {
                const foundMessages = await findIdentifiers(checkChannel, identifiers);
                if (foundMessages.length > 0) {
                    console.log(`Cheater Detected: ${playerName}`);
                    await sendmembed(`${playerName} (${player})`, foundMessages);
                }
            } catch (err) {
                console.error(`error ${checkChannel.id}:`, err);
            }
        }
        console.log(`A search of player channels has been completed: ${playerName} (${player})`);
    }
}
