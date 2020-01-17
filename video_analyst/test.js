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
        //console.log(result)
        gpsData = result
        //fs.writeFileSync("dvr17.json", JSON.stringify(result), 'utf8');
        return await result 
    }) 


function getlocation(data) // only reserve lat and lng
{
    //console.log(data)
    var result=[] 
    data.gpsData.forEach(element => {
      //console.log("lat : "+element.lat)  
      //console.log("lng : "+element.lon)
      result.push({
          lat : element.lat,
          lng : element.lon
      })
      
    });

    console.log(result)
    return result
}

    

setTimeout(function () {
    getlocation(gpsData)
    
    }, 100)




module.exports.default =  {

};


