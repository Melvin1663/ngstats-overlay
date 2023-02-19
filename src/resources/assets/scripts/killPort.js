const { execSync } = require('child_process');

module.exports = (port) => {
    let res = execSync('netstat -a -n -o', { encoding: 'utf-8' }).split('\r\n').filter(e => e.includes(port));

    if (res.length) {
        res = res[0].split(' ')[res[0].split(' ').length - 1];
        try {
            return execSync(`taskkill /PID ${res} /F`, { encoding: 'utf-8' });
        } catch (e) {
            console.log(e);
        }
    } else return 'No process found for port. Continuing...'
}