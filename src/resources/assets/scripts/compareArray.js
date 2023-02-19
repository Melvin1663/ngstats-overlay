module.exports = (arr_a, arr_b) => {
    // a - before
    // b - after

    const res = {
        added: [],
        deleted: [],
        changed: false
    }

    try {
        for (i = 0; i < arr_a.length; i++) {
            if (!arr_b.find(e => e[1] == arr_a[i][1])) res.deleted.push(arr_a[i]);
        }

        for (i = 0; i < arr_b.length; i++) {
            if (!arr_a.find(e => e[1] == arr_b[i][1])) res.added.push(arr_b[i]);
        }

        if (res.added.length || res.deleted.length) res.changed = true;
    } catch (e) {}

    return res;
}