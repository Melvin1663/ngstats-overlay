const { Relay } = require("bedrock-protocol");
const fs = require('fs');
const optsPath = process.argv[2];
const version = process.argv[3];

let options = JSON.parse(fs.readFileSync(optsPath).toString());

const versionOrder = [
    "1.16.201", // 0
    "1.16.210", // 1
    "1.16.220", // 2
    "1.17.0", // 3
    "1.17.10", // 4
    "1.17.30", // 5
    "1.17.40", // 6
    "1.18.0", // 7
    "1.18.11", // 8
    "1.18.30", // 9
    "1.19.1", // 10
    "1.19.10", // 11
    "1.19.20", // 12
    "1.19.21", // 13
    "1.19.30", // 14
    "1.19.40", // 15
    "1.19.50", // 16
    "1.19.60" // 17
];

const relay = new Relay({
    version: version,
    host: options.relayIp,
    port: options.relayPort,
    profilesFolder: "./src/minecraft",
    motd: {
        motd: 'NG Stats Overlay',
        levelName: 'NG Stats Overlay'
    },
    destination: {
        host: options.ip,
        port: options.port,
    }
});

let playerList = {};
let _playerList = [];
let o_playerList = {};
let inGame = false;
let clock;

relay.conLog = console.log;
relay.listen()

relay.on("join", player => {
    console.log('New connection', player.connection.address)
});

relay.on("connect", player => {
    player.on('clientbound', ({ name, params }) => {
        if (name == 'text' && params?.type == 'raw' && params?.message.length) {
            if (params.message.replaceAll(/┬º./gm, '').includes('§eThe game starts in §c1 §esecond!')) setTimeout(() => {
                console.log(JSON.stringify({ title: 'relay_auto_min', data: 1 }));
                inGame = true;
            }, 1000)
            else if (params.message.replaceAll(/┬º./gm, '').includes('§l§aQueued! Use the bed to return to lobby!')) {
                console.log(JSON.stringify({ title: 'relay_auto_min', data: 0 }));
                inGame = false;
            }
        }

        if (name == 'disconnect') {
            playerList = {};
            _playerList = [];
            o_playerList = {};
            inGame = false;
        }

        if (name == 'remove_entity' && !inGame) {
            for (i in playerList) {
                if (playerList[i].includes(params.entity_id_self)) {
                    delete playerList[i];
                    break;
                }
            }

            for (i in o_playerList) {
                if (o_playerList[i].includes(params.entity_id_self)) {
                    delete o_playerList[i];
                    break;
                }
            }
        }

        if (name == 'add_player' && !inGame) {
            if (params.uuid?.length && params.username?.length) {
                let nametag = params.metadata.find(e => e.key == 'nametag')?.value;

                let runTimeIdKey = 'runtime_id';
                let uniqueIdKey = 'unique_id';

                if (versionOrder.indexOf(version) < 11) {
                    runTimeIdKey = 'runtime_entity_id';
                    uniqueIdKey = 'entity_id_self';
                };

                if (nametag) playerList[params[runTimeIdKey]] = [params.username, params.uuid, nametag, params[uniqueIdKey]];
            }
        }

        if (name == 'move_entity' && !inGame) {
            let rid = playerList[parseInt(params?.runtime_entity_id)];

            if (o_playerList[params?.runtime_entity_id] || !rid || _playerList.find(e => e[0] == rid[0])) return;

            _playerList.push([rid[0], rid[2]]);
            o_playerList[params.runtime_entity_id] = rid;
        }

        if (name == 'boss_event') {
            if (params.title) console.log(JSON.stringify({ title: name, data: params }, (key, value) =>
                typeof value === 'bigint'
                    ? value.toString()
                    : value
            ));
        }

        if (name == 'change_dimension') {
            console.log(JSON.stringify({ title: 'change_dimension', data: params }));
            o_playerList = {};
            _playerList = [];
            playerList = {};
            inGame = false;
        }
    })
})

clock = setInterval(() => {
    for (i in o_playerList) {
        if (!_playerList.find(e => e[0] == o_playerList[i][0])) _playerList.push([o_playerList[i][0], o_playerList[i][2]]);
    }
    // console.log(playerList)
    console.log(JSON.stringify({ title: 'player_list', data: _playerList }));
    _playerList = [];
}, 1000)