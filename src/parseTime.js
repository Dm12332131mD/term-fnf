"use strict";

// Variables
let pad = v => `${v}`.padStart(2, "0");

// Function
function parseTime(v) {
    if(isNaN(v)) throw new TypeError("Argument is not a number");
    let pv = parseInt(+v / 1000);
    if(pv < 0) throw new TypeError("Argument must be positive");
    return `${pv >= 3600 ? `${Math.floor(pv / 3600)}:` : ""}${pad(Math.floor(pv / 60) % 60)}:${pad(pv % 60)}`;
};

// Exports
module.exports = parseTime;