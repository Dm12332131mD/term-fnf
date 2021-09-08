// Imports
const config = require("./config.json");
const dpaint = require("@dmmdjs/dmmd.js/dpaint/exports.js");
const fs = require("fs");
const net = require("net");
const Package = require("./src/Package.js");
const parseKey = require("./src/parseKey.js");
const Terminal = require("./src/Terminal.js");

// Variables
let charts = fs.readdirSync("charts/").map(f => require(`./charts/${f}`));
let multiplayer = false;
let socket = null;
let terminal = new Terminal(process.stdin, process.stdout);
let [ node, path, host, port, ...argv ] = process.argv;

// Multiplayer
if(net.isIP(host) && !isNaN(port)) {
    socket = net.createConnection({ host, port });
    socket.on("data", data => {
        let package = Package.unpack(data.toString());
        console.log(package)
    });
    socket.on("error", error => {
        console.log(dpaint.red(`An unexpected error occurred!\nPlease send the following to the developer:\n${error}`));
        process.exit();
    });
    socket.on("timeout", () => {
        console.log(dpaint.red(`Cannot connect to the server`));
        process.exit();
    });
    multiplayer = true;
};

// Set Up
terminal.clear();
terminal.cursorMove(0, 0);
terminal.write([
    dpaint.hex("  ", config.arrows.LEFT.inactive, true),
    dpaint.hex("  ", config.arrows.DOWN.inactive, true),
    dpaint.hex("  ", config.arrows.UP.inactive, true),
    dpaint.hex("  ", config.arrows.RIGHT.inactive, true)
].join(" "));
terminal.play(charts[0]);

// Key event
terminal.on("key", (s, k) => {
    let key = parseKey(s, k);
    if(key === "EXIT") process.exit();
    else if([ "UP", "RIGHT", "DOWN", "LEFT" ].includes(key)) {
        if(!terminal.chart) return;
        switch(key) {
            case "LEFT": {
                terminal.cursorMove(0, 0);
                terminal.write(dpaint.hex("  ", config.arrows.LEFT.active, true));
                setTimeout(() => {
                    terminal.cursorMove(0, 0);
                    terminal.write(dpaint.hex("  ", config.arrows.LEFT.inactive, true));
                }, 50);
                break;
            };
            case "DOWN": {
                terminal.cursorMove(3, 0);
                terminal.write(dpaint.hex("  ", config.arrows.DOWN.active, true));
                setTimeout(() => {
                    terminal.cursorMove(3, 0);
                    terminal.write(dpaint.hex("  ", config.arrows.DOWN.inactive, true));
                }, 50);
                break;
            };
            case "UP": {
                terminal.cursorMove(6, 0);
                terminal.write(dpaint.hex("  ", config.arrows.UP.active, true));
                setTimeout(() => {
                    terminal.cursorMove(6, 0);
                    terminal.write(dpaint.hex("  ", config.arrows.UP.inactive, true));
                }, 50);
                break;
            };
            case "RIGHT": {
                terminal.cursorMove(9, 0);
                terminal.write(dpaint.hex("  ", config.arrows.RIGHT.active, true));
                setTimeout(() => {
                    terminal.cursorMove(9, 0);
                    terminal.write(dpaint.hex("  ", config.arrows.RIGHT.inactive, true));
                }, 50);
                break;
            };
        };
    };
});

// Update
setInterval(() => {
    if(terminal.chart) {
        for(let i = 1; i < terminal.height; i++) {
            for(let j = 0; j < 4; j++) {
                terminal.cursorMove(j * 3, i);
                let channel = terminal.chart.channels[j], slot = Math.floor(terminal.elapsed / 100) + i;
                if(channel.some(v => Math.floor(v / 100) === slot)) {
                    switch(j) {
                        case 0: {
                            terminal.write(dpaint.hex("  ", config.arrows.LEFT.arrow, true));
                            break;
                        };
                        case 1: {
                            terminal.write(dpaint.hex("  ", config.arrows.DOWN.arrow, true));
                            break;
                        };
                        case 2: {
                            terminal.write(dpaint.hex("  ", config.arrows.UP.arrow, true));
                            break;
                        };
                        case 3: {
                            terminal.write(dpaint.hex("  ", config.arrows.RIGHT.arrow, true));
                            break;
                        };
                    };
                }
                else terminal.write("  ");
            };
        };
    };
}, 33);