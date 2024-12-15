const {EventEmitter} = require('events');
const eventEmitter = new EventEmitter();

const {contextBridge} = require('electron');

contextBridge.exposeInMainWorld('myEmitter', eventEmitter);