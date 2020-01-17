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


videoanalyser.default.analyseVideo(dvr19, async function(err,result){          
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
      
    });

    //console.log(result)
    return result
}    
//needed to ue api/... i don't know why..?
app.get('/api/raw',(req,res) => {
    res.json(gpsData)
})


app.get('/api/location', (req, res) => {
    res.json(getlocation(gpsData));
});



app.get('/api/daytime',(req,res) => {
    res.json(getdaytime(gpsData))
})

app.get('/api/fuck', (req, res) => {
    res.json({
        'message': 'fuck'
    });
});


app.listen(port, () => console.log(`backend listening on port ${port}!`))