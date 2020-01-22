//https://blog.jscrambler.com/implementing-file-upload-using-node-and-angular/
//https://levelup.gitconnected.com/simple-application-with-angular-6-node-js-express-2873304fff0f
const  express  =  require('express')
const  app  =  express()
const  port  =  1386
const  multipart  =  require('connect-multiparty');
const  multipartMiddleware  =  multipart({ uploadDir:  './uploads' });
const { exec } = require('child_process');

const bodyParser = require("body-parser");
app.use(bodyParser.json()); //res.json need
app.use(bodyParser.urlencoded({
    extended: true
}));

const videoanalyser = require('./video-analyser')
const fs = require('fs')
const dvr17 = './1D42C600_243830.MP4'
const dvr19 = './27D3DC00.MP4'
var mainWindow;
var gpsData;

var svg = 'data:image/svg+xml;utf8,';
svg += '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="46px" height="46px" viewBox="0 0 46 46" enable-background="new 0 0 46 46" xml:space="preserve">';
svg += '  <g transform="rotate(' +'' + ', 23, 23)">';
svg += '    <linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="-186.8672" y1="20.1641" x2="-185.9678" y2="20.1641" gradientTransform="matrix(32.629 0 0 41.951 6105.625 -825.7549)"><stop offset="0"   style="stop-color:#0086CD"/><stop offset="0.5" style="stop-color:#0086CD"/><stop offset="0.5" style="stop-color:#0077B7"/><stop offset="1"   style="stop-color:#0086CD"/></linearGradient>';
svg += '    <polygon fill="url(#SVGID_1_)" points="23.001,1.241 37.677,38.979 23.001,30.594 8.324,38.979"/>';
svg += '    <path d="M38.556,40l-15.555-8.889L7.445,40L23.001,0L38.556,40z M23.001,2.481L9.204,37.958l13.797-7.884l13.796,7.884 L23.001,2.481z"/>';
svg += '  </g>';
svg += '</svg>';

console.log(svg)

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

app.get('/api/fuck', (req, res) => {
    res.json({
        'message': 'fuck'
    });
});


app.listen(port, () => console.log(`backend listening on port ${port}!`))