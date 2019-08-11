// name: simple-logger
// version: 0.0.1
// http://github.com/quirkey/node-logger
// forked by Garrett Morris
/*
Copyright (c) 2010 Aaron Quint, 2019 Garrett Morris
Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:
The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/

const colors = require('colors/safe');
const util = require('util');

function isFormattableString( args ) {
    // console.log(args);
    if(!args.length) return false;
    if(typeof args[0] !== 'string') return false;
    if( args[0].includes('%s') || args[0].includes('%d') || args[0].includes('%i') || args[0].includes('%f') || args[0].includes('%j') || args[0].includes('%o') || args[0].includes('%O') ) {
        return true;
    }
    return false;
}

class Logger {

    constructor(options={log_level='debug',transports=['console']}) {

        this.levels = ['emerg','alert','crit','error','warning','notice','info','debug'];
        this.colors = ['red','red','red','red','yellow','cyan','cyan','green']; //colors match up to levels
        this.setLevel(options.log_level);
        this.setTransports(pptions.transports);
        
    }

    setLevel(new_level) {
        var index = this.levels.indexOf(new_level);
        return (index != -1) ? this.log_level_index = index : false;
    }

    setTransports(transports) {
        if(!Array.isArray(transports)){
            throw new Error('transports must be an array.');
        }
        this.transports = transports.map(transport=>{
            if(typeof transport==='string') {
                try {
                    var Transport = require('./transports/'+transport);
                    return new Transport;
                }
                catch(err){
                    throw new Error('Unknown built-in transport named `'+transport+'`. ');
                }
            }
            if(typeof transport === 'object') {
                if(transport.write && typeof transport.write==='function'){
                    return transport;
                }else{
                    throw new Error('invalid transport provided ('+transport.name+'). Transports must be an object with a function called `write`');
                }
            }
        })
    }

    write(text) {
        this.transports.forEach(transport=>transport.write(text));
    }

    format(level, date, message) {
        // console.log(level);
        return [ colors[ this.colors[this.levels.indexOf(level)] ](level), ' [', date, '] ', message].join('');
    }

    log(...args) {
        // console.log(Array.isArray(args));
        if(!args.length){
            return;
        }
        const log_index = this.levels.indexOf(args[0]);
        let message = '';

        // if you're just default logging
        if (log_index === -1) { 
            log_index = 7; 
        } else {
            // the first argument actually was the log level
            args.shift();
        }
        if (log_index <= this.log_level_index) {
            if( isFormattableString(args) ) {
                // console.log('logger: formatting message');
                message = util.format(...args);
            }else{
                // join the arguments into a loggable string
                args.forEach(arg=> {
                    if (typeof arg === 'string') {
                        message += ' ' + arg;
                    } else {
                        message += ' ' + util.inspect(arg, false, null);
                    }
                });
            }
            
            message = this.format(this.levels[log_index], new Date(), message);
            this.write(message + "\n");
            return message;
        }
        return false;
    }

}

function createLogger(options={}) {
    const logger = new Logger(options);
    const log = (...args) => {
        logger.log('info',...args);
    };
    log.logger = logger;

    logger.levels.forEach(level=>{
        log[level] = (...args) => logger.log(level,...args);
    })  
    return log;  
}

var old = {};
var isWrapped = false;

function wrapConsole( logger ) {
    if(!isWrapped) {
        var c = global.console;
        old.log = c.log;
        old.warn = c.warn;
        old.error = c.error;
        old.info = c.info;
        c.log = logger.info;
        c.warn = logger.warning;
        c.error = logger.error;
        c.info = logger.info;
        isWrapped = true;
    }
}

function unwrapConsole() {
    if(isWrapped) {
        var c = global.console;
        c.log = old.log;
        c.warn = old.warn;
        c.error = old.error;
        c.info = old.info;
        old = {};
        isWrapped = false;
    }
}


module.exports = {createLogger,Logger,wrapConsole,unwrapConsole,isFormattableString};