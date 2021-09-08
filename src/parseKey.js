"use strict";

// Imports
const keys = require("./keys.json");

// Variables
let compare = (a, b) => a === null || b === null || a === b;

// Function
function parseKey(s, k) {
    let key = Object.keys(keys).find(n => {
        let p = keys[n];
        return compare(p.ctrl, k.ctrl) &&
            compare(p.shift, k.shift) &&
            compare(p.meta, k.meta) &&
            compare(p.name, k.name);
    });
    if(key) return key;
    else if(s && /[a-z0-9]+/i.test(s)) return s;
    else null;
};

// Exports
module.exports = parseKey;