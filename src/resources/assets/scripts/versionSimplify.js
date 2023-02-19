module.exports = (ver) => {
    if (ver.startsWith('1.16')) return ver.slice(0, 8)
    else if (parseInt(ver.split('.')[1]) > 16) {
        let fragments = ver.split('.');
        fragments.pop();
        let final = [];

        if ([1, 2].includes(fragments[2]?.length)) {
            fragments.splice(2, 0, '0');
            final.push(...fragments)
        } else if ([3, 4].includes(fragments[2].length)) {
            let length = fragments[2].length;
            let patch = fragments[2].slice(length == 3 ? 1 : 2, length == 3 ? 3 : 4);
            fragments[2] = length == 3 ? fragments[2][0] : fragments[2].slice(0, 2);
            fragments.push(parseInt(patch).toString());
            final.push(...fragments);
        }

        return final.join('.')
    } else return null;
}