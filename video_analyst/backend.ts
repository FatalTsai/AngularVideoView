//https://blog.jscrambler.com/implementing-file-upload-using-node-and-angular/
//https://levelup.gitconnected.com/simple-application-with-angular-6-node-js-express-2873304fff0f
const  express  =  require('express')
const  app  =  express()
const  port  =  1386
const  multipart  =  require('connect-multiparty');
const  multipartMiddleware  =  multipart({ uploadDir:  './uploads' });
const { exec } = require('child_process');
const path =require('path')
const bodyParser = require("body-parser");
app.use(bodyParser.json()); //res.json need
app.use(bodyParser.urlencoded({
    extended: true
}));

const videoanalyser = require('./video-analyser')
const fs = require('fs')
const dvr17 = './dvr17.MP4'
const dvr19 = './dvr19.MP4'
const initFolder = './'
var mainWindow;
var gpsData;


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
    '.webm': 'video/webm'
};

function getMimeNameFromExt(ext) {
    var result = mimeNames[ext.toLowerCase()];
    
    // It's better to give a default value.
    if (result == null)
        result = 'application/octet-stream';
    
    return result;
}

videoanalyser.default.analyseVideo(dvr17, async function(err,result){          
    if(err)
    {
        console.error(err)
        return err
    }
    gpsData = result
    return await result 
}) 


function getlocation(data) // only reserve lat and lng
{
    //console.log(data)
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
    res.json(getlocation(gpsData));
});



app.get('/api/daytime',(req,res) => {
    res.json(getdaytime(gpsData))
})


app.get('/api/bearing',(req,res) => {
    res.json(getbearing(gpsData))
})

app.get('/api/video/*',(req,res) =>{
    const lastfilename = req.params['0']
    const filename =
    initFolder +lastfilename
    const stats = fs.statSync(filename) //read target file's imformation
    //console.log("size = "+stats.size)
    const rangeRequest = readRangeHeader(req.headers['range'], stats.size) 
    //console.log(rangeRequest)
    var resHeaders={};
   

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


app.listen(port, () => console.log(`backend listening on port ${port}!`))