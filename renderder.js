const {ipcRenderer} = require('electron');
function sendMessageToMain(message){
    console.log('Has been sent.');
    ipcRenderer.send('message-from-renderer', message);
}

Array.prototype.toString = function() {
    return this.join('');
}

const commands=["SetMessageBalloonState ","ShowMessageBalloonStateUI","NOOPERATION_OK","filedata "];

function compareoperation(data){
    var isthis=[];
    for(var i=0;i<commands.length;i++){
        isthis.push(true);
    }
    var num=isthis.length;
    var i=0;
    var nomoreaction=false;
    for(;;i++){
        for(var j=0;j<commands.length;j++){
            if(i>=commands[j].length){
                for(var i=0;i<commands.length;i++){
                    if(i==j) continue;
                    isthis[i]=false;
                }
                nomoreaction=true;
            }
            if(nomoreaction) break;
            if(isthis[j]&&commands[j][i]!==data[i]){
                isthis[j]=false;
                num--;
            }
        }
        if(num<=1) nomoreaction=true;
        if(nomoreaction) break;
    }
    var commandid=-1;
    for(var i=0;i<commands.length;i++){
        if(isthis[i]) commandid=i;
    }
    if(commandid==-1) return [-1,data];
    var operation=[];
    for(var i=commands[commandid].length;i<data.length;i++) operation.push(data[i]);
    operation=operation.toString();
    return [commandid,operation];
}

ipcRenderer.on('message-from-main', function(event, arg) {
    console.log(arg);
    window.ipcReceive=arg;
    var operation=compareoperation(arg);
    if(operation[0]==0){    // SetMessageBalloonState
        console.log('SetMessageBalloonState');
        if(operation[1]=='true') window.showmessagestateinput.checked=true;
        else window.showmessagestateinput.checked=false;
    }else if(operation[0]==1){    // ShowMessageBalloonStateUI
        console.log('ShowMessageBalloonStateUI');
        window.ShowMessageBalloonUI();
    }else if(operation[0]==2){    // NOOPERATION
        // NOOPERATION
        console.log('NOOPERATION');
    }else if(operation[0]==3){    // filedata
        console.log('filedata'); // TODO:
        window.receivedstring=operation[1];
        window.afterreceive();
    }else{
        console.log('callbackdefault');
        window.callback();
    }
});
