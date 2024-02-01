# houndsbot

This script has been created to search the player's channel history in order to find their identifier data.

The script is optimized and has been tested on a server with 300 online players.

# Config:

```
{
    "discordBotToken": "", // change to your bot token
    "sendChannelId": "", //  embed logs send channel
    "ipdisable": true, // checking player ip on hounds discord
    "houndsdiscord": "829385448345305128", // discord hounds all server
    "endDate": "2024-01-01", // the date by which it is to look for messages
    "checkChannels": [ // list of servers working with server hounds all
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
    "embedConfig": { //embed config simple 
        "title": "Player detected!",
        "descriptionTemplate": "Player **{playerName}** has been detected as a cheater written out on hounds all!",
        "color": "124304",
        "thumbnailUrl": "https://i.imgur.com/VLnUaOz.png",
        "footerText": "©️ Trujca.gg created by junredzikkk",
        "timestamp": true
    }
};
```

# Creators 

- If you have problems with the bot or new suggestions, create a new issue
