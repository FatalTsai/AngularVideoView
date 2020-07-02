//https://www.npmjs.com/package/mediainfo.js
//https://github.com/buzz/mediainfo.js/blob/master/examples/node-cli/cli.js
const { open } = require('fs').promises
const MediaInfo = require('mediainfo.js')
const filePath = './dvr17.MP4'

const main = async (filePath) => {
  let fileHandle
  let mediainfo
  try {
    fileHandle = await open(filePath, 'r')
    mediainfo = await MediaInfo({ format: 'JSON' })
    //console.log(fileHandle)
    //console.log('mediainfo = '+JSON.stringify(mediainfo))


    const getSize = async () => (await fileHandle.stat()).size
    const readChunk = async (size, offset) => {
      const buffer = new Uint8Array(size)
      await fileHandle.read(buffer, 0, size, offset)
      return buffer
    }
    const result = await mediainfo.analyzeData(getSize, readChunk)
    //console.log(result)
    return result
  } catch (error) {
    console.error(error)
  } finally {
    fileHandle && (await fileHandle.close())
    mediainfo && mediainfo.close()
  }
}

async function getmediainfo(filePath) {
    var tmp =JSON.parse( await main(filePath) )
    console.log(await tmp.media.track[0].Encoded_Date)
    console.log(await tmp.media.track[0].Duration)
    //console.log(await (tmp))
    return {'Encoded_Date' : tmp.media.track[0].Encoded_Date,
            'Duration'     : tmp.media.track[0].Duration}
}
//getmediainfo(filePath)
/*
const filePath = process.argv[2]
if (!filePath) {
  console.log(`Usage: ${process.argv[1]} FILENAME`)
} else {
  main(filePath)
}
*/




module.exports = {
    main,
    getmediainfo
};