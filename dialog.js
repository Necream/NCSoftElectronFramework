const { dialog } = require('electron');

function showAlert(message,callback) {
    sendMessageToMain(message);
    callback();
}