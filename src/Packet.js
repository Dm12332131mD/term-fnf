"use strict";

// Class
class Packet extends null {
    static isJSON(v) {
        try {
            JSON.parse(v);
            return true;
        }
        catch {
            return false;
        };
    };

    static pack(v) {
        if(typeof v !== "object") throw new TypeError("Argument is not a string");
        return JSON.stringify(v);
    };
    
    static unpack(v) {
        if(!Packet.isJSON(v)) throw new TypeError("Argument is not a valid JSON");
        return JSON.parse(v);
    };
};

// Exports
module.exports = Packet;