// Imports
const keys = require("./keys.json");

// Variables
let compare = (a, b) => a === null || b === null || a === b;

// Function
function parseKey(s, k) {
    if(s && /[a-z0-9]+/i.test(s)) return s;
    else return Object.keys(keys).find(n => {
        let p = keys[n];
        return compare(p.ctrl, k.ctrl) &&
            compare(p.shift, k.shift) &&
            compare(p.meta, k.meta) &&
            compare(p.name, k.name);
    }) ?? null;
};

// Exports
module.exports = parseKey;