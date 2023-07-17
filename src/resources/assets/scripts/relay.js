const { Relay } = require("bedrock-protocol");
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const optsPath = process.argv[2];
const version = process.argv[3];
const authPath = process.argv[4];

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
    "1.19.60", // 17
    "1.19.62", // 18
    "1.19.63", // 19
    "1.19.70", // 20
    "1.19.80", // 21
    "1.20.0", // 22
    "1.20.10" // 23
];

const relay = new Relay({
    version: version,
    host: options.relayIp,
    port: options.relayPort,
    profilesFolder: authPath,
    motd: {
        motd: 'NG Stats Overlay',
        levelName: 'NG Stats Overlay'
    },
    destination: {
        host: options.ip,
        port: options.port,
    }
});

const clean_txt = (txt) => {
    return txt.replaceAll(/┬º./gm, '').replaceAll(/§./gm, '');
}

const sendCmd = (player) => {
    player.upstream?.write('command_request', {
        command: '/report',
        origin: {
            type: 'player',
            uuid: uuidv4(),
            request_id: '',
            player_entity_id: undefined
        },
        internal: false,
        version: 56
    });
}

let inGame = false;
let inLobby = true;
let report = false;
let clock;

relay.conLog = console.log;
relay.listen();

relay.on("join", player => {
    console.log('New connection', player.connection.address)
});

relay.on("connect", player => {
    player.on('clientbound', ({ name, params }, des) => {
        if (!clock) clock = setInterval(() => {
            if (!inGame && !inLobby) {
                report = true;
                sendCmd(player);
            } else {
                clearInterval(clock);
                clock = undefined;
            }
        }, 5000)


        if (name == 'modal_form_request' && report == true) {
            try {
                report = false;
                des.canceled = true;
                console.log(JSON.stringify({ title: 'player_list', data: JSON.parse(params.data).buttons.map(p => p.text.replace('Report ', '')) }))
                player.upstream?.write('modal_form_response', {
                    form_id: 0,
                    has_response_data: false,
                    data: undefined,
                    has_cancel_reason: true,
                    cancel_reason: 'closed'
                })
            } catch (e) {
                console.log(e);
            }
        }

        if (name == 'text' && params?.type == 'raw' && params?.message.length) {
            if (params.message.replaceAll(/┬º./gm, '').includes('§eThe game starts in §c1 §esecond!')) setTimeout(() => {
                report = true;
                sendCmd(player);
                console.log(JSON.stringify({ title: 'relay_auto_min', data: 1 }));
                inGame = true;
            }, 1000)
            else if (params.message.replaceAll(/┬º./gm, '').includes('§l§aQueued! Use the bed to return to lobby!')) {
                console.log(JSON.stringify({ title: 'relay_auto_min', data: 0 }));
                inGame = false;
            }
        }

        if (name == 'boss_event') {
            if (params.title) {
                console.log(JSON.stringify({ title: name, data: params }, (key, value) =>
                    typeof value === 'bigint'
                        ? value.toString()
                        : value
                ));
                if (clean_txt(params.title).includes('NetherGames Lobby')) inLobby = true;
                else inLobby = false;
            }
        }

        if (name == 'change_dimension') {
            console.log(JSON.stringify({ title: 'change_dimension', data: params }));
            inGame = false;
        }
    })
})