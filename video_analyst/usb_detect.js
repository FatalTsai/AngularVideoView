var usb = require('usb')
var fs =  require('fs')
var list = require('./listdosdevices/parselistdevice.js')

console.log(usb.getDeviceList())

usb.on('attach', function(device) { 
    console.log(device)
    setTimeout(function () {
        execShellCommand(`.\\listdosdevices\\ListDOSdevices.exe`)
      }, 250)
});

usb.on('detach', function(device) { 
    console.log(device)
    setTimeout(function () {
        execShellCommand(`.\\listdosdevices\\ListDOSdevices.exe`)
      }, 250)

});
//https://docs.microsoft.com/zh-tw/windows-server/storage/disk-management/assign-a-mount-point-folder-path-to-a-drive


function execShellCommand(cmd) {
    const exec = require('child_process').exec;
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
        if (error) {
        console.warn(error);
        }
        if(stdout)
        {             
            console.log(stdout)
            list.update(stdout)
        }
        
        resolve(stdout? stdout : stderr);
        //resolve(stdout? input +': pwd found!!!' :input+': not this one')
        });
    });
    }