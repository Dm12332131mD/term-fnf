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
let chartIndex = 0, chartScroll = 0;
let directions = [ "LEFT", "DOWN", "UP", "RIGHT" ];
let mode = "MENU";
let multiplayer = false;
let socket = null;
let terminal = new Terminal(process.stdin, process.stdout);
let [ node, path, host, port, ...argv ] = process.argv;

// Multiplayer
if(net.isIP(host) && !isNaN(port)) {
    socket = net.createConnection({ host, port });
    socket.on("data", data => {
        let packet = Packet.unpack(data.toString());
        if(packet.status === "CONNECT") terminal.isServerHost = packet.isServerHost;
        else if(packet.status === "START") {
            terminal.start(packet.chart, true);
            mode = "GAME";
        }
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
if(!config.username) {
    console.log(dpaint.red(`Username is not set! Please edit your username in config.json`));
    process.exit();
};
if(config.username.length > 16) {
    console.log(dpaint.red(`Username is too long! Please edit your username in config.json`));
    process.exit();
};
if(charts.length === 0) {
    console.log(dpaint.red(`No charts available!`));
    process.exit();
};

// Key event
terminal.on("key", (s, k) => {
    let key = parseKey(s, k);
    if(key === "EXIT") process.exit();
    else if(key === "SPACE" && mode === "END") {
        terminal.clear();
        mode = "MENU";
    }
    else if(key === "SPACE" && mode === "MENU") {
        if(multiplayer && !terminal.isServerHost) return;
        mode = "GAME";
        terminal.start(charts[chartIndex]);
        chartIndex = 0;
        chartScroll = 0;
    }
    else if([ "UP", "DOWN" ].includes(key) && mode === "MENU") {
        terminal.clear();
        if(key === "UP") chartIndex--;
        else if(key === "DOWN") chartIndex++;
        chartIndex = Math.max(Math.min(chartIndex, charts.length - 1), 0);
        if(chartIndex >= chartScroll + 5) chartScroll++;
        else if(chartIndex < chartScroll) chartScroll--;
    }
    else if(directions.includes(key) && terminal.chart && mode === "GAME") {
        let index = directions.findIndex(v => v === key);
        let channel = terminal.chart.channels[index];
        let delay = channel[0] - terminal.elapsed, absDelay = Math.abs(delay);
        terminal.cursorMove(index * 3, 1);
        terminal.write(dpaint.hex("  ", config.arrows[key].active, true));
        if(channel.length === 0 || delay > 250) {
            terminal.delays.push(250);
            terminal.score -= 1000;
            terminal.cursorMove(14, 1);
            terminal.write(dpaint.hex(`MISS!          `, "#777777"));
        }
        else {
            terminal.delays.push(absDelay);
            channel.shift();
            terminal.score += (250 - absDelay) * 4;
            terminal.cursorMove(14, 1);
            if(absDelay === 0) terminal.write(dpaint.hex(`GOD! | ${delay}ms          `, "#33FFFF"));
            else if(absDelay <= 50) terminal.write(dpaint.hex(`PERFECT! | ${delay}ms          `, "#FFFF33"));
            else if(absDelay <= 100) terminal.write(dpaint.hex(`Good! | ${delay}ms          `, "#3333FF"));
            else if(absDelay <= 150) terminal.write(dpaint.hex(`OK! | ${delay}ms          `, "#33FF33"));
            else if(absDelay <= 250) terminal.write(dpaint.hex(`BAD! | ${delay}ms          `, "#FF7777"));
        };
        setTimeout(() => {
            terminal.cursorMove(index * 3, 1);
            terminal.write(dpaint.hex("  ", config.arrows[key].inactive, true));
        }, 50);
    };
});

// Chart start
terminal.on("chartStart", (chart, silent) => {
    if(!silent && multiplayer) {
        socket.write(Packet.pack({
            chart,
            length: terminal.length,
            playedTimestamp: terminal.playedTimestamp,
            status: "START",
            username: config.username
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
terminal.on("chartEnd", silent => {
    mode = "END";
    terminal.clear();
    if(!silent && multiplayer) {
        socket.write(Packet.pack({
            chart: terminal.chart,
            delays: terminal.delays,
            length: terminal.length,
            playedTimestamp: terminal.playedTimestamp,
            score: terminal.score,
            status: "END",
            username: config.username
        }));
        terminal.cursorMove(0, 0);
        terminal.write(dpaint.hex("Please wait...", "#777777"));
    }
    else {
        terminal.cursorMove(0, 0);
        terminal.write(dpaint.trueCyan("RESULTS\n\n"));
        terminal.write(`Score: ${terminal.score}\n`);
        terminal.write(`Average: ${Math.floor(terminal.delays.reduce((a, c) => a + c) / terminal.delays.length)}ms\n\n`);
        terminal.write(dpaint.trueYellow("Press [ SPACE ] to Return"));
    };
});

// Update
setInterval(() => {
    if(mode === "MENU") {
        let chartList = [];
        for(let i = 0; i < 5; i++) {
            if(chartScroll + i >= charts.length) chartList.push("");
            else {
                let message = `${charts[chartScroll + i].name} - ${charts[chartScroll + i].author}`;
                if(chartScroll + i === chartIndex) chartList.push(dpaint.trueYellow(message));
                else chartList.push(message);
            };
        };
        terminal.cursorMove(0, 0);
        terminal.write([
            dpaint.trueCyan("Choose a Song"), "",
            dpaint.hex("====================", "#777777"),
            ...chartList,
            dpaint.hex("====================", "#777777"),
            dpaint.trueYellow("Press [ SPACE ] to Start")
        ].join("\n"));
    }
    else if(mode === "GAME" && terminal.chart) {
        terminal.cursorMove(0, 0);
        terminal.write([
            dpaint.trueCyan(`${terminal.chart.name} - ${terminal.chart.author}`),
            dpaint.trueCyan(`${parseTime(terminal.elapsed)} - ${parseTime(terminal.length + 5000)}`),
            dpaint.trueCyan(`Score: ${terminal.score}`)
        ].join(dpaint.hex(" | ", "#777777")));
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
                        terminal.cursorMove(14, 1);
                        terminal.write(dpaint.hex(`MISS!          `, "#777777"));
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
        }
    };
}, 33);