module.exports = (text) => {
    return text.split('\n').map(e => e.replaceAll('\r', '').trim());
}