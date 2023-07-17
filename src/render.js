const exit_window = () => {
    window.electronAPI.getConfirm({
        data: {
            title: 'Exit Program',
            type: 'warning',
            buttons: ['Cancel', 'Exit'],
            message: 'Are you sure you want to exit? This will disconnect you from the server (If connected).'
        },
        id: 'term_program'
    })
}
const on_top = (c) => window.electronAPI.onTop(c);
const ignoreMouse = (c) => window.electronAPI.ignoreMouse(c);

const exitAppButton = document.getElementById('app_exit');
const minAppButton = document.getElementById('app_min');
const titleBar = document.getElementById('title_bar');
const root = document.querySelector(':root');
const rootStyles = getComputedStyle(root);
const termButton = document.getElementById('relay_stop');
const startButton = document.getElementById('relay_start');
const conStats = document.getElementById('conStats');
const logMsg = document.getElementById('log_msg');
const logMsg2 = document.getElementById('log_msg_2');
const optsButton = document.getElementById('app_opts');
const faqButton = document.getElementById('app_faq');
const optionPane = document.getElementById('optionPane');
const contributorsButton = document.getElementById('app_contributors');
const contributorsPane = document.getElementById('contributorsPane');
const sliderInputParent = document.getElementById('_option_opacity');
const sliderInputChild2 = document.getElementById('_option_opacity_helper_2')
const opacityValue = document.getElementById('option_opaciy_value');
const optionPort = document.getElementById('_option_port');
const checkBoxOnTop = document.getElementById('_option_ontop');
const checkBoxOnAutoStart = document.getElementById('_option_autostart');
const checkBoxAutoMin = document.getElementById('_option_automin');
const serverRegion = document.getElementById('_option_region');
const optionAPIKey = document.getElementById('_option_apiKey');
const checkBoxClickthroughable = document.getElementById('_option_ignoremouse');
const statsTable = document.getElementById('stats_table');
const statsDiv = document.getElementById('stats');
const mainStatsDiv = document.getElementById('stats_main');
const miscEls = document.getElementById('misc');
const winTitles = [document.getElementById('win_title'), document.getElementById('win_title_2'), document.getElementById('win_ver')];

let mcColors;
let hasRan = false;
let pjson;
let options;
let versionKeys;
let listening;
let playerList = [];
let o_playerList = [];
let playerListData = {};
let blacklists = [];
let inLobby = true;
let isConnectingAuth = false;
let curIgnoringMouse = false;

sliderInputParent.addEventListener('input', () => updateSliderOpacity(sliderInputParent.value));

const ctHandle = (c) => {
    curIgnoringMouse = c ? true : false;
    window.electronAPI.ignoreMouse(c);
}

titleBar.addEventListener('mouseenter', event => options.ignoreMouse ? ctHandle(0) : '');
titleBar.addEventListener('mouseleave', event => options.ignoreMouse ? ctHandle(1) : '');
optionPane.addEventListener('mouseenter', event => options.ignoreMouse ? ctHandle(0) : '');
optionPane.addEventListener('mouseleave', event => options.ignoreMouse ? ctHandle(1) : '');

mainStatsDiv.addEventListener('mousemove', event => {
    if (playerList.length && event.clientX > window.innerWidth - 100 && options.ignoreMouse && curIgnoringMouse == true) ctHandle(0);
    else if (playerList.length && options.ignoreMouse && curIgnoringMouse == false) ctHandle(1);
})

const cleanMode = (a) => {
    miscEls.style.setProperty('display', a ? 'none' : 'block');
    for (i of winTitles) {
        i.style.setProperty('display', a ? 'none' : 'inline-block');
    }
    faqButton.style.setProperty('display', a ? 'none' : 'block');
    exitAppButton.style.setProperty('display', a ? 'none' : 'block');
    contributorsButton.style.setProperty('display', a ? 'none' : 'block');
    minAppButton.style.setProperty('margin-right', a ? '12px' : '0px')
    titleBar.style.setProperty('background-color', a ? 'rgba(0,0,0,0)' : 'rgba(32, 32, 32, var(--bgAlpha)')
}

const updateSliderOpacity = (value) => {
    sliderInputChild2.style.setProperty('width', `${value * 0.86}%`);
    opacityValue.innerHTML = `${value}%`;
    root.style.setProperty('--bgAlpha', value / 100);
    sliderInputParent.value = value;
}

options = window.electronAPI.sendSync('getData', 'options.json').data;
versionKeys = window.electronAPI.sendSync('getData', 'versionKeys.json').data;
blacklists = window.electronAPI.sendSync('getData', 'blacklist.txt').data;
mcColors = window.electronAPI.sendSync('getData', 'mcColors.json').data;
pjson = window.electronAPI.sendSync('getData', 'package.json').data;

winTitles[2].innerHTML += pjson.version;

if (!hasRan) {
    hasRan = true;
    if (options.autoStart) {
        setTimeout(() => {
            start_relay();
        }, 1000)
    } else {
        logMsg.innerHTML = "Welcome to NetherGames Stats Overlay! This application will display the stats of the players in your match. Clicking the start button will disconnect you (if connected) from the NetherGames network, this is done to create a proxy to the server in order to observe the packets and extract the information needed by NetherGames Stats Overlay.";
    }
}

updateSliderOpacity(options.winOpacity);
on_top(+options.winOnTop);
ignoreMouse(+options.ignoreMouse);
cleanMode(options.ignoreMouse);

window.electronAPI.onData(async (event, data) => {
    let isObject = data?.title ? true : false;

    if (!isObject && data.startsWith('relay_closed')) {
        termButton.style.setProperty('display', 'none');

        startButton.style.setProperty('display', 'block');
        startButton.removeAttribute('disabled');
        startButton.style.setProperty('border-color', 'white');
        startButton.style.setProperty('color', 'white');

        root.style.setProperty('--startButtonHoverColor', rootStyles.getPropertyValue('--defaultStartButtonColor'));

        if (data == 'relay_closed_we') logMsg.innerHTML = 'Proxy server closed unexpectedly.';
        else if (data == 'relay_closed_rs') logMsg.innerHTML = 'Re establishing connection...';
        else logMsg.innerHTML = 'Proxy server terminated.';
        logMsg2.innerHTML = '';
        logMsg2.style.setProperty('display', 'none');
        statsDiv.style.setProperty('display', 'none');
        conStats.innerHTML = 'Idle';

        listening = undefined;
    }

    if (isObject) {
        if (data.title == 'blacklist.txt') return blacklists = data.data;

        // when packets

        logMsg2.style.setProperty('display', 'block');

        if (data.title == 'relay_auto_min') {
            if (data.data) {
                o_playerList = playerList;
                if (options.autoMin) window.electronAPI.minimize(data.data);
            } else {
                o_playerList = [];
                if (options.autoMin) window.electronAPI.focusWin(1);
            }
        }

        if (data.title == 'boss_event' && data.data.title) {
            let boss = clean_txt(data.data.title);

            logMsg.style.setProperty('text-align', 'center');

            if (boss.includes("NetherGames Lobby")) {
                statsDiv.style.setProperty('display', 'none');
                logMsg.style.setProperty('display', 'block');
                logMsg.innerHTML = 'Detected on lobby<br>Join a game for the overlay to start';
                inLobby = true;
                o_playerList = [];
            } else if (
                boss.includes('NetherGames Factions') ||
                boss.includes('NetherGames Creative') ||
                boss.includes('NetherGames Skyblock')
            ) {
                statsDiv.style.setProperty('display', 'none');
                logMsg.style.setProperty('display', 'block');
                logMsg.innerHTML = 'Overlay does not work on<br>Factions, Creative, and Skyblock';
                inLobby = true;
                o_playerList = [];
            } else {
                inLobby = false;
                statsDiv.style.setProperty('display', 'flex');
                mainStatsDiv.style.setProperty('display', 'flex');
                logMsg.innerHTML = '';
                logMsg.style.setProperty('display', 'none');
            }
        }

        if (data.title == 'player_list' && !inLobby) {
            let comparison = window.electronAPI.sendSync('compareArray', { before: playerList ?? [], after: data.data ?? [] });

            console.log(comparison)

            if (comparison.changed && !o_playerList.length) {
                playerList = data.data;

                let playersRes;

                for (delPlayer of comparison.deleted) {
                    for (xuid in playerListData) if (playerListData[xuid].name == delPlayer) delete playerListData[xuid];
                }

                if (comparison.added.length) playersRes = window.electronAPI.sendSync('getData', `ngPlayer_${JSON.stringify(comparison.added.map(e => e))}`);

                if (playersRes && playersRes.data) {
                    if (playersRes.data.length) {
                        for (player of playersRes.data) {
                            if (player.xuid) playerListData[player?.xuid] = player;
                        }
                    } else if (playersRes.data.xuid) playerListData[playersRes.data.xuid] = playersRes.data;
                }

                let keys = Object.keys(playerListData).reverse();

                console.log(keys)

                statsTable.innerHTML = '';

                let rows = [];

                for (i = 0; i < keys.length; i++) {
                    try {
                        let pdata = playerListData[keys[i]];

                        if (!pdata) continue;

                        let tr = document.createElement('tr');

                        let pname = document.createElement('td');
                        let pwins = document.createElement('td');
                        let pkills = document.createElement('td');
                        let pkdr = document.createElement('td');
                        let pwlr = document.createElement('td');
                        let psmurf = document.createElement('td');

                        let ppfp = new Image(30, 30);

                        ppfp.src = pdata.avatar;

                        pname.appendChild(ppfp);

                        let levelString = pdata.formattedLevel;

                        let sections = levelString?.split('§');

                        if (sections) {
                            if (sections[0] != "") sections[0] = `f${sections[0]}`;

                            if (!sections.length) {
                                sections.push(`f${levelString}`);
                            }

                            for (j = 0; j < sections.length; j++) {
                                let realTxt = sections[j].slice(1);
                                let colorTxt = sections[j].slice(0, 1);
                                let levSpan = document.createElement('span');
                                levSpan.innerHTML = j == 0 ? `\u2002${realTxt}` : realTxt;
                                levSpan.style.color = mcColors.colorHex[mcColors.formats[colorTxt]];

                                pname.appendChild(levSpan);
                            }
                        }

                        let ignSpan = document.createElement('span');

                        ignSpan.innerHTML = `\u2002${pdata.name}`
                        pname.appendChild(ignSpan);

                        if (pdata.ranks.length) {
                            let imgRank = new Image(30, 30)

                            if (pdata.ranks.includes('Titan')) imgRank.src = 'https://i.imgur.com/zNfBZff.png'
                            else if (pdata.ranks.includes('Legend')) imgRank.src = 'https://i.imgur.com/PXTyJF9.png'
                            else if (pdata.ranks.includes('Emerald')) imgRank.src = 'https://i.imgur.com/Q3rmEqI.png'
                            else if (pdata.ranks.includes('Ultra')) imgRank.src = 'https://i.imgur.com/SpDvufR.png'
                            
                            if (imgRank.src) pname.appendChild(imgRank);
                        }

                        pwins.innerHTML = pdata.wins;
                        pkills.innerHTML = pdata.kills;
                        pkdr.innerHTML = pdata.kdr;
                        pwlr.innerHTML = pdata.wlr;
                        psmurf.innerHTML = (((window.electronAPI.sendSync('howSmurf', pdata)) * 100) + "%" ?? '??%');

                        tr.append(pname, pwins, pkills, pkdr, pwlr, psmurf);

                        if (blacklists.includes(pdata.name)) tr.style.setProperty('background-color', 'grey');

                        rows.push(tr);
                    } catch (e) {
                        console.error(e);
                    }
                }

                statsTable.append(...rows);
            }
        }
    }
})

const whenConClose = () => {
    inLobby = false;
    playerList = [];
    playerListData = {};
    o_playerList = [];

    statsTable.innerHTML = '';

    statsDiv.style.setProperty('display', 'none');
}

window.electronAPI.onLog((event, data) => {
    let fragments = data.split(' ');
    if (fragments[0] == 'Listening') {
        listening = data;
        start_listening(fragments);
    }
    if (fragments[0] == 'Connecting') return conStats.innerHTML = 'Connecting...';
    if (fragments[0] == 'Kicked') {
        if (data.includes("It's your first time joining. Please sign in and reconnect to join this server:") || data.includes('To sign in')) {
            logMsg2.innerHTML = data;
            logMsg2.style.setProperty('display', 'block');
            logMsg.style.setProperty('display', 'none');
            isConnectingAuth = true;
        }
        whenConClose();
        return conStats.innerHTML = 'Waiting for connection...';
    }
    if (data.includes('close connection') && !isConnectingAuth) {
        start_listening(listening.split(' '));
        whenConClose();
        return conStats.innerHTML = 'Waiting for connection...';
    }
    if (data.includes('player disconnected') && !isConnectingAuth) {
        start_listening(listening.split(' '));
        whenConClose();
        return conStats.innerHTML = 'Waiting for connection...';
    }
    if (data.includes('[msa] Signed in with Microsoft')) {
        logMsg.style.setProperty('display', 'block');
        logMsg2.style.setProperty('display', 'none');
        logMsg2.innerHTML = '';
        isConnectingAuth = false;
        return window.electronAPI.relay('restart')
    }
    if (data.includes('Connected to upstream server')) {
        logMsg.innerHTML = 'Waiting for player spawn...';

        inLobby = true;
        return conStats.innerHTML = 'Connected';
    }
})

window.electronAPI.onConfirm((event, data) => {
    if (data.data.response) {
        if (data.id == 'term_relay') {
            window.electronAPI.relay('stop')
        }
        if (data.id == 'term_program') {
            window.electronAPI.exit(0);
        }
    }
})

const start_listening = (fragments) => {
    termButton.style.setProperty('display', 'block');
    startButton.style.setProperty('display', 'none');
    conStats.innerHTML = 'Waiting for connection...';

    let suppVers = [];

    for (i in versionKeys) {
        if (versionKeys[i] == fragments[4].replace('\n', '')) suppVers.push(i);
    }

    if (!suppVers.length) suppVers.push(fragments[4] + '+');

    logMsg.style.setProperty('display', 'block');
    logMsg.style.setProperty('text-align', 'justify');
    logMsg2.style.setProperty('display', 'none');

    return logMsg.innerHTML = `Now proxying <code>${options.ip}:${options.port}</code> to<br><code>Server IP${('\u2002').repeat(2)}: ${fragments[2]}<br>Port${('\u2002').repeat(7)}: ${fragments[3]}<br>Version(s)${('\u2002').repeat(1)}: ${suppVers.join(', ')}</code>`
}

const start_relay = () => {
    window.electronAPI.relay('start');

    if (options.apiKey == '') window.electronAPI.getConfirm({
        data: {
            title: 'API key not found',
            type: 'warning',
            buttons: ['Okay'],
            message: "Not having an API key can cause rate-limiting. While it's still possible to use NG Stats without one, we recommend using it."
        },
        id: 'start_relay'
    })

    logMsg.innerHTML = 'Connecting...'

    startButton.setAttribute('disabled', '');
    startButton.style.setProperty('border-color', 'grey');
    startButton.style.setProperty('color', 'grey');

    root.style.setProperty('--startButtonHoverColor', '#808080');
}

const term_relay = () => {
    window.electronAPI.getConfirm({
        data: {
            title: 'Terminate Proxy',
            type: 'warning',
            buttons: ['Cancel', 'Terminate'],
            message: 'Are you sure you want to terminate the proxy? This will disconnect you from the server (If connected).'
        },
        id: 'term_relay'
    })
}

const clean_txt = (txt) => {
    return txt.replaceAll(/┬º./gm, '').replaceAll(/§./gm, '');
}

const controlOpt = (action) => {
    let setProperties = () => {
        optionPort.value = options.relayPort;
        updateSliderOpacity(options.winOpacity);
        checkBoxOnTop.checked = options.winOnTop;
        // checkBoxOnAutoStart.checked = options.autoStart;
        checkBoxAutoMin.checked = options.autoMin;
        serverRegion.value = options.region;
        optionAPIKey.value = options.apiKey;
        checkBoxClickthroughable.checked = options.ignoreMouse;
    }
    let close = () => {
        optsButton.style.setProperty('fill', 'white');
        root.style.setProperty('--isOptsOpen', 0);

        setProperties();

        optionPane.style.removeProperty('right');
        optionPane.style.setProperty('animation', 'optsOut 0.2s');
        optionPane.style.setProperty('animation-timing-function', 'ease');
        optionPane.style.setProperty('animation-fill-mode', 'forwards');
    }

    let open = () => {
        optsButton.style.setProperty('fill', '#ef963f')
        root.style.setProperty('--isOptsOpen', 1);

        setProperties();

        optionPane.style.removeProperty('left');
        optionPane.style.setProperty('animation', 'optsIn 0.2s');
        optionPane.style.setProperty('animation-timing-function', 'ease');
        optionPane.style.setProperty('animation-fill-mode', 'forwards');
    }

    if (action == 'auto') {
        if (rootStyles.getPropertyValue('--isOptsOpen') == 1) close();
        else open();
    } else if (action == 'close') close();
    else if (action == 'open') open();
}

const opt = () => {
    controlFaq('close');
    controlContributors('close');
    controlOpt('auto');
};

const opts_cancel = () => {
    controlOpt('close');
}

const opts_save = () => {
    // validate
    if (!(/^\d+$/.test(optionPort.value)) || optionPort.value < 1 || optionPort.value > 65535) return window.electronAPI.getConfirm({
        data: {
            title: 'Invalid proxy port',
            type: 'error',
            message: 'Proxy port must be between 1-65535.'
        },
        id: 'opts_save'
    })

    window.electronAPI.sendData({
        title: 'options.json',
        data: {
            region: serverRegion.value,
            ip: `${serverRegion.value}.nethergames.org`,
            port: 19132,
            relayIp: "127.0.0.1",
            relayPort: parseInt(optionPort.value),
            // autoStart: checkBoxOnAutoStart.checked,
            autoMin: checkBoxAutoMin.checked,
            winOpacity: sliderInputParent.value,
            winOnTop: checkBoxOnTop.checked,
            apiKey: optionAPIKey.value,
            ignoreMouse: checkBoxClickthroughable.checked
        }
    })

    options = window.electronAPI.sendSync('getData', 'options.json').data;

    on_top(options.winOnTop);
    cleanMode(options.ignoreMouse);

    controlOpt('close');
}

const open_blacklist = () => window.electronAPI.openBlacklist();

const controlFaq = (action) => {
    let close = () => {
        faqButton.style.setProperty('fill', 'white');
        root.style.setProperty('--isFaqOpen', 0);

        faqPane.style.removeProperty('right');
        faqPane.style.setProperty('animation', 'optsOut 0.2s');
        faqPane.style.setProperty('animation-timing-function', 'ease');
        faqPane.style.setProperty('animation-fill-mode', 'forwards');
    }

    let open = () => {
        faqButton.style.setProperty('fill', '#55e5ff')
        root.style.setProperty('--isFaqOpen', 1);

        faqPane.style.removeProperty('left');
        faqPane.style.setProperty('animation', 'optsIn 0.2s');
        faqPane.style.setProperty('animation-timing-function', 'ease');
        faqPane.style.setProperty('animation-fill-mode', 'forwards');
    }

    if (action == 'auto') {
        if (rootStyles.getPropertyValue('--isFaqOpen') == 1) close();
        else open();
    } else if (action == 'close') close();
    else if (action == 'open') open();
}

const controlContributors = (action) => {
    let close = () => {
        contributorsButton.style.setProperty('fill', 'white');
        root.style.setProperty('--isContributorsOpen', 0);

        contributorsPane.style.removeProperty('right');
        contributorsPane.style.setProperty('animation', 'optsOut 0.2s');
        contributorsPane.style.setProperty('animation-timing-function', 'ease');
        contributorsPane.style.setProperty('animation-fill-mode', 'forwards');
    }

    let open = () => {
        contributorsButton.style.setProperty('fill', '#81d481')
        root.style.setProperty('--isContributorsOpen', 1);

        contributorsPane.style.removeProperty('left');
        contributorsPane.style.setProperty('animation', 'optsIn 0.2s');
        contributorsPane.style.setProperty('animation-timing-function', 'ease');
        contributorsPane.style.setProperty('animation-fill-mode', 'forwards');
    }

    if (action == 'auto') {
        if (rootStyles.getPropertyValue('--isContributorsOpen') == 1) close();
        else open();
    } else if (action == 'close') close();
    else if (action == 'open') open();
}

const faq = () => {
    controlOpt('close');
    controlContributors('close');
    controlFaq('auto');
}

const contributors = () => {
    controlFaq('close');
    controlContributors('auto');
    controlOpt('close');
}

const openPortalAPI = () => window.electronAPI.openPortalAPI();