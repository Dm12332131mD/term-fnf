"use strict";

// Imports
const Events = require("events");
const readline = require("readline");

// Class
class Terminal extends Events {
    constructor(stdin, stdout) {
        super();
        this.chart = null
        this.chartTimeout = null;
        this.createdTimestamp = Date.now();
        this.delays = null;
        this.length = null;
        this.playedTimestamp = null;
        this.score = null;
        this.stdin = stdin;
        this.stdout = stdout;
        if(this.stdin.isTTY) {
            this.stdout.write("\x1b[?25l")
            this.stdin.setRawMode(true);
        }
        else throw new Error("Terminal is not a TTY");
        readline.emitKeypressEvents(this.stdin);
        this.stdin.on("keypress", (s, k) => super.emit("key", s, k));
        this.stdout.on("resize", () => super.emit("resize", this.height, this.width));
    };

    clear() {
        this.write(`${" ".repeat(this.width)}\n`.repeat(this.height));
    };

    cursorMove(x, y) {
        this.stdout.cursorTo(x, y);
    };

    get elapsed() {
        if(this.playedTimestamp === null) return 0;
        return Date.now() - this.playedTimestamp;
    };

    end(force) {
        if(!this.chart) throw new Error("No chart is currently playing");
        if(this.chartTimeout) clearTimeout(this.chartTimeout);
        if(!force) this.emit("chartEnd", this.chart);
        this.chart = null
        this.chartTimeout = null;
        this.delays = null;
        this.length = null;
        this.playedTimestamp = null;
        this.score = null;
    };

    get height() {
        return this.stdout.rows;
    };

    start(chart, force) {
        if(this.chart) throw new Error("A chart is already playing");
        this.chart = JSON.parse(JSON.stringify(chart));
        this.delays = [];
        this.length = Math.max(...this.chart.channels.flat());
        this.playedTimestamp = Date.now();
        this.score = 0;
        this.chartTimeout = setTimeout(() => this.end(), this.length + 5000);
        if(!force) this.emit("chartStart", this.chart);
    };

    get uptime() {
        return Date.now() - this.createdTimestamp;
    };

    get width() {
        return this.stdout.columns;
    };

    write(content) {
        if(typeof content !== "string") throw new TypeError("Argument is not a string");
        this.stdout.write(content);
    };
};

// Exports
module.exports = Terminal;