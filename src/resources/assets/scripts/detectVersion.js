const { execSync } = require('child_process');

module.exports = () => {
    let res = execSync('powershell -command "Get-AppxPackage -Name Microsoft.MinecraftUWP | Format-List -Property Version"', { encoding: 'utf-8' }).replaceAll('\r\n', '');
    if (res.length) {
        res = res.split(' ')[res.split(' ').length - 1];
        return `Detected version ${res}`;
    } else return 'Minecraft is not installed. Aborting...'
}