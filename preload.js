// 您也可以使用 `contextBridge` API
// 将这段代码暴露给渲染器进程
const { ipcRenderer } = require('electron');
// ipcRenderer.on('asynchronous-reply', (_event, arg) => {
//   console.log(arg) // 在 DevTools 控制台中打印“pong”
// })
// ipcRenderer.send('asynchronous-message', 'ping')