const fetch = require('node-fetch2');

module.exports = async (player, { expand, withFactionData, withGuildData, withOnline, withPunishments, withSkinData, withStats, withVoteStatus, withAvatarBlurhash, period }, apiKey) => {
    if (!player.length) return 'Player parameter is empty.';

    let res;
    let queryString = '?a=0';
    let queries = { expand, withFactionData, withGuildData, withOnline, withPunishments, withSkinData, withStats, withVoteStatus, withAvatarBlurhash, period };
    for (q in queries) {
        let value = queries[q] == undefined ? (q == 'period' ? 'global' : false) : queries[q];
        queryString += `&${q}=${value}`;
        queries[q] = value;
    }

    if (player.length == 1) {
        res = await fetch(`https://api.ngmc.co/v1/players/${player[0]}${queryString}`, {
            headers: {
                "Authorization": apiKey
            }
        }).then(r => r.json()).catch(console.error);

        if (!res) res = 'API returned nothing.';
    } else {
        let requestBody = { "names": player };

        for (q in queries) {
            requestBody[q] = queries[q];
        }

        res = await fetch('https://api.ngmc.co/v1/players/batch', {
            "method": "POST",
            "headers": {
                "Content-Type": "application/json",
                "Authorization": apiKey
            },
            "body": JSON.stringify(requestBody)
        }).then(e => e.json()).catch(console.error);

        if (!res) res = 'API returned nothing.';
    }

    return res;
}