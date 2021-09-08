"use strict";

// Imports
const fs = require("fs");

// Variables
let areg = new RegExp(fs.readFileSync("src/areg.txt").toString(), "g");
let ereg = new RegExp(fs.readFileSync("src/ereg.txt").toString(), "g");

function stringWidth(s) {
    if(typeof s !== "string") throw new TypeError("Argument is not a string");
    if(s.length === 0) return 0;
    let com = (n, a, b) => n >= a && n <= b;
    let ps = s.replace(areg, "").replace(ereg, "  ");
    if(ps.length === 0) return 0;
    let w = 0;
    for(let i = 0; i < ps.length; i++) {
        let c = ps.codePointAt(i);
        if(c <= 0x1F || com(c, 0x7f, 0x9F) || com(c, 0x300, 0x36F)) continue;
        else if(c > 0xFFFF) i++;
        if(c < 0x1100 || c === 0x303F) w++;
        else if(c <= 0x115F || c === 0x2329 || c === 0x232A || [
            [ 0x2E80, 0x3247 ],
            [ 0x3250, 0x4DBF ],
            [ 0x4E00, 0xA4C6 ],
            [ 0xA960, 0xA97C ],
    		[ 0xAC00, 0xD7A3 ],
            [ 0xF900, 0xFAFF ],
            [ 0xFE10, 0xFE19 ],
            [ 0xFE30, 0xFE6B ],
            [ 0xFF01, 0xFF60 ],
            [ 0xFFE0, 0xFFE6 ],
            [ 0x1B000, 0x1B001 ],
            [ 0x1F200, 0x1F251 ],
            [ 0x20000, 0x3FFFD ]
        ].some(a => com(c, ...a) === true)) w += 2;
        else w++;
    };
    return w;
};

// Exports
module.exports = stringWidth;