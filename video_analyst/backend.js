
//https://blog.jscrambler.com/implementing-file-upload-using-node-and-angular/
//https://levelup.gitconnected.com/simple-application-with-angular-6-node-js-express-2873304fff0f
const  express  =  require('express')
const  app  =  express()
const port = process.env.PORT || 1386;
let http = require('http');
let server = http.Server(app);
const  multipart  =  require('connect-multiparty');
const  multipartMiddleware  =  multipart({ uploadDir:  './uploads' });
const { exec } = require('child_process');
const path =require('path')
const bodyParser = require("body-parser");
app.use(bodyParser.json()); //res.json need
app.use(bodyParser.urlencoded({
    extended: true
}));

const mediainfo = require('node-mediainfo');
const videoanalyser = require('./video-analyser')
const fs = require('fs')
const dvr17 = './dvr17.MP4'
const dvr19 = './dvr19.MP4'
var mainWindow;
var gpsData;
//var ffmpeg = require('fluent-ffmpeg');
/*
//https://github.com/fluent-ffmpeg/node-fluent-ffmpeg
ffmpeg(dvr17).screenshots({
    // Will take screens at 20%, 40%, 60% and 80% of the video
    count: 4,
    folder: '/path/to/output'
  });
*/
var mimeNames = {
    '.css': 'text/css',
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.ogg': 'application/ogg', 
    '.ogv': 'video/ogg', 
    '.oga': 'audio/ogg',
    '.txt': 'text/plain',
    '.wav': 'audio/x-wav',
    '.webm': 'video/webm',
    '.png':'image/png'
};

function getMimeNameFromExt(ext) {
    var result = mimeNames[ext.toLowerCase()];
    
    // It's better to give a default value.
    if (result == null)
        result = 'application/octet-stream';
    
    return result;
}
/*
async function analyser(){
    var tmp = 'fuck'
    tmp =  await videoanalyser.default.analyseVideo(dvr17, async function(err,result){          
        if(err)
        {
            console.error(err)
            return err
        }
        gpsData = result
        tmp  = result
        console.log('in callback func: tmp='+tmp+' err='+err)
    }) 
    setTimeout(() => {
        console.log('tmp in setimeout '+tmp)
        //return tmp 
        return 'fuck'
    }, 2000);
}*/

function getlocation(data) // only reserve lat and lng
{
    console.log('In func getlocation : '+data)
    var result=[] 
    data.gpsData.forEach(element => {
      //console.log("lat : "+element.lat)  
      //console.log("lng : "+element.lon)
      if(element.lat != 0 || element.lon!=0) // so as to ignore the last data
      {
        result.push({
            lat : element.lat,
            lng : element.lon
        })
      }    
    });

    //console.log(result)
    return result
}

function getdaytime(data) // only reserve lat ,lng ,and daytime
{
    //console.log(data)
    var result=[] 
    data.gpsData.forEach(element => {
      //console.log("lat : "+element.lat)  
      //console.log("lng : "+element.lon)
      result.push({
        datetime:element.datetime,
        lat : element.lat,
        lng : element.lon
      })
      
    })

    //console.log(result)
    return result
}

function getbearing(data) // only reserve lat ,lng ,and daytime
{
    //console.log(data)
    var result=[] 
    data.gpsData.forEach(element => {
      //console.log("lat : "+element.lat)  
      //console.log("lng : "+element.lon)
      result.push({
        datetime:element.datetime,
        bearing: element.bearing,
        lat : element.lat,
        lng : element.lon
      })
      
    })

    //console.log(result)
    return result
}

function readRangeHeader(range,totalLength) {
    var array = String(range).split(/bytes=([0-9]*)-([0-9]*)/); //使用正規表示法 切割字串 array == ['',start,end,'']
    var start = parseInt(array[1]);
    var end = parseInt(array[2]);
   
    var result = {
        Start: isNaN(start) ? 0 : start,
        End: isNaN(end) ? (totalLength - 1) : end //如果request.header缺少start 或是 end（isNaN成立）  則將start ,end 設成檔案的頭跟尾

    };
   
    if (!isNaN(start) && isNaN(end)) {
        result.Start = start;
        result.End = totalLength - 1;
    }

    if (isNaN(start) && !isNaN(end)) {
        result.Start = totalLength - end;
        result.End = totalLength - 1;
    }
    
    return result;
    
}

function sendResponse(response, responseStatus, responseHeaders, readable) {
    response.writeHead(responseStatus, responseHeaders);

    if (readable == null)
        response.end();
    else
        readable.on('open', function () {
            readable.pipe(response);
        });

    return null;
}


//needed to use api/... i don't know why..?
app.get('/api/raw',(req,res) => {
    res.json(gpsData)
})


app.get('/api/location', (req, res) => {
    videoanalyser.default.analyseVideo(dvr17, async function(err,result){          
        if(err)
        {
            console.error(err)
            return err
        }
        //gpsData = result
        res.json(getlocation(result))
    })
   
   
});
app.get('/api/location/*', (req, res) => {
    var filepath = filename_parse(req.params['0'])
    videoanalyser.default.analyseVideo(filepath, function(err,result){          
        if(err)
        {
            console.error(err)
            return err
        }
        //gpsData = result
        res.json(getlocation(result))
    })
});


app.get('/api/daytime',(req,res) => {
    res.json(getdaytime(gpsData))
})


app.get('/api/bearing',(req,res) => {

    //var filepath = filename_parse(req.params['0'])
    videoanalyser.default.analyseVideo(dvr17, function(err,result){          
        if(err)
        {
            console.error(err)
            return err
        }
        //gpsData = result
        res.json(getbearing(result))
    })

})

app.get('/api/bearing/*',(req,res) => {

    var filepath = filename_parse(req.params['0'])
    videoanalyser.default.analyseVideo(filepath, function(err,result){          
        if(err)
        {
            console.error(err)
            return err
        }
        //gpsData = result
        res.json(getbearing(result))
    })

})



const initFolder = './'

app.get('/api/video/*',(req,res) =>{
    const lastfilename = filename_parse(req.params['0'])
    const filename = lastfilename
    //const filename =initFolder +lastfilename
    const stats = fs.statSync(filename) //read target file's imformation
    //console.log("size = "+stats.size)
    const rangeRequest = readRangeHeader(req.headers['range'], stats.size) 
    //console.log(rangeRequest)
    var resHeaders={};
    resHeaders['Access-Control-Allow-Origin']='*'

    console.log("filename = "+filename)

    // If 'Range' header exists, we will parse it with Regular Expression.
    if (rangeRequest == null) {
        resHeaders['Content-Type'] = getMimeNameFromExt(path.extname(filename));
        resHeaders['Content-Type'] = mimeNames['.mp4']
        resHeaders['Content-Length'] = stats.size;  // File size.
        resHeaders['Accept-Ranges'] = 'bytes';

        //  If not, will return file directly.
        sendResponse(res, 200, resHeaders, fs.createReadStream(filename));
        return null;
    }
    var start = rangeRequest.Start;
    var end = rangeRequest.End;

    // If the range can't be fulfilled. 
    if (start >= stats.size || end >= stats.size) {
        // Indicate the acceptable range.
        resHeaders['Content-Range'] = 'bytes */' + stats.size; // File size.

        // Return the 416 'Requested Range Not Satisfiable'.
        sendResponse(res, 416, resHeaders, null);
        return null;
    }

    // Indicate the current range. 
    resHeaders['Content-Range'] = 'bytes ' + start + '-' + end + '/' + stats.size;
    resHeaders['Content-Length'] = start == end ? 0 : (end - start + 1);
    //resHeaders['Content-Type'] = getMimeNameFromExt(path.extname(filename));
    resHeaders['Content-Type'] = mimeNames['.mp4']
    resHeaders['Accept-Ranges'] = 'bytes';
    resHeaders['Cache-Control'] = 'no-cache';

    // Return the 206 'Partial Content'.
    sendResponse(res, 206, resHeaders, fs.createReadStream(filename, { start: start, end: end }));

})



app.get('/api/fuck', (req, res) => {
    res.json({
        'message': 'fuck'
    });
});



app.get('/api/dir', (req, res) => {
    //res.send('fuck')
(async function () {  

    res.send(await(execShellCommand('dir')));
})();

});

app.get('/api/photo/*', (req, res) => {

    const lastfilename = req.params['0']
    //stream = fs.createReadStream('./thumb/dvr17.MP4.png')
    const stats = fs.statSync('./thumb/'+lastfilename) //read target file's imformation

    stream = fs.createReadStream('./thumb/'+lastfilename)
    console.log(stream)
    res.set({
    'Context-Type' :mimeNames['.png'], 
    })
    stream.pipe(res) 

})

function execShellCommand(cmd) {
    const exec = require('child_process').exec;
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
        if (error) {
        //console.warn(error);
        }
        if(stdout)
        {             
            console.log(stdout)
        }
        
        resolve(stdout? stdout : stderr);
        //resolve(stdout? input +': pwd found!!!' :input+': not this one')
        });
    });
    }

//var getmediainfo = require('./mediainformation_try.js')
/*
(async function () {  
    console.log( getmediainfo.getmediainfo(dvr17))
})();

*/

app.get('/api/usb', (req, res) => {
    //res.send('fuck')
    (async function () {  
        var raw=JSON.parse(fs.readFileSync(`./listdosdevices/mountusb.json`))
        var plugin = raw.now
        var filename = await inusedisk(plugin)

        var timeinfo =[]
        for(var i=0;i<filename.length;i++){
            console.log(await getmediainfo(filename[i]))
            timeinfo.push(await getmediainfo(filename[i]).Encoded_Date)
            shots(filename[i])
        }
        res.send([filename, timeinfo])

        //res.send(await inusedisk(plugin))
        //res.send(await visitor('G:/'))
    })();
});

async function inusedisk(plugin){

    var result= []
    for(var i=0;i<plugin.length;i++){
        var tmp = ( await visitor(plugin[i]+':/') )
        result = result.concat(tmp)
        //console.log(result)
    }
/*
    var retg = []
    //var retg = (await visitor('G:/')) 
    //console.log(retg)

    var retf= (await visitor('F:/')) 
    var copy = retg.concat(retf);

    return await copy

*/  

    return await result
}

var { getVideoDurationInSeconds } = require('get-video-duration')
getVideoDurationInSeconds(dvr17).then((duration) => {
    console.log(duration)
  })
  





async function getmediatime(path) 
{
    
    var dateinfo= await mediainfo(path)
    var result = JSON.stringify(dateinfo.media.track[0].Encoded_Date)
    console.log(result)
    result = result.replace(/(")/g,'')
    result = result.replace(/(\\)/g,'')

    return String(result)
}
async function getmediaduration(path)// need fix
{
    
    var dateinfo= await mediainfo(path)
    var result = JSON.stringify(dateinfo.media.track[0].Duration)
    console.log(result)
    result = result.replace(/(")/g,'')
    result = result.replace(/(\\)/g,'')

    return String(result)
}
var shots=async function(pos){
    console.log(await getmediaduration(pos))
    console.log(pos)
    var filename = filename_encode(pos)+'.png'
    console.log(filename)
    ffmpeg(pos)
            .screenshots({
                timestamps: [await getmediaduration(pos)/2],
                filename: filename,
                folder: './thumb/'
            }).on('end', function() {
                console.log('done');
            });

}
// : ---> _8778fuck_
// / ---> _8777bitch_
// \ ---> _8877pussy_

var filename_encode = function(pos)
{
    pos=String(pos)
    /*
    pos = pos.replace(/(%8778fuck%)/g,':')
    pos = pos.replace(/(%8777bitch%)/g,'/')
    */
   pos = pos.replace(/(:)/g,'_8778fuck_')
   pos = pos.replace(/(\/)/g,'_8777bitch_')
   pos = pos.replace(/(\\)/g,'_8877pussy_')

    return pos
}
var filename_parse = function(pos)
{
    pos=String(pos)
    pos = pos.replace(/(_8778fuck_)/g,':')
    pos = pos.replace(/(_8777bitch_)/g,'/')
    pos = pos.replace(/(_8877pussy_)/g,'\\')

    return pos
}



async function visitor(node) { //拜訪目標路徑底下的各個資料夾 找出 mod要求提供的檔案類型
    var videofile=[]

    try {
        var files = fs.readdirSync(node);
        console.log('files = '+files) 
    } catch (err) {
        // Here you get the error when the file was not found,
        // but you also get any other error
        files = err
        return files
      }
    //console.log(`files = ${files}`)
    files.forEach(async function (filename) {
      var childnode = path.join(node,filename);
      var stats = fs.statSync(childnode);
      
      if (stats.isDirectory())  //如果是子目錄 繼續拜訪
      { 
        var childnodefile = await visitor(childnode)
        //videofile.push(childnodefile) //<--- use this to become nested form
       
        childnodefile.forEach(element => {
            if(path.extname(element) == '.mp4' || path.extname(element) == '.MP4')
                videofile.push(element)

                //console.log(element)   
                //var tmp = new cell(element,'8/7/16')      
                //videofile.push(tmp)
        });                
      }
      else
      {
        if(path.extname(childnode) == '.mp4' || path.extname(childnode) == '.MP4')           
            videofile.push(childnode)      
            //console.log(childnode)
            //var tmp = new cell(childnode,'8/7/16')      
           // videofile.push(tmp)
    }
    });
    return await videofile

}


let socketIO = require('socket.io');
let io = socketIO(server);


io.on('connection', (socket) => {
    console.log('user connected');

    socket.on('new-message', (message) => {
        io.emit('new-message', message+' fuck');
    });
});

var usb = require('usb')
var list = require('./listdosdevices/parselistdevice.js')

console.log(usb.getDeviceList())

setTimeout(function () {
    execShellCommand(`.\\listdosdevices\\ListDOSdevices.exe`)
  }, 250)


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
            io.emit( 'new-message',JSON.stringify(list.update(stdout)) )
        }
        
        resolve(stdout? stdout : stderr);
        //resolve(stdout? input +': pwd found!!!' :input+': not this one')
        });
    });
    }


server.listen(port, () => console.log(`backend listening on port ${port}!`))



const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
var ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
// console.log(ffmpegInstaller.path, ffmpegInstaller.version);

module.exports = ffmpeg;


/*
ffmpeg('F:\dvr19.MP4')
  .takeScreenshots({
      count: 10,
      timemarks: [ '600' ] // number of seconds
    }, './', function(err) {
    console.log('screenshots were saved')
  });
*/
  


//shots('F:\dvr17.MP4')