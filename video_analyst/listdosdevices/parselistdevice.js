var fs = require('fs')

var raw = `Drv Type       KernelName
A:  ----
B:  ----
C:  FIXED      \Device\HarddiskVolume2
D:  FIXED      \Device\HarddiskVolume3
E:  CDROM      \Device\CdRom0
F:  REMOVABLE  \Device\HarddiskVolume21
G:  REMOVABLE  \Device\HarddiskVolume22
H:  ----
I:  ----
J:  ----
K:  ----
L:  ----
M:  ----
N:  ----
O:  REMOTE     \Device\LanmanRedirector\;O:000000000020e701\JET-FILES\CompanyDTA
P:  REMOTE     \Device\LanmanRedirector\;P:000000000020e701\JET-FILES\Picture
Q:  ----
R:  REMOTE     \Device\LanmanRedirector\;R:000000000020e701\JET-FILES\SW
S:  ----
T:  ----
U:  ----
V:  ----
W:  REMOTE     \Device\LanmanRedirector\;W:000000000020e701\JET-FILES\JU\Cheney.Tsai
X:  ----
Y:  ----
Z:  ----`
//https://www.uwe-sieber.de/drivetools_e.html

//https://stackoverflow.com/questions/3410464/how-to-find-indices-of-all-occurrences-of-one-string-in-another-in-javascript
var searchall =function(str,regex){
    console.log(raw)
    //var str = "I learned to play the Ukulele in Lebanon."
    //var regex = /le/gi, 
    var result, indices = [];
    while ( (result = regex.exec(str)) ) {
        indices.push(result.index);
    }
    //console.log(indices)

    return(indices)
}

var update = function(raw)
{
    var remove_diskindex = searchall(raw,/REMOVABLE/gi) 
    var REMOVABLE=[]
    for(var i = 0;i<remove_diskindex.length;i++)
    {
        remove_diskindex[i]-=4
    }

    remove_diskindex.forEach(element => {

        console.log(raw[element])
        REMOVABLE.push(raw[element])
    });

    var mountusb = JSON.parse(fs.readFileSync(`./listdosdevices/mountusb.json`))
    //console.log(mountusb)

    mountusb.last = mountusb.now
    mountusb.now = REMOVABLE
    fs.writeFileSync(`./listdosdevices/mountusb.json`,JSON.stringify(mountusb))
    console.log(mountusb)

    return mountusb
}



module.exports = {
    update,
    searchall
};