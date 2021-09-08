"use strict";

// Imports
const config = require("./config.json");
const dpaint = require("@dmmdjs/dmmd.js/dpaint/exports.js");
const fs = require("fs");
const net = require("net");
const Packet = require("./src/Packet.js");
const parseKey = require("./src/parseKey.js");
const parseTime = require("./src/parseTime.js");
const Terminal = require("./src/Terminal.js");

// Variables
let charts = fs.readdirSync("charts/").map(f => require(`./charts/${f}`));
let directions = [ "LEFT", "DOWN", "UP", "RIGHT" ];
let multiplayer = false;
let socket = null;
let terminal = new Terminal(process.stdin, process.stdout);
let [ node, path, host, port, ...argv ] = process.argv;

// Multiplayer
if(net.isIP(host) && !isNaN(port)) {
    socket = net.createConnection({ host, port });
    socket.on("data", data => {
        let packet = Packet.unpack(data.toString());
        if(packet.status === "START") terminal.start(packet.chart, true);
        else if(packet.status === "END") {

        }
        else if(packet.status === "ERROR") {
            console.clear();
            console.log(dpaint.red(`An unexpected error occurred!\nPlease send the following to the developer:\n${packet.message}`));
            process.exit();
        };
    });
    socket.on("error", error => {
        console.clear();
        console.log(dpaint.red(`An unexpected error occurred!\nPlease send the following to the developer:\n${error}`));
        process.exit();
    });
    socket.on("timeout", () => {
        console.log(dpaint.red(`Cannot connect to the server`));
        process.exit();
    });
    multiplayer = true;
};

// Set up
terminal.clear();
terminal.cursorMove(0, 0);

// Key event
terminal.on("key", (s, k) => {
    let key = parseKey(s, k);
    if(key === "EXIT") process.exit();
    else if(key === "SPACE" && !terminal.chart) terminal.start(charts[0]);
    else if(directions.includes(key) && terminal.chart) {
        let index = directions.findIndex(v => v === key);
        let channel = terminal.chart.channels[index];
        let delay = channel[0] - terminal.elapsed, absDelay = Math.abs(delay);
        terminal.cursorMove(index * 3, 1);
        terminal.write(dpaint.hex("  ", config.arrows[key].active, true));
        if(channel.length === 0 || delay > 250) {
            terminal.delays.push(250);
            terminal.score -= 1000;
        }
        else {
            terminal.delays.push(absDelay);
            channel.shift();
            if(absDelay <= 50) terminal.score += 1000;
            else if(absDelay <= 100) terminal.score += 500;
            else if(absDelay <= 150) terminal.score += 250;
            else terminal.score += 100;
        };
        setTimeout(() => {
            terminal.cursorMove(index * 3, 1);
            terminal.write(dpaint.hex("  ", config.arrows[key].inactive, true));
        }, 50);
    };
});

// Chart start
terminal.on("chartStart", chart => {
    if(multiplayer) {
        socket.write(Packet.pack({
            chart,
            length: terminal.length,
            playedTimestamp: terminal.playedTimestamp,
            status: "START"
        }));
    };
    terminal.clear();
    terminal.cursorMove(0, 1);
    terminal.write([
        dpaint.hex("  ", config.arrows.LEFT.inactive, true),
        dpaint.hex("  ", config.arrows.DOWN.inactive, true),
        dpaint.hex("  ", config.arrows.UP.inactive, true),
        dpaint.hex("  ", config.arrows.RIGHT.inactive, true)
    ].join(" "));
});

// Chart end
terminal.on("chartEnd", chart => {
    if(multiplayer) {
        socket.write(Packet.pack({
            chart,
            delays: terminal.delays,
            length: terminal.length,
            playedTimestamp: terminal.playedTimestamp,
            score: terminal.score,
            status: "END"
        }));
    }
    else {
        terminal.clear();
        terminal.cursorMove(0, 0);
        terminal.write("Congradulations!");
    };
});

// Update
setInterval(() => {
    if(terminal.chart) {
        terminal.cursorMove(0, 0);
        terminal.write([
            `${terminal.chart.name} - ${terminal.chart.author}`,
            `${parseTime(terminal.elapsed)} - ${parseTime(terminal.length + 5000)}`,
            `${terminal.score}`
        ].join(" | "));
        for(let i = 2; i < terminal.height; i++) {
            for(let j = 0; j < 4; j++) {
                let channel = terminal.chart.channels[j];
                let slot = Math.floor(terminal.elapsed / 100) + i;
                terminal.cursorMove(j * 3, i);
                for(let index in channel) {
                    let arrow = channel[index];
                    if(arrow - terminal.elapsed < -200) {
                        terminal.delays.push(250);
                        terminal.score -= 1000;
                        channel.splice(index, 1);
                    };
                };
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