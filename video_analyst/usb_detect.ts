var usb = require('usb')
console.log(usb.getDeviceList())

usb.on('attach', function(device) { 
    console.log(device)
});

usb.on('detach', function(device) { 
    console.log(device)

});
//https://docs.microsoft.com/zh-tw/windows-server/storage/disk-management/assign-a-mount-point-folder-path-to-a-drive