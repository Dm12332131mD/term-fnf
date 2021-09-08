// Imports
const dpaint = require("@dmmdjs/dmmd.js/dpaint/exports.js");
const fs = require("fs");
const net = require("net");
const Package = require("./src/Package.js");

// Variables
let serverLog = fs.createWriteStream("serverLog.txt");
let [ node, path, host, port, ...argv ] = process.argv, server = null, connections = [];

// Server
if(net.isIP(host) && !isNaN(port)) {
    server = net.createServer(connection => {
        log("connect", connection);
        connections.push(connection);
        connection.on("data", data => broadcast(connection, data.toString()));
        connection.on("error", error => {
            log("error", error);
            connection.end();
            connections.splice(connections.findIndex(c => c === connection), 1);
        });
        connection.on("end", () => {
            log("disconnect", connection);
            connections.splice(connections.findIndex(c => c === connection), 1);
            console.log(connections)
        });
    });
    server.listen(port, host, () => log("listen", host, port));
}
else {
    console.log(dpaint.red(`Unknown host or port: ${host}:${port}`));
    process.exit();
};

// Functions
function broadcast(connection, data) {
    connections.forEach(c => {
        if(!Object.is(connection, c)) c.write(data);
    });
};

function log(type, ...data) {
    let date = new Date().toLocaleString();
    switch(type) {
        case "connect": {
            let message = `${date} | New Connection`;
            console.log(dpaint.yellow(message));
            serverLog.write(`${message}\n`);
            break;
        };
        case "disconnect": {
            let message = `${date} | Connection ended`;
            console.log(dpaint.yellow(message));
            serverLog.write(`${message}\n`);
            break;
        };
        case "error": {
            console.log(dpaint.red(`${date} | An error occurred: ${data[0].message}`));
            serverLog.write(`${date} | Error: ${data[0].message}\n${data[0]}\n`);
            break;
        };
        case "listen": {
            let message = `${date} | Server listening on ${data[0]}:${data[1]}`;
            console.log(dpaint.cyan(message));
            serverLog.write(`${message}\n`);
            break;
        };
    };
};