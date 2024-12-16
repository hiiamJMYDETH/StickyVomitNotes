const express = require('express');
const app = express();
const {ipcMain} = require('electron');
const fs = require('fs');

ipcMain.on('create-file', (event, fileName, content) => {
  fs.writeFile(fileName, content, (err) => {
    if (err) {
      console.error('Error creating file:', err);
      event.reply('create-file-reply', 'Failed to create file.');
    } else {
      console.log(`File "${fileName}" created successfully.`);
      event.reply('create-file-reply', 'File created successfully.');
    }
  });
});

module.exports = app;