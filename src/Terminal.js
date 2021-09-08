// Imports
const Events = require("events");
const readline = require("readline");

// Class
class Terminal extends Events {
    constructor(stdin, stdout) {
        super();
        this.chart = null;
        this.createdTimestamp = Date.now();
        this.createdTimestamp = null;
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
        this.write("\n".repeat(this.height));
    };

    cursorMove(x, y) {
        this.stdout.cursorTo(x, y);
    };

    get elapsed() {
        if(this.playedTimestamp === null) return 0;
        return Date.now() - this.playedTimestamp;
    };

    get height() {
        return this.stdout.rows;
    };

    play(chart) {
        if(this.chart) throw new Error("A chart is already playing");
        this.chart = JSON.parse(JSON.stringify(chart));
        this.playedTimestamp = Date.now();
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