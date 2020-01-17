var fs =        require('fs');
var crypto =    require('crypto');
var ipc =       require('electron').ipcMain;
var ffmpeg =    require('fluent-ffmpeg');
var path =      require('path')
var exec =      require('child_process').exec;

var log = true;

/*  analyseVideo() returns: 
    {
        hash:           '',             // Computed hash of metadata (not whole file!) used as ID

        path:           '',             // Path to file on disk/camera
        name:           '',             // File name (excluding path)

        fileSize:       0,              // Size of file in bytes
        
        isReadOnly:     false,          // File is/isn't read only on disk (protected files)
        cameraModel:    '',             // Nextbase camera model i.e. NBDVR512GW

        // Computed properties from metadata
        startDateTime:  Date(),         // First datetime extracted from metadata
        endDateTime:    Date(),         // Last datetime extracted from metadata
        avgSpeed:       0,              // Avg speed computed from metadata in MPH
        maxSpeed:       0,              // Max speed computed from metadata in MPH
        totalDistance   0,              // Total distance computed from metadata in miles

        // Video Properties
        width:          0,              // Width of video in pixels
        height:         0,              // Height of video in pixels
        duration:       0,              // Duration of video in seconds
        frameRate:      0,              // Frame rate of vide in frames per second
        

        gpsData: [ // Array index corresponds to second of video, all data displayed at 1 Hz
            {
                datetime:   Date(),         // Date Time from metadata

                gpsStatus: '',              // [A]ctive or [V]oid
                lat:       0.0,             // [+/-] Degrees Latitude, +North -South
                lon:       0.0,             // [+/-] Degrees Longitude, +East -West

                speed:     0,               // Speed in MPH
                bearing:   0,               // Degrees, this is computed for some cameras

                xAcc:      0,               // G Sensor X - Adjusted so that Y ~= 1 ( Raw Value / 256 ) X+ = left,      X- = right
                yAcc:      0,               // G Sensor Y - Adjusted so that Y ~= 1 ( Raw Value / 256 ) Y+ = up,        Y- = down
                zAcc:      0,               // G Sensor Z - Adjusted so that Y ~= 1 ( Raw Value / 256 ) Z+ = forward,   Z- = backward

                _raw:      null,            // Debug only,

                // Computed Properties
                distanceFromLast: 0.0       // Miles from last valid GPS point
            },
            ....
        ]
    }

 */

var analyseVideo =   function(filePath, callback) {

    fs.open(filePath, 'r', function(err, fd) {

        // Handle any open file error
        if (err) {
            if (err.code === "ENOENT") {
                callback('404 file not found "' + filePath + '"', null);
                return;
            } else {
                throw err;
            }
        }

        // Validate that the file is a valid QuickTime file
        if (!isQuickTimeFile(filePath, fd)) return callback('Not a valid QuickTime file');

        // Get file size from  statistics 
        var stats = fs.statSync(filePath);

        var fileSize = stats.size;
        var isReadOnly = false; //!(2 & parseInt((stats.mode & parseInt("777", 8)).toString(8)[0]));

        isFileLocked(filePath, function (isLocked) {
            
            if(isLocked) {
                isReadOnly = true;
            }
            
            // Get an array of all the atoms in the file
            var maxLoopItterations = 30; // Increaced as some 612 files exceed 20 atoms (3 'trak's)
            var atoms = findAtoms(fd, 0, fileSize, 0, maxLoopItterations);

            var filename = filePath.split('\\').pop().split('/').pop().toString();

            // Detect camera model
            //judge 17dvr or 19dvr
            var cameraModel = detectCameraModel(atoms, fd, filename);
            console.log('Detected camera model: %s', cameraModel)
          
            // Variables outside if statement
            var gpsDataLocations = [];
            var isValidGPSData = false;
            var parsedGpsData = [];

            if(cameraModel != 'REPLAY') {

                // Get the GPS data locations for given model
            
                if (cameraModel == '212G')  gpsDataLocations = getGpsDataLocations_412GW(fd, atoms);
                if (cameraModel == '312G')  gpsDataLocations = getGpsDataLocations_412GW(fd, atoms);
                if (cameraModel == '312GW') gpsDataLocations = getGpsDataLocations_312GW(fd, atoms);
                if (cameraModel == '380GW') gpsDataLocations = getGpsDataLocations_412GW(fd, atoms);
                if (cameraModel == '412GW') gpsDataLocations = getGpsDataLocations_412GW(fd, atoms);
                if (cameraModel == '512GW') gpsDataLocations = getGpsDataLocations_412GW(fd, atoms);
                if (cameraModel == '612GW') gpsDataLocations = getGpsDataLocations_612GW(fd, atoms);
                if (cameraModel == 'MIRGW') gpsDataLocations = getGpsDataLocations_412GW(fd, atoms);
                if (cameraModel == 'DUO')   gpsDataLocations = getGpsDataLocations_DUOHD(fd, atoms);
                if (cameraModel == 'DUOHD') gpsDataLocations = getGpsDataLocations_DUOHD(fd, atoms);
                if (cameraModel == '512G')  gpsDataLocations = getGpsDataLocations_312GW(fd, atoms);
                if (cameraModel == '402G')  gpsDataLocations = getGpsDataLocations_402G(fd, atoms);
                if (cameraModel == 'RIDE')  gpsDataLocations = getGpsDataLocations_312GW(fd, atoms);
                if (cameraModel == '300W')  gpsDataLocations = getGpsDataLocations_300W(fd, atoms);        
                if (cameraModel == '522GW') gpsDataLocations = getGpsDataLocations_612GW(fd, atoms);
                if (cameraModel == '17DVR') gpsDataLocations = getGpsDataLocations_17DVR(fd, atoms);
                if (cameraModel == '19DVR') gpsDataLocations = getGpsDataLocations_19DVR(fd, atoms);

                // Get the data from each location into gpsData (as Buffer)
                var gpsData = [];
                var gpsDataLength = 512;
                if(cameraModel == '402G' || cameraModel == 'RIDE') {
                    gpsDataLength = 1700;
                }
                if(cameraModel == '17DVR' || cameraModel == '19DVR') {
                    gpsDataLength = 95;
                }
                 for (var i = 0; i < gpsDataLocations.length; i++) {
                    //write raw data into gpsDataBuffer 
                    var gpsDataBuffer = getGpsContentBuffer(fd, gpsDataLocations[i], gpsDataLength)
                    gpsData.push(gpsDataBuffer);

                    //log && console.log('read data item: %d', i)
                    //log && console.log('read data item: "%s"', gpsDataBuffer.toString('hex'))
                }
                // We need to check that the data we have extracted is something that will parse
                // To do this we make sure the first 7 bytes of the first data chunk == "freeGPS"
                                
                if(cameraModel == 'DUOHD' || cameraModel == 'DUO' 
                || cameraModel == '612GW' || cameraModel == '300W'
                || cameraModel == '17DVR' || cameraModel == '19DVR'
                || cameraModel == '522GW') { // In the case of the DUOHD this check will fail, so we just skip over it.

                    // is it timelapse?
                    if((cameraModel == '612GW' || cameraModel == '522GW') && gpsDataLocations == []) {
                        isValidGPSData = false;
                    } else {
                        isValidGPSData = true;
                    }

                } else {
                   
                    //log && gpsData.length > 0 && console.log(gpsData[0].toString('utf8', 4, 4+7))

                    if(gpsData.length > 0 && gpsData[0].toString('utf8', 4, 4+7) == 'freeGPS') {

                        // Valid
                        isValidGPSData = true;
                    } else {
                        // Invalid
                        isValidGPSData = false;
                        cameraModel = 'BASIC'; // reset camera model to basic
                    }
                }
                
            
                // Parse the returned Buffers into normal data format
                
                if(isValidGPSData) {

                    for (var i = 0; i < gpsData.length; i++) {
                        var dataItem;

                        if (cameraModel == '212G') dataItem = parseGpsContentBuffer_212G(gpsData[i]);
                        if (cameraModel == '312G') dataItem = parseGpsContentBuffer_312G(gpsData[i]);
                        if (cameraModel == '312GW') {
                            dataItem = parseGpsContentBuffer_412GW(gpsData[i]); // New 312GW folllows old scheme
                            if(!dataItem)  dataItem = parseGpsContentBuffer_312GW(gpsData[i]);
                        }
                        if (cameraModel == '17DVR') {
                            dataItem = parseGpsContentBuffer_17DVR(gpsData[i]);
                        }
                        if (cameraModel == '19DVR') {
                            dataItem = parseGpsContentBuffer_19DVR(gpsData[i]);
                        }
                        
                        if (cameraModel == '300W') dataItem = parseGpsContentBuffer_300W(gpsData[i]);
                        if (cameraModel == '380GW') dataItem = parseGpsContentBuffer_380GW(gpsData[i]);
                        if (cameraModel == '412GW') dataItem = parseGpsContentBuffer_412GW(gpsData[i]);
                        if (cameraModel == '512GW') dataItem = parseGpsContentBuffer_512GW(gpsData[i]);
                        if (cameraModel == '612GW') dataItem = parseGpsContentBuffer_612GW(gpsData[i]);
                        if (cameraModel == 'MIRGW') dataItem = parseGpsContentBuffer_MIRGW(gpsData[i]);
                        if (cameraModel == 'DUOHD') dataItem = parseGpsContentBuffer_DUOHD(gpsData[i], i);
                        if (cameraModel == 'DUO')   dataItem = parseGpsContentBuffer_DUOHD(gpsData[i], i);
                        if (cameraModel == '402G')  dataItem = parseGpsContentBuffer_402G(gpsData[i], i);
                        if (cameraModel == 'RIDE')  dataItem = parseGpsContentBuffer_402G(gpsData[i], i);
                        if (cameraModel == '512G')  dataItem = parseGpsContentBuffer_512G(gpsData[i], i);

                        if (cameraModel == '522GW') dataItem = parseGpsContentBuffer_522GW(gpsData[i]);

                        parsedGpsData.push(dataItem);
                    }

                    

                    // If its the DUOHD we need to manually calc the bearing and speed...
                    if(cameraModel == 'DUOHD' || cameraModel == '512GNO') {

                        for(var i = 1; i < gpsData.length; i++) {

                            parsedGpsData[i].bearing = latLonBearing(parsedGpsData[i-1].lat, parsedGpsData[i-1].lon, parsedGpsData[i].lat, parsedGpsData[i].lon);

                            if(i == 1) {
                                // In the first instance we set the result to item 0 too
                                parsedGpsData[0].bearing = latLonBearing(parsedGpsData[i-1].lat, parsedGpsData[i-1].lon, parsedGpsData[i].lat, parsedGpsData[i].lon);
                            }
                        }

                    }

                }

            } else {

                // Read the data the replay way!
                var dataAtom = atoms['gdat'];
                if(dataAtom) {

                    var atomContent = '';

                    var gdatBuffer = new Buffer(dataAtom.size - 8);
                    fs.readSync(fd, gdatBuffer, 0, gdatBuffer.length, dataAtom.offset + 8);
                    atomContent = gdatBuffer.toString('utf8');

                    var buf = Buffer.from(atomContent, 'base64');
                    var gdat = JSON.parse(buf.toString('utf8'));

                    isValidGPSData = true;
                    cameraModel = gdat.cameraModel;

                    parsedGpsData = gdat.gpsData;
                    // Make the dates Date's
                    for(var i = 0; i < parsedGpsData.length; i++) {
                        if(parsedGpsData[i].gpsStatus == 'A') {
                            parsedGpsData[i].datetime = new Date(parsedGpsData[i].datetime);
                        }
                    }


                } else {
                    isValidGPSData = false;
                    cameraModel = "BASIC";
                }

            }
            
            var allFalse = true;
            var allVoid = true;
            // Make sure we really do have GPS data
            for(var i = 0; i < parsedGpsData.length; i++) {
                if(parsedGpsData[i]) {
                    allFalse = false;
                    if(parsedGpsData[i]) {
                    }
                }
            }
            if(allFalse) {
                isValidGPSData = false;
            }

            // Now form the return object
            var file = {
                path: filePath,
                fileSize: fileSize,
                name: filename,
                isReadOnly: isReadOnly,
                cameraModel: cameraModel,
                hasGPS: isValidGPSData
            }

            // Determine if camera is [F]ront or [R]ear
            file.direction = getCamViewDirection(fd, atoms);

            //log && console.log(parsedGpsData)

            if(isValidGPSData) {

                file.gpsData = parsedGpsData;

                // DEPRECIATED: Now using method on line 296 based on distance from last
                // If the variance in lat lon is > 3 mark the data as invalid
                /*for(var i = 1; i < parsedGpsData.length; i++) {

                    var item = parsedGpsData[i];
                    var compareItem = parsedGpsData[i - 1];

                     if(parsedGpsData[i].gpsStatus == 'A') {
                        if(Math.abs(item.lat - compareItem.lat) + Math.abs(item.lon - compareItem.lon) > 3) {
                            parsedGpsData[i].gpsStatus = 'V';
                        }
                     }
                }

                // If the lat or lon are whole numbers (integers) assume invalid
                for(var i = 0; i < parsedGpsData.length; i++) {

                    if(parsedGpsData[i].gpsStatus == 'A') {
                        if(parseInt(parsedGpsData[i].lat) == parsedGpsData[i].lat || parseInt(parsedGpsData[i].lon) == parsedGpsData[i].lon) {
                            parsedGpsData[i].gpsStatus = 'V';
                        }
                    }
                }*/

                

                // AFTER processing the distance between points we need to remove any erroneous points
                // We assume that any movement > 0.1 (0.1 miles in 1 second == 360MPH) is an error
                /*var foundError = true; // run at least once
                var itteration = 0;
                var maxItterations = file.gpsData.length;
                while(foundError && ++itteration < maxItterations) {

                    // Clear any previously calculated distances
                    for(var i = 0; i < file.gpsData.length; i++) {
                        file.gpsData[i].distanceFromLast = 0;
                    }

                    // Total Distance, also adds distance from last.
                    file.totalDistance = calculateTotalDistance(parsedGpsData);

                    // Assume done
                    foundError = false; 

                    for(var i = 0; i < file.gpsData.length; i++) {

                        if(file.gpsData[i].distanceFromLast > 0.1) {
                            file.gpsData[i].gpsStatus = 'V';
                            foundError = true;
                            break;
                        }
                    }
                }*/
                
                // Error Checking Method 3 - Standard Deviation

                // Use this to calibrate error checking
                // Standard deviation of 1 would mean a average difference of 1deg from average coordinate
                // I think this could probably be set lower, perhaps 0.5, maybe less
                var maxAllowedStdDev = 0.5; 
                
                // Lattitude
                var averageLat = average(file.gpsData.map(function (x) { return x.lat }));
                var stdDevLat = standardDeviation(file.gpsData.map(function (x) { return x.lat }));

                if(stdDevLat > maxAllowedStdDev) {
                    for(var i = 0; i < file.gpsData.length; i++) {
                        if(file.gpsData[i].lat > averageLat + stdDevLat || file.gpsData[i].lat < averageLat - stdDevLat) {
                            file.gpsData[i].gpsStatus = 'V';
                        }
                    }
                }
                
                // Longitude
                var averageLon = average(file.gpsData.map(function (x) { return x.lon }));
                var stdDevLon = standardDeviation(file.gpsData.map(function (x) { return x.lon }));

                if(stdDevLon > maxAllowedStdDev) {
                    for(var i = 0; i < file.gpsData.length; i++) {
                        if(file.gpsData[i].lon > averageLon + stdDevLon || file.gpsData[i].lon < averageLon - stdDevLon) {
                            file.gpsData[i].gpsStatus = 'V';
                        }
                    }
                }

                var stdDevLatActiveOnly = standardDeviation(file.gpsData.filter(function (x) { return x.gpsStatus == 'A' }).map(function (x) { return x.lat }));
                var stdDevLonActiveOnly = standardDeviation(file.gpsData.filter(function (x) { return x.gpsStatus == 'A' }).map(function (x) { return x.lon }));
                
                //log && console.log('Standard Deviation Before: ' + pad((stdDevLat+stdDevLon).toFixed(7), 11) + ' ' + pad(stdDevLat.toFixed(7), 11) + ' ' + pad(stdDevLon.toFixed(7), 11));
                //log && console.log('Standard Deviation After:  ' + pad((stdDevLatActiveOnly+stdDevLonActiveOnly).toFixed(7), 11) + ' ' + pad(stdDevLatActiveOnly.toFixed(7), 11) + ' ' + pad(stdDevLonActiveOnly.toFixed(7), 11));

                // Total Distance, also adds distance from last.
                file.totalDistance = calculateTotalDistance(parsedGpsData);

                // Max and Avg speed
                file.avgSpeed = getAvgSpeed(parsedGpsData);
                file.maxSpeed = getMaxSpeed(parsedGpsData);

                // Start and End datetime
                file.startDateTime = getStartTime(parsedGpsData);
                file.endDateTime = getEndTime(parsedGpsData);

            }

            // Hack to stop map and dashboard from being visible
            if(cameraModel == '300W') {
                file.hasGPS = false;
            }

            // Fianlly, Get video properties: width, height, framerate, duration
            ffmpeg.ffprobe(filePath, function(err, metadata) {

                if(!err && metadata && metadata.streams && metadata.streams[0]) {

                    var videoStream = metadata.streams[0]

                    file.width = videoStream.width;
                    file.height = videoStream.height;
                    file.duration = videoStream.duration;

                    var strFrameRate = videoStream.avg_frame_rate.toString();
                    
                    //log && console.log('Read framerate as : "' + strFrameRate + '"');

                    var multiplier = 1;
                    if(strFrameRate.indexOf('/1') > -1) multiplier = 1;
                    if(strFrameRate.indexOf('/1001') > -1) multiplier = 1000;
                    if(strFrameRate.indexOf('/9001') > -1) multiplier = 9000;
                    
                    strFrameRate = strFrameRate.replace('/1001', '').replace('/1', '');

                    file.frameRate = parseInt(parseInt(strFrameRate) / multiplier);

                    if(file.frameRate > 100) {
                        // Try other method
                        file.frameRate = Math.floor(parseInt(strFrameRate.split('/')[0]) / parseInt(strFrameRate.split('/')[1]));
                    }

                    log && console.log('Multiplier: ' + multiplier)
                    log && console.log('Frame Rate: ' + file.frameRate)

                    if ( parsedGpsData.length / file.duration > 5 ) { // If high rate nasty hack for 10hz
                        file.metaFrequency = 10;
                    }
                }

                // Compute a hash of the file (file obj not file)
                var dataToHash = JSON.stringify(file);
                file.hash = computeHash(dataToHash);

                //console.dir(metadata)

                
                callback(null, file);
                
                
            });

        });

    });
}

function getAvgSpeed(parsedGpsData) {
    var avgSpeed = 0,
        countValid = 0;
    for (var i = 0; i < parsedGpsData.length; i++) {
        var dataItem = parsedGpsData[i];
        if (dataItem.gpsStatus == 'A') {

            countValid += 1;
            avgSpeed += dataItem.speed;
        }
    }
    return avgSpeed / countValid;
}

function getMaxSpeed(parsedGpsData) {
    var maxSpeed = 0;
    for (var i = 0; i < parsedGpsData.length; i++) {
        var dataItem = parsedGpsData[i];
        if (dataItem.gpsStatus == 'A') {

            maxSpeed = Math.max(maxSpeed, dataItem.speed);
        }
    }
    return maxSpeed;
}

function getStartTime(parsedGpsData) {
    for (var i = 0; i < parsedGpsData.length; i++) {
        var dataItem = parsedGpsData[i];
        if (dataItem.gpsStatus == 'A') {
            return dataItem.datetime;
        }
    }
}

function getEndTime(parsedGpsData) {
    for (var i = 0; i < parsedGpsData.length; i++) {
        var dataItem = parsedGpsData[parsedGpsData.length - 1 - i];
        if (dataItem.gpsStatus == 'A') {
            return dataItem.datetime;
        }
    }
}

function calculateTotalDistance(parsedGpsData) {
    var lastItem = null;
    var totalDistance = 0;
    for (var i = 0; i < parsedGpsData.length; i++) {
        var dataItem = parsedGpsData[i];

        if (lastItem == null) {
            if(dataItem.gpsStatus == 'A') {
                lastItem = dataItem;
            }
            parsedGpsData[i].distanceFromLast = 0;
            continue;
        }
        if (dataItem.gpsStatus == 'A') {

            parsedGpsData[i].distanceFromLast = latLonDistance(lastItem.lat, lastItem.lon, dataItem.lat, dataItem.lon);

            totalDistance += parsedGpsData[i].distanceFromLast;
            lastItem = dataItem;
        }
    }
    return totalDistance;
}

function getCamViewDirection(fd, atoms) {
    // Assume its the front camera unless we can determine it's the rear
    var direction = 'F'; 

    // F or R only applies to the DUOHD, from ICATCH, so check for ICAT
    // We can tell the direction from the end of the �fmt atom
    if(atoms['ICAT'] && atoms['�fmt']) {

        // Read the �fmt atom
        var fmt = atoms['�fmt'];
        var fmtBuffer = new Buffer(12);
        fs.readSync(fd, fmtBuffer, 0, fmtBuffer.length, fmt.offset + 8);

        // 'NextbaseFR' or 'NextbaseRE'
        var format = fmtBuffer.toString('utf8');
        if(format != '' && format.length > 9) {

            // 'FR' or 'RE'
            var directionIndicator = format.substr(8, 2);

            if(directionIndicator == 'FR') {

                direction = 'F'; 

            } else if (directionIndicator == 'RE') {

                direction = 'R';
            }
        }

    }

    return direction;
}

function computeHash(strData) {
    var md5sum = crypto.createHash('md5');
    md5sum.update(strData);
    return md5sum.digest('hex');
}

function isFileLocked(filePath, cb) {

    if(process.platform == 'darwin') {

        var dirPath = path.dirname(filePath) + path.sep;
        var filename = filePath.replace(dirPath, '')

        exec("ls -lO | grep uchg", {
            cwd: '/Volumes/NEXTBASE/DCIM/PROTECTED/'
        }, function (error, stdout, stderr) {

            if(error) {
                return cb(false);
            }

            if(stdout.indexOf(filename) > -1) {
                return cb(true);
            } else {
                return cb(false);
            }
        });

    } else {

        var stats = fs.statSync(filePath);

        cb(!(2 & parseInt((stats.mode & parseInt("777", 8)).toString(8)[0])));

    }
}

var isQuickTimeFile = function(filePath, fd) {

    // If its a mp4 just return true for the moment.
    if(filePath.substring(filePath.length - 3, filePath.length).toUpperCase() == 'MP4') {
        return true;
    }

    // First make sure we have MOV file
    if (filePath.substring(filePath.length - 3, filePath.length).toUpperCase() !== 'MOV')  {
            return false;
    }

    // Read the bytes 5>11 and make sure we have a QuickTime file.
    //     var ftypBuffer = new Buffer(6);
    //     fs.readSync(fd, ftypBuffer, 0, ftypBuffer.length, 4);
    //     return ftypBuffer.toString('utf8') == 'ftypqt';

    return true; // 300W is not QT file
}

var readFormatString = function (fd, atoms) {

    var format = '';

    // 312GW, 412GW, 512GW, MIRGW
    if(atoms['moov'] 
        && atoms['moov'].childAtoms['udta'] 
        && atoms['moov'].childAtoms['udta'].childAtoms['�fmt']) {

        var inf = atoms['moov'].childAtoms['udta'].childAtoms['�fmt'];
            
        var infoBuffer = new Buffer(10);
        fs.readSync(fd, infoBuffer, 0, infoBuffer.length, inf.offset + 12);
        format = infoBuffer.toString('utf8');

    }

    return format;
}

var readInfoString = function (fd, atoms) {

    var info = '';

    // 312GW, 412GW, 512GW, MIRGW
    if(atoms['moov'] 
        && atoms['moov'].childAtoms['udta'] 
        && atoms['moov'].childAtoms['udta'].childAtoms['�inf']) {

        var inf = atoms['moov'].childAtoms['udta'].childAtoms['�inf'];
         
        var infoBuffer = new Buffer(10);
        fs.readSync(fd, infoBuffer, 0, infoBuffer.length, inf.offset + 12);
        info = infoBuffer.toString('utf8');

    }

    // 612GW, in this case we shouldnt skip 8 bytes in to �inf
    if(atoms['moov'] 
        && atoms['moov'].childAtoms['udta'] 
        && atoms['moov'].childAtoms['udta'].childAtoms['AMBA'] 
        && atoms['moov'].childAtoms['udta'].childAtoms['�inf']) {

        var inf = atoms['moov'].childAtoms['udta'].childAtoms['�inf'];
         
        var infoBuffer = new Buffer(10);
        fs.readSync(fd, infoBuffer, 0, infoBuffer.length, inf.offset + 8);
        info = infoBuffer.toString('utf8');

    }

    // DUOHD
    if(atoms['�inf']) {

        var inf = atoms['�inf'];

        var infoBuffer = new Buffer(10);
        fs.readSync(fd, infoBuffer, 0, infoBuffer.length, inf.offset + 12);
        info = infoBuffer.toString('utf8');
    }

    // 300
    if(atoms['free'] && Array.isArray(atoms['free']) && atoms['free'].length == 2) {

        //log && console.log('Trying 300 Method')

        var free2 = atoms['free'][1];
        //console.dir(atoms['free'])

        var infoBuffer = new Buffer(20);
        fs.readSync(fd, infoBuffer, 0, infoBuffer.length, free2.offset + 36);
        info = infoBuffer.toString('utf8');

    }

    //console.log('info string: ' + info);

    return info;
}

var detectCameraModel = function(atoms, fd, filename) {

    // If the gdat atom is present then it is a file exported from replay
    if(atoms['gdat']) {
        
        return 'REPLAY';
    }

    if(atoms['moov'] 
    && atoms['moov'].childAtoms['udta']){     
        var data = atoms['moov'].childAtoms['udta'];
        var infotemp = new Buffer(80);
        fs.readSync(fd, infotemp, 0, 80, data.offset); 
        var checknum = (infotemp.readInt8(22)^(-1).toString(16));
        if(checknum.toString(16)=='31'){//DVR Protocol 31=19DVR 32=20DVR
            //console.log('19DVR');
            return '19DVR';
        }
        else{
            console.log('detect 19dvr error');
        }
    }

    if(atoms['moov'] 
    && atoms['moov'].childAtoms['udat']){ 
        /* //double check
        var data = atoms['moov'].childAtoms['udat'];
        var infotemp = new Buffer(30);
        fs.readSync(fd, infotemp, 0, 30, data.offset);
        var checknum = infotemp.readInt32BE(8);
        if(checknum.toString(16)=='30303031'){
            //console.log('17DVR');
            return '17DVR';
        }
        else{
            console.log('detect 17dvr error');
        }*/
        return '17DVR';
    }

    if(atoms['moov'] 
    && atoms['moov'].childAtoms['udta']
    && atoms['moov'].childAtoms['udta'].childAtoms['nbid']) {
        
        return '522GW';
    }

    // We can use the �inf to diferenciate up to date cameras
    var info = readInfoString(fd, atoms);;

    if(info.indexOf('212G') > -1) { 
        return '212G';
    }
    if(info.indexOf('212') > -1) { 
        return 'BASIC';
    }
    if(info == 'NBDVR312GW') {
        return '312GW';
    }
    if(info.indexOf('312G') > -1) {
        return '312G';
    }
    if(info == 'NBDVR412GW') {
        return '412GW';
    }
    if(info == 'NBDVR512GW') {
        return '512GW';
    }
    if(info.indexOf('612') > -1) { // Check this way as; <= v1.4, inf = 'NDBDVR612G' (note extra D)
        return '612GW';
    }
    if(info == 'NBDVRDHDGW') {
        return 'DUOHD';
    }
    if(info.indexOf('NBDVR300') > -1) {
        return '300W';
    }
    if(info == 'NBDVR380GW') {
        return '380GW';
    }


    // Try to determine if its a 402 or a ride 
    // This also matches 212!!!!
    if(filename.length == 12 && atoms['thum']) {

        // To distinguish 212A from 402G we check the brand minor version
        // 212A = 512
        // 402G = 0

        var minorVersionBuffer = new Buffer(4);
        fs.readSync(fd, minorVersionBuffer, 0, minorVersionBuffer.length, 12);
        if (minorVersionBuffer.readInt32BE() > 0) {
            return 'BASIC'
        } else {
            return '402G'
        }
    }

    if(info == 'CarDV-TURN') {
        // This is either the 512G or the Ride or old 412

        var format = readFormatString(fd, atoms);

        if(format.indexOf('NVT-IM') > -1) {
            return "412GW";
        }

        var gpsDataLocations = getGpsDataLocations_312GW(fd, atoms); // Works for both
        var buffer = getGpsContentBuffer(fd, gpsDataLocations[0] + 500, 16);

        if(buffer.readInt32LE(0) == 0) {
            return '512G';
        } else {
            return 'RIDE';
        }

    }

    // 612GW some files (protected) dont contain the inf atom, assume if we find AMBA its 612GW
    if(atoms['moov'] 
        && atoms['moov'].childAtoms['udta'] 
        && atoms['moov'].childAtoms['udta'].childAtoms['AMBA']) {

       return '612GW';
    }

    

    //TODO: Add some checks based on filename regex

    // If we find the GPS atom it is a 412GW or 512GW file
    try {
        var atom = atoms['moov'].childAtoms['gps '];

        if(atom) {
            // Now read $\udta\�inf
            var infAtom = atoms['moov'].childAtoms['udta'].childAtoms['�inf'];

            var infBuffer = new Buffer(5);
            fs.readSync(fd, infBuffer, 0, infBuffer.length, infAtom.offset + 12);
    
            var inf = infBuffer.toString('utf8');

            if(inf == 'NT966') {
                return '512GW';
            } 

            if (inf == 'CarDV') {
                return '412GW';
            } 

        }
        if (atom) return 'MIRGW';

    } catch (e) {}

    // If we find the ICAT atom it is a DUOHD file
    try {
        var atom = atoms['ICAT'];

        if (atom) {

            // if bytes 36-40 == 'wide' then its the duo not duohd
            var wideBuffer = new Buffer(4);
            fs.readSync(fd, wideBuffer, 0, wideBuffer.length, 36);

            var wide = wideBuffer.toString('utf8');

            console.log(wide)

            if(wide == 'wide') {
                return 'DUO';
            } else {
                return 'DUOHD';
            }
           

        }

    } catch (e) {}

    // Else it is a 312GW file
    // TODO: not sure this is correct, might need to further validate to know for sure its a 312GW
    // We need to return a basic camera last like the 112 or 212
    return '312GW';
}

var findAtoms = function(fd, curPos, end, depth, loopBreaker, print) {

    var findAtomsProperly = function findAtomsProperly(fd, curPos, end, depth, loopBreaker, print) {

        var atoms = {};

        while (curPos < end) {

            if(loopBreaker-- < 0) {
                log && console.error('Broke loop to stop infinate processing')
                return atoms;
            }

            var atomSize, atomName, childAtoms;

            var sizeBuffer = new Buffer(4);
            fs.readSync(fd, sizeBuffer, 0, sizeBuffer.length, curPos); // From start
            atomSize = sizeBuffer.readUInt32BE(0);

            // EXTENDED SIZE: https://developer.apple.com/standards/qtff-2001.pdf Pg. 19
            if(atomSize == 1) {

                // Read extended size
                var extendedSizeBuffer = new Buffer(8); // 64bit
                fs.readSync(fd, extendedSizeBuffer, 0, extendedSizeBuffer.length, curPos + 8); // From start skipping size and name

                // Cant read 64 bit integers, do it manually
                var high = extendedSizeBuffer.readUInt32BE(0);
                var low = extendedSizeBuffer.readUInt32BE(4);

                atomSize = (high * 0xFFFFFFFF) + low;
            }

            var nameBuffer = new Buffer(4);
            fs.readSync(fd, nameBuffer, 0, nameBuffer.length, curPos + 4);
            atomName = nameBuffer.toString('utf8');

            // SPECIAL CASE FOR 300W LE INT SIZES
            if(atomName == '�fmt' || atomName == '�inf'  || atomName == 'udta' || atomName == '�mac' || atomName == '\u0000\u0000\u0000\u0000') { // If atom we're interested in

          
                if(atomSize > 90 * 1000 * 1000) { // if the size is unreasonable
                    // Try reading it a LE int

                    if(sizeBuffer.readUInt32LE(0) < 10 * 1000) {
                        atomSize = sizeBuffer.readUInt32LE(0);
                    }
                }
            }

            //(log || print) && console.log('%s\t%s%s \t\t%d', pad(curPos.toString(), 12), pad('', depth, '\t'), atomName, atomSize);

            // We're only intrested in some of the atoms
            if (['ftyp', 'frea', 'moov', 'trak', 'mdia', 'minf', 'stbl', 'udta', 'udat', 'free'].indexOf(atomName) > 0) {

                childAtoms = findAtomsProperly(fd, curPos + 8, curPos + atomSize, depth + 1, loopBreaker, print);
                
            }

            var atom = {
                offset: curPos,
                size: atomSize,
                name: atomName,
                childAtoms: childAtoms || []
            };

            // Add to atoms, creating an array if it already exists
            if (atoms[atomName] == undefined) {
                atoms[atomName] = atom;
            } else {
                if (Array.isArray(atoms[atomName])) {
                    atoms[atomName].push(atom)
                } else {
                    var a = atoms[atomName];
                    atoms[atomName] = [a, atom];
                }
            }

            curPos = curPos + atomSize;
        }

        return atoms;

    }

    var atoms = findAtomsProperly(fd, curPos, end, depth, loopBreaker, print);

    // Due to iCatch incompetence we have to do some silly stuff if the atom name is udat.
    if(atoms['ICAT'] && atoms['udat']) {

        var udat = atoms['udat']

        // The last byte of 'udat' is the size of '�inf' + '�fmt', therefore 
        // udat end = udat offset + udat size - last byte of udat as int

        var infFmtSizeBuffer = new Buffer(1);
        fs.readSync(fd, infFmtSizeBuffer, 0, infFmtSizeBuffer.length, udat.offset + udat.size - infFmtSizeBuffer.length); 
        
        var infFmtSize = infFmtSizeBuffer.readInt8(0);

        var udatEnd = udat.offset + udat.size - infFmtSize

        var iCatchAtoms = findAtomsProperly(fd, udatEnd, udat.offset + udat.size, 0, 4);
        
        for(var atomName in iCatchAtoms) {
            atoms[atomName] = iCatchAtoms[atomName];
        }

        log && console.log('read icat');
        log && console.log(atoms['�inf']);
    }

        

    return atoms;
}

function getGpsDataLocations_512G(fd, atoms) {

    // 312GW gps data positions stores in "$\moov\trak(2)\mdia\minf\stbl\stco"
    var stco = atoms['moov']
        .childAtoms['trak'][1] // trak 2
        .childAtoms['mdia']
        .childAtoms['minf']
        .childAtoms['stbl']
        .childAtoms['stco'];

    var locations = [];

    var stcoCountBuffer = new Buffer(4);
    fs.readSync(fd, stcoCountBuffer, 0, stcoCountBuffer.length, stco.offset + 12); // From start
    var stcoCount = stcoCountBuffer.readInt32BE(0);

    for (var i = 0; i < stcoCount; i++) {

        var stcoRecordBuffer = new Buffer(4);
        fs.readSync(fd, stcoRecordBuffer, 0, stcoRecordBuffer.length, stco.offset + 16 + (i * 4));
        var location = stcoRecordBuffer.readInt32BE(0);

        locations.push(location + 0x10000 + 4);
    }

    return locations;
}

function getGpsDataLocations_312GW(fd, atoms) {

    // 312GW gps data positions stores in "$\moov\trak(2)\mdia\minf\stbl\stco"
    var stco = atoms['moov']
        .childAtoms['trak'][1] // trak 2
        .childAtoms['mdia']
        .childAtoms['minf']
        .childAtoms['stbl']
        .childAtoms['stco'];

    var locations = [];

    var stcoCountBuffer = new Buffer(4);
    fs.readSync(fd, stcoCountBuffer, 0, stcoCountBuffer.length, stco.offset + 12); // From start
    var stcoCount = stcoCountBuffer.readInt32BE(0);

    for (var i = 0; i < stcoCount; i++) {

        var stcoRecordBuffer = new Buffer(4);
        fs.readSync(fd, stcoRecordBuffer, 0, stcoRecordBuffer.length, stco.offset + 16 + (i * 4));
        var location = stcoRecordBuffer.readInt32BE(0);

        locations.push(location + 0x10000);
    }

    return locations;
}

function getGpsDataLocations_17DVR(fd, atoms) {
    var udat = atoms['moov'].childAtoms['udat'];
    //console.log('size = %s',udat.size);
    var locations = [];
    var alldata = new Buffer(udat.size);
    fs.readSync(fd, alldata, 0, udat.size, udat.offset);
    for(var i = 0; i < udat.size; i++) {
            //console.log('udat= %d',alldata[i]);
        if(alldata[i] == 10){
            //console.log('i=%s',i);
            locations.push(udat.offset + i + 1);
        }
    }    
    return locations;
}


function getGpsDataLocations_19DVR(fd, atoms) {
    var udat = atoms['moov'].childAtoms['udta'];
    //console.log('size = %s',udat.size);
    var locations = [];
    var alldata = new Buffer(udat.size);
    fs.readSync(fd, alldata, 0, udat.size, udat.offset);
    for(var i = 0; i < udat.size; i++) {
            var data = alldata.readInt8(i)^(-1);
            //console.log(data.toString(16));
            if(data.toString(16) == 'a'){
                //console.log('i=%s',i);
                locations.push(udat.offset + i + 1);
        }
    }    
    return locations
}

function getGpsDataLocations_300W(fd, atoms) {
    
    // 300W gps data positions stored in "$\free[2]\udta"
    var udta = atoms['free'][1].childAtoms['udta'];

    var chunkSize = 56;

    var locations = [];

    var offset = udta.offset + 8; // +8 skip name and size
    while(offset < udta.offset + udta.size) {
        locations.push(offset);
        offset = offset + chunkSize;
    }

    return locations;
}

function getGpsDataLocations_402G(fd, atoms) {
    
    // 402G gps data positions stores in "$\moov\trak(2)\mdia\minf\stbl\stco"

    if(!atoms['moov'] || !atoms['moov'].childAtoms || !Array.isArray(atoms['moov'].childAtoms['trak']) ||  atoms['moov'].childAtoms['trak'].length < 2) {
        return [];
    }

    var stco = atoms['moov']
        .childAtoms['trak'][1] // trak 2
        .childAtoms['mdia']
        .childAtoms['minf']
        .childAtoms['stbl']
        .childAtoms['stco'];

    var locations = [];

    var stcoCountBuffer = new Buffer(4);
    fs.readSync(fd, stcoCountBuffer, 0, stcoCountBuffer.length, stco.offset + 12); // From start
    var stcoCount = stcoCountBuffer.readInt32BE(0);

    log && console.log('stcoCount: ' + stcoCount)

    for (var i = 0; i < stcoCount; i++) {

        log && console.log('getting item location: ' + i);

        var stcoRecordBuffer = new Buffer(4);
        fs.readSync(fd, stcoRecordBuffer, 0, stcoRecordBuffer.length, stco.offset + 16 + (i * 4));
        var location = stcoRecordBuffer.readInt32BE(0);

        var adjustedLocation = location + 0x10000;

        // Now we need to do a quick test to see if we have found the data, if not we will read until we hit freeGPS
        var checkBuffer = new Buffer(7);
        fs.readSync(fd, checkBuffer, 0, checkBuffer.length, adjustedLocation);

        if(checkBuffer.toString('utf8') == 'freeGPS') {
            
            locations.push(adjustedLocation);

        } else {

            // Try adding 65540
            var tryLocation = adjustedLocation + 65540;
            fs.readSync(fd, checkBuffer, 0, checkBuffer.length, tryLocation);

            if(checkBuffer.toString('utf8') == 'freeGPS') {
                
                locations.push(tryLocation - 4);
    
            } else {

                for(var j = adjustedLocation; j < adjustedLocation + 75000; j++) {
    
                    fs.readSync(fd, checkBuffer, 0, checkBuffer.length, j);
    
                    if(checkBuffer.toString('utf8') == 'freeGPS') {
    
                        locations.push(j - 4);
                        break;
                    }
                }

            }

        }
    }

    return locations;
}

function getGpsDataLocations_412GW(fd, atoms) {

    // 312GW gps data positions stores in "$\moov\gps "
    var gps = atoms['moov']
        .childAtoms['gps '];


    var locations = [];

    // Skip first 16 bytes (atomSize(4), atomName(4), someCrap(8)?!?)

    var firstRecordOffset = gps.offset + 16;
    var recordCount = (gps.size - 16) / 8; // Skip 16, 8 Bytes per record

    for (var i = 0; i < recordCount; i++) {

        var recordBuffer = new Buffer(8);
        fs.readSync(fd, recordBuffer, 0, recordBuffer.length, firstRecordOffset + (i * 8));
        var location = recordBuffer.readUInt32BE(0);

        locations.push(location);
    }

    return locations;
}

function getGpsDataLocations_612GW(fd, atoms) {

    if(atoms['moov'] && atoms['moov'].childAtoms['trak'] && Array.isArray(atoms['moov'].childAtoms['trak']) &&  atoms['moov'].childAtoms['trak'].length > 2) {
  
        // 612GW gps data positions stores in "$\moov\trak(3)\mdia\minf\stbl\stco"
        var stco = atoms['moov']
            .childAtoms['trak'][2] // trak 3
            .childAtoms['mdia']
            .childAtoms['minf']
            .childAtoms['stbl']
            .childAtoms['stco'];

        console.dir(atoms['moov']
            .childAtoms['trak'][2])

        var locations = [];

        var stcoCountBuffer = new Buffer(4);
        fs.readSync(fd, stcoCountBuffer, 0, stcoCountBuffer.length, stco.offset + 12); // From start
        var stcoCount = stcoCountBuffer.readInt32BE(0);

        for (var i = 0; i < stcoCount; i++) {

            var stcoRecordBuffer = new Buffer(4);
            fs.readSync(fd, stcoRecordBuffer, 0, stcoRecordBuffer.length, stco.offset + 16 + (i * 4));
            var location = stcoRecordBuffer.readInt32BE(0);

            locations.push(location + 6);
        }

        console.log(locations);

        return locations;

    } else {
        // Probably a timelapse
        return [];
    }
}

function getGpsDataLocations_DUOHD(fd, atoms) {

    // We read the contents of udat (not UDTA) looking for two 'þ' in a row 'þ' = 0xFE
    var udat = atoms['udat'];

    var locations = [];

    var prevChar = '';
    var curChar = '';

    for (var i = udat.offset; i < udat.offset + udat.size; i++) {

        // Read the char
        var buff = new Buffer(1);
        fs.readSync(fd, buff, 0, buff.length, i);

        // Store the char
        prevChar = curChar;
        curChar = buff.toString('hex');

        // Check if we are at the start of a data item
        if(prevChar == 'fe' && curChar == 'fe') {
            // If we are, store the location
            locations.push(i + 1); // + 1 to ignore the last 'fe'
        }

    }

    return locations;
}

function parseGpsContentBuffer_17DVR(contentBuffer) {
    //log && console.log('"' + contentBuffer.toString('utf8') + '"');
    var lat =0,lon=0,x=0,y=0,z=0,northSouth=0,eastWest=0;
    var year=0,month=0,day=0,hour=0,min=0,sec=0;
    var speed=0,bearing=0;
    var index = 0, cnt = 0, num  = 0;
    var parsedLat = 0,parsedLon = 0;
    var datum = 0;

    index = contentBuffer.indexOf(',',cnt);    
    while(index != -1){ //有搜尋到','
        //console.log('index = %d, cnt = %d, num = %d',index,cnt,num);
        if(num == 0){
            hour = parseInt(contentBuffer.toString('utf8', 0, 2));
            min  = parseInt(contentBuffer.toString('utf8', 2, 4));
            sec  = parseInt(contentBuffer.toString('utf8', 4, 6));
		}else if(num == 1){
            day   = parseInt(contentBuffer.toString('utf8', 11, 13));
            month = parseInt(contentBuffer.toString('utf8', 13, 15));
            year  = parseInt(contentBuffer.toString('utf8', 15, 17));
		}else if(num == 2){
            datum = parseInt(contentBuffer.toString('utf8', cnt, index));
		}else if(num == 3){
            lat = parseFloat(contentBuffer.toString('utf8', cnt, index));
		}else if(num == 4){
            northSouth = contentBuffer.toString('utf8', cnt, index);
		}else if(num == 5){
            lon = parseFloat(contentBuffer.toString('utf8', cnt, index));
		}else if(num == 6){
            eastWest = contentBuffer.toString('utf8', cnt, index);
		}else if(num == 7){
            speed = parseFloat(contentBuffer.toString('utf8', cnt, index));
		}else if(num == 8){
            bearing = parseFloat(contentBuffer.toString('utf8', cnt, index));
		}else if(num == 9){
            x = parseFloat(contentBuffer.toString('utf8', cnt, index));
		}else if(num == 10){
            y = parseFloat(contentBuffer.toString('utf8', cnt, index));
		}else if(num == 11){
            z = parseFloat(contentBuffer.toString('utf8', cnt, index));
		}else if(num == 12){

        }else if(num == 13){

		}else if(num == 14){

		}else{

		}
        num++;
        cnt = index + 1;
        index = contentBuffer.indexOf(',',cnt);
    }

    var gpsStatus = 'V';
    if(northSouth == 'N' || northSouth == 'S')
    { //有解析出GPS
        gpsStatus = 'A';
        if(datum == 1)//TOKYO Datum
        {
            var tempparsedLat = 0,tempparsedLon = 0;
            tempparsedLat = parseLatLon(lat, (northSouth == 'N' ? 1 : -1));
            tempparsedLon = parseLatLon(lon, (eastWest == 'E' ? 1 : -1));
            //日本測地系←→世界測地系の変換処理
            //wy = jy - jy * 0.00010695 + jx * 0.000017464 + 0.0046017
            //wx = jx - jy * 0.000046038 - jx * 0.000083043 + 0.010040
            //wy：世界測地系 緯度、wx：世界測地系 経度、jy：日本測地系 緯度、jx：日本測地系 経度
            parsedLat = tempparsedLat - tempparsedLat * 0.00010695 + tempparsedLon * 0.000017464 + 0.0046017;
            parsedLon = tempparsedLon - tempparsedLat * 0.000046038 - tempparsedLon * 0.000083043 + 0.010040;
            //console.log("parsedLat = "+parsedLat+"; parsedLon = "+parsedLon);
            //console.log("tempparsedLat = "+tempparsedLat+"; tempparsedLon = "+tempparsedLon);
        }
        else
        {
            parsedLat = parseLatLon(lat, (northSouth == 'N' ? 1 : -1));
            parsedLon = parseLatLon(lon, (eastWest == 'E' ? 1 : -1));
        }
            
        
    }    
    
    // Make sure we have the full year, not just 16
    if (year < 2000) year = year + 2000;
    

    var gpsData = {

        datetime: new Date(year, month - 1, day, hour, min, sec),

        gpsStatus: gpsStatus, // Active or Void
        lat: parsedLat, //[+/-]HHMM.SSSSSSSS, +North -South
        lon: parsedLon, //[+/-]HHMM.SSSSSSSS, +East -West

        speed: knotsToMPH(speed), // MPH
        bearing: bearing, // Degrees

        // See table above for these translations
        xAcc: x,
        yAcc: y,// * -1,
        zAcc: z// * -1
    };
    //console.dir(gpsData);
    if(gpsData.datetime.isDstObserved()) {
        gpsData.datetime.setHours(gpsData.datetime.getHours() + 1);
    }

    // We lower these values so downward force (gravity) is roughly 1.
    gpsData.xAcc = gpsData.xAcc / 512;
    gpsData.yAcc = (gpsData.yAcc / 512);// + 1;
    gpsData.zAcc = gpsData.zAcc / 512;

    return gpsData;
}


function parseGpsContentBuffer_19DVR(contentBuffer) {
    var newbuffer = new Buffer(contentBuffer.length);    
    for (var i = 0; i < contentBuffer.length; i++) {
        newbuffer[i] = (contentBuffer.readInt8(i)^(-1).toString(16));
        //console.log(newbuffer[i]);
    }
    //console.log(newbuffer.toString('utf8'));
    var lat =0,lon=0,x=0,y=0,z=0,northSouth=0,eastWest=0;
    var year=0,month=0,day=0,hour=0,min=0,sec=0;
    var speed=0,bearing=0;
    var index = 0, cnt = 0, num  = 0;
    var parsedLat = 0,parsedLon = 0;
    var datum = 0;

    index = newbuffer.indexOf(',',cnt);    
    while(index != -1){ //有搜尋到','
        //console.log('index = %d, cnt = %d, num = %d',index,cnt,num);
        if(num == 0){
            hour = parseInt(newbuffer.toString('utf8', 0, 2));
            min  = parseInt(newbuffer.toString('utf8', 2, 4));
            sec  = parseInt(newbuffer.toString('utf8', 4, 6));
		}else if(num == 1){
            day   = parseInt(newbuffer.toString('utf8', 11, 13));
            month = parseInt(newbuffer.toString('utf8', 13, 15));
            year  = parseInt(newbuffer.toString('utf8', 15, 17));
		}else if(num == 2){
            datum = parseInt(newbuffer.toString('utf8', cnt, index));
		}else if(num == 3){
            lat = parseFloat(newbuffer.toString('utf8', cnt, index));
		}else if(num == 4){
            northSouth = newbuffer.toString('utf8', cnt, index);
		}else if(num == 5){
            lon = parseFloat(newbuffer.toString('utf8', cnt, index));
		}else if(num == 6){
            eastWest = newbuffer.toString('utf8', cnt, index);
		}else if(num == 7){
            speed = parseFloat(newbuffer.toString('utf8', cnt, index));
		}else if(num == 8){
            bearing = parseFloat(newbuffer.toString('utf8', cnt, index));
		}else if(num == 9){
            x = parseFloat(newbuffer.toString('utf8', cnt, index));
		}else if(num == 10){
            y = parseFloat(newbuffer.toString('utf8', cnt, index));
		}else if(num == 11){
            z = parseFloat(newbuffer.toString('utf8', cnt, index));
		}else if(num == 12){

        }else if(num == 13){

		}else if(num == 14){

		}else if(num == 15){

		}
        num++;
        cnt = index + 1;
        index = newbuffer.indexOf(',',cnt);
    }
    var gpsStatus = 'V';
    if(northSouth == 'N' || northSouth == 'S')
    { //有解析出GPS
        gpsStatus = 'A';
        if(datum == 1)//TOKYO Datum
        {
            var tempparsedLat = 0,tempparsedLon = 0;
            tempparsedLat = parseLatLon(lat, (northSouth == 'N' ? 1 : -1));
            tempparsedLon = parseLatLon(lon, (eastWest == 'E' ? 1 : -1));
            //日本測地系←→世界測地系の変換処理
            //wy = jy - jy * 0.00010695 + jx * 0.000017464 + 0.0046017
            //wx = jx - jy * 0.000046038 - jx * 0.000083043 + 0.010040
            //wy：世界測地系 緯度、wx：世界測地系 経度、jy：日本測地系 緯度、jx：日本測地系 経度
            parsedLat = tempparsedLat - tempparsedLat * 0.00010695 + tempparsedLon * 0.000017464 + 0.0046017;
            parsedLon = tempparsedLon - tempparsedLat * 0.000046038 - tempparsedLon * 0.000083043 + 0.010040;
            //console.log("parsedLat = "+parsedLat+"; parsedLon = "+parsedLon);
            //console.log("tempparsedLat = "+tempparsedLat+"; tempparsedLon = "+tempparsedLon);
        }
        else
        {
            parsedLat = parseLatLon(lat, (northSouth == 'N' ? 1 : -1));
            parsedLon = parseLatLon(lon, (eastWest == 'E' ? 1 : -1));
        }            
    }

    // Make sure we have the full year, not just 16
    if (year < 2000) year = year + 2000;

    
    var gpsData = {

        datetime: new Date(year, month - 1, day, hour, min, sec),

        gpsStatus: gpsStatus, // Active or Void
        lat: parsedLat, //[+/-]HHMM.SSSSSSSS, +North -South
        lon: parsedLon, //[+/-]HHMM.SSSSSSSS, +East -West

        speed: knotsToMPH(speed), // MPH
        bearing: bearing, // Degrees

        // See table above for these translations
        xAcc: x,
        yAcc: y,// * -1,
        zAcc: z //* -1
    };
    //console.dir(gpsData);
    if(gpsData.datetime.isDstObserved()) {
        gpsData.datetime.setHours(gpsData.datetime.getHours() + 1);
    }

    // We lower these values so downward force (gravity) is roughly 1.
    gpsData.xAcc = gpsData.xAcc / 512;
    gpsData.yAcc = (gpsData.yAcc / 512);// + 1;
    gpsData.zAcc = gpsData.zAcc / 512;

    return gpsData;
}

function parseGpsContentBuffer_312GW(contentBuffer) {

    /** G Sensor Data
                X-      X+      Y-      Y+      Z-      Z+
        RAW     LEFT    RGHT    UP      DOWN    FRWD    BKWD ????
        NORM    RGHT    LEFT    DOWN    UP      BKWD    FRWD
    **/

    log && console.log('"' + contentBuffer.toString('utf8') + '"')

    var atomSize = contentBuffer.readUInt32BE(0);
    var atomName = contentBuffer.toString('utf8', 4, 8);
    var subAtomName = contentBuffer.toString('utf8', 8, 16);

    var buildDate = contentBuffer.toString('utf8', 16, 32);
    var utcDate = contentBuffer.toString('utf8', 32, 48);

    var hour = contentBuffer.readUInt32LE(48);
    var min = contentBuffer.readUInt32LE(52);
    var sec = contentBuffer.readUInt32LE(56);
    var year = contentBuffer.readUInt32LE(60);
    var month = contentBuffer.readUInt32LE(64);
    var day = contentBuffer.readUInt32LE(68);

    var gpsStatus = contentBuffer.toString('utf8', 72, 73);
    var northSouth = contentBuffer.toString('utf8', 73, 74);
    var eastWest = contentBuffer.toString('utf8', 74, 75);
    var lat = contentBuffer.readFloatLE(76);
    var lon = contentBuffer.readFloatLE(80);
    var speed = contentBuffer.readFloatLE(84);
    var bearing = contentBuffer.readFloatLE(88);

    var x = contentBuffer.readInt32LE(88 + 52 + 4);
    var y = contentBuffer.readInt32LE(88 + 52 + 8);
    var z = contentBuffer.readInt32LE(88 + 52 + 12);

    // The above x,y,z are for a old FW version, if they are 0 then try to read from the new location
    //if((x + y + z) < 10) {
        x = contentBuffer.readInt32LE(88 + 0 + 4);
        y = contentBuffer.readInt32LE(88 + 0 + 8);
        z = contentBuffer.readInt32LE(88 + 0 + 12);
   // }

    //log && console.log('Speed: %f, Bearing: %f', speed, bearing)

    var parsedLat = parseLatLon(lat, (northSouth == 'N' ? 1 : -1));
    var parsedLon = parseLatLon(lon, (eastWest == 'E' ? 1 : -1));

    // Make sure we have the full year, not just 16
    if (year < 2000) year = year + 2000;

    // If 0 0 assume error
    if(parsedLat + parsedLon == 0) {
        gpsStatus = 'V';
    }

    var gpsData = {

        datetime: new Date(year, month - 1, day, hour, min, sec),

        gpsStatus: gpsStatus, // Active or Void
        lat: parsedLat, //[+/-]HHMM.SSSSSSSS, +North -South
        lon: parsedLon, //[+/-]HHMM.SSSSSSSS, +East -West

        speed: knotsToMPH(speed), // MPH
        bearing: bearing, // Degrees

        // See table above for these translations
        xAcc: x,
        yAcc: y * -1,
        zAcc: z * -1
    };

    if(gpsData.datetime.isDstObserved()) {
        gpsData.datetime.setHours(gpsData.datetime.getHours() + 1);
    }

    // We lower these values so downward force (gravity) is roughly 1.
    gpsData.xAcc = gpsData.xAcc / 256;
    gpsData.yAcc = (gpsData.yAcc / 256) + 1;
    gpsData.zAcc = gpsData.zAcc / 256;

    return gpsData;
}

function parseGpsContentBuffer_300W(contentBuffer) {
    
        /** G Sensor Data
                    X-      X+      Y-      Y+      Z-      Z+
            RAW     LEFT    RGHT    UP      DOWN    FRWD    BKWD ????
            NORM    RGHT    LEFT    DOWN    UP      BKWD    FRWD
        **/
    
        log && console.log('"' + contentBuffer.toString('utf8') + '"')
    
        var hour = contentBuffer.readUInt32LE(0);
        var min = contentBuffer.readUInt32LE(4);
        var sec = contentBuffer.readUInt32LE(8);
        var year = contentBuffer.readUInt32LE(12);
        var month = contentBuffer.readUInt32LE(16);
        var day = contentBuffer.readUInt32LE(20);
    
       

        var gpsStatus = 'V';
        var northSouth = '';
        var eastWest = '';
        var lat = 0;
        var lon = 0;
        var speed = 0;
        var bearing = 0;
    
        var x = contentBuffer.readInt32LE(44);
        var y = contentBuffer.readInt32LE(48);
        var z = contentBuffer.readInt32LE(52);

        var gpsData = {
    
            datetime: new Date(year, month - 1, day, hour, min, sec),
    
            gpsStatus: gpsStatus, // Active or Void
            lat: lat, //[+/-]HHMM.SSSSSSSS, +North -South
            lon: lon, //[+/-]HHMM.SSSSSSSS, +East -West
    
            speed: speed, // MPH
            bearing: bearing, // Degrees
    
            // See table above for these translations
            xAcc: x,
            yAcc: y,
            zAcc: z
        };
    
        // We lower these values so downward force (gravity) is roughly 1.
        gpsData.xAcc = gpsData.xAcc / 256;
        gpsData.yAcc = (gpsData.yAcc / 256) - 1;
        gpsData.zAcc = gpsData.zAcc / 256;
    
        return gpsData;
    }
    

function parseGpsContentBuffer_402G(contentBuffer, itemIndex) {
    
    // Check it is freeGPS
    if(contentBuffer.toString('utf8', 4, 11) == 'freeGPS') {

        // Remove first 32 bytes of buffer to get content
        var gpsBuffer = contentBuffer.slice(32);

        function funcC(buffer, offset) {
            return buffer[offset + 21] == 65 
                    && buffer[offset + 22] == 84 
                    && buffer[offset + 23] == 67 
                    && buffer[offset + 29] == 48
                    && buffer[offset + 30] == 48 
                    && buffer[offset + 31] == 49;
        }
        function funcB3(buffer, offset) {
            var maxByteVal = 255;
    
            var num1 = 0;
            var num2 = 0;
            for (var index = 0; index < 50; ++index) {
                num1 = num1 + buffer[index + offset] & maxByteVal;
                num2 = num2 + num1 & maxByteVal;
            }
            var num3 = maxByteVal - (num1 + num2 & maxByteVal);
            var num4 = maxByteVal - (num1 + num3 & maxByteVal);
            return buffer[50 + offset] == num3 && buffer[51 + offset] == num4;
        }
        function readGSensorData(gpsBuffer, offset) {
            function parseGSensorValue(val) {
                //console.info(val)
                return val / 100;
                //return val >= 128 ? val - 256 + 128 : val + 128;
            }
            return {
                xAcc: parseGSensorValue(gpsBuffer.readInt32LE(offset)),
                yAcc: parseGSensorValue(gpsBuffer.readInt32LE(offset + 4)),
                zAcc: parseGSensorValue(gpsBuffer.readInt32LE(offset + 8))
            };
        }
        function readGPSData(gpsBuffer, offset) {
            
            var result = {};

            var num1 = gpsBuffer[20 + offset];
            var num2 = gpsBuffer[28 + offset];
    
            for (var index = 0; index < 28; ++index)
                gpsBuffer[index + offset] ^= num1;
    
            for (var index = 28; index < 52; ++index)
                gpsBuffer[index + offset] ^= num2;
            
            if (gpsBuffer[offset] != 1) {
                result.activeVoid = 'V';
            } else {
    
                var date = gpsBuffer.readInt32LE(4 + offset);
                result.year = ((date >> 9) & 4095);
                result.month = (date >> 5 & 15);
                result.day = (date & 31);
    
                var time = gpsBuffer.readInt32LE(8 + offset);
                result.hour = (time >> 12 & 31);
                result.min = (time >> 6 & 63);
                result.sec = (time & 63);
    
                result.lat = gpsBuffer.readInt32LE(offset + 16) / 10000000.0;
                result.lon = gpsBuffer.readInt32LE(offset + 24) / 10000000.0;
    
                result.speed = gpsBuffer.readInt32LE(offset + 32) * 0.0219;
                result.bearing = (gpsBuffer.readInt16LE(36 + offset) * 0.01);
                if(result.bearing < 0) {
                    result.bearing = 360 + result.bearing;
                }
    
                result.activeVoid = gpsBuffer[12 + offset] == 0 ? 'V' : 'A';

                //console.log(result)
            }
            return result;
        }

        if (funcC(gpsBuffer, 16) && false | funcB3(gpsBuffer, 16)) { // | = bitwise or
            
            var gSensorData = readGSensorData(gpsBuffer, 1576);
            var tempGPSData = [];

            for (var index = 0; index < 30; ++index) {
                if (funcC(gpsBuffer, 16 + index * 52) && funcB3(gpsBuffer, 16 + index * 52)) {
                    tempGPSData.push(readGPSData(gpsBuffer, 16 + index * 52));
                }
                else {
                    tempGPSData.push({ activeVoid: 'V' });
                }
            }

            // Now we have to sum the lat, lon, speed and bearing to average it later
            var sumLat = 0, sumLon = 0, sumSpeed = 0, sumBearing = 0;
            var countValid = 0;
            var firstValidItem = false;
            for(var j = 0; j < tempGPSData.length; j++) {
                var item = tempGPSData[j];
                if(item.activeVoid == 'A') {
                    countValid += 1;
                    sumLat += item.lat;
                    sumLon += item.lon;
                    sumSpeed += item.speed;
                    sumBearing += item.bearing;
                    if(!firstValidItem) {
                        firstValidItem = item;
                    }
                }
            }

            // Finally form the final gps data item for this seccond of video
            return {
                datetime: new Date(firstValidItem.year, firstValidItem.month - 1, firstValidItem.day, firstValidItem.hour, firstValidItem.min, firstValidItem.sec),
        
                gpsStatus: firstValidItem ? 'A' : 'V', // Active or Void
                lat: sumLat / countValid, //[+/-]HHMM.SSSSSSSS, +North -South
                lon: sumLon / countValid, //[+/-]HHMM.SSSSSSSS, +East -West
        
                speed: sumSpeed / countValid, // MPH
                bearing: sumBearing / countValid, // Degrees
        
                // See table above for these translations
                yAcc: 0,//gSensorData.yAcc + 0.1,
                xAcc: 0,//gSensorData.xAcc,
                zAcc: 0,//gSensorData.zAcc
            };

        }
        else {
            return { gpsStatus: 'V' };
        }
    }
}

function parseGpsContentBuffer_512G(contentBuffer, index) {

    /** G Sensor Data
                X-      X+      Y-      Y+      Z-      Z+
        RAW     LEFT    RGHT    UP      DOWN    FRWD    BKWD ????
        NORM    RGHT    LEFT    DOWN    UP      BKWD    FRWD
    **/

    //log && console.log('"' + contentBuffer.toString('hex') + '"')

    var gpsStatus = 'A';

    var buildDate = contentBuffer.toString('utf8', 16, 32);
    var utcDate = contentBuffer.toString('utf8', 32, 48);

    
    var year = contentBuffer.readUInt16BE(54);
    var month = contentBuffer.readInt8(56);
    var day = contentBuffer.readInt8(57);
    var hour = contentBuffer.readInt8(58);
    var min = contentBuffer.readInt8(59);
    var sec = 0;

    var lat = contentBuffer.readInt32BE(63) / 10000000;
    var lon = contentBuffer.readInt32BE(67) / 10000000;

    var speed = knotsToMPH(contentBuffer.readUInt16BE(50)/ 51);
    var bearing = contentBuffer.readUInt16BE(52) / 100;

    //log && console.log(index, year, month, day, hour, min, sec)
    //log && console.log(index, lat, lon)

    // GPS data is at 10Hz take a average of the good values?
    var sumSpeed = 0, countSpeed = 0;
    for(var i = 0; i < 10; i++) {

        var s = contentBuffer.readUInt16BE(50 + (i * 32));
        if (s >= 1) {
            sumSpeed += s;
            countSpeed++;
        }

    }
    speed = knotsToMPH(sumSpeed / countSpeed) / 52;  
    if(isNaN(speed)) { 
        speed = 0; 
    }  

    log && console.log(index, Math.floor(speed), speed)

    //return;

    var x = 0;
    var y = 0;
    var z = 0;

    var gpsData = {

        datetime: new Date(year, month - 1, day, hour, min, sec),

        gpsStatus: gpsStatus, // Active or Void
        lat: lat, //[+/-]HHMM.SSSSSSSS, +North -South
        lon: lon, //[+/-]HHMM.SSSSSSSS, +East -West

        speed: speed, // MPH
        bearing: bearing, // Degrees

        // See table above for these translations
        xAcc: x,
        yAcc: y,
        zAcc: z
    };

    return gpsData;
}

function parseGpsContentBuffer_312G(contentBuffer) {

    /** G Sensor Data
                X-      X+      Y-      Y+      Z-      Z+
        RAW     UP      DOWN    RGHT    LEFT    FRWD    BKWD
        NORM    RGHT    LEFT    DOWN    UP      BKWD    FRWD
    **/

    // This means that this has moved too
    var x = contentBuffer.readInt32LE(80 - 12);
    var y = contentBuffer.readInt32LE(80 - 8);
    var z = contentBuffer.readInt32LE(80 - 4);

    var rmc = contentBuffer.toString('utf8', 81, 152)
    var gpgga = contentBuffer.toString('utf8', 208, 288)

    if(gpgga.indexOf('$GPGGA') == -1) {
        gpgga = '';
    }

    var key = contentBuffer.toString('utf8', 264, 274)

    var rmcData = parseGPRMC(rmc);

    console.log(contentBuffer.toString('utf8', 81, 170))

    if (!rmcData) {
        return false;
    }

    var parsedLat = parseLatLon(rmcData.lat, (rmcData.northSouth == 'N' ? 1 : -1));
    var parsedLon = parseLatLon(rmcData.lon, (rmcData.eastWest == 'E' ? 1 : -1));

    var gpsData = {
        datetime: new Date(rmcData.year, rmcData.month - 1, rmcData.day, rmcData.hour, rmcData.min, rmcData.sec),

        gpsStatus: rmcData.gpsStatus, // Active or Void
        lat: parsedLat, //[+/-]HHMM.SSSSSSSS, +North -South
        lon: parsedLon, //[+/-]HHMM.SSSSSSSS, +East -West

        speed: knotsToMPH(rmcData.speed), // MPH
        bearing: rmcData.bearing, // Degrees

        // See table above for these translations
        xAcc: y * -1,
        yAcc: x * -1,
        zAcc: z * -1,

        gpgga: gpgga,

        _raw: null //contentBuffer.toString('utf8')
    };

    if(gpsData.datetime.isDstObserved()) {
        gpsData.datetime.setHours(gpsData.datetime.getHours() + 1);
    }

    // We lower these values so downward force (gravity) is roughly 1.
    gpsData.xAcc = (gpsData.xAcc / 256);
    gpsData.yAcc = (gpsData.yAcc / 256) + 1;
    gpsData.zAcc = gpsData.zAcc / 256;

    return gpsData;
}

function parseGpsContentBuffer_412GW(contentBuffer) {

    /** G Sensor Data
                X-      X+      Y-      Y+      Z-      Z+
        RAW     UP      DOWN    RGHT    LEFT    FRWD    BKWD
        NORM    RGHT    LEFT    DOWN    UP      BKWD    FRWD
    **/

    var x = contentBuffer.readInt32LE(136 - 12);
    var y = contentBuffer.readInt32LE(136 - 8);
    var z = contentBuffer.readInt32LE(136 - 4);

    var rmc = contentBuffer.toString('utf8', 136, 207)
    var gpgga = contentBuffer.toString('utf8', 208, 288)

    if(gpgga.indexOf('$GPGGA') == -1) {
        gpgga = '';
    }

    var key = contentBuffer.toString('utf8', 264, 274)

    var rmcData = parseGPRMC(rmc);

    if (!rmcData) {
        log && console.log('"' + rmc)

        // Try reading from other position
        rmc = contentBuffer.toString('utf8', 81, 152)
        rmcData = parseGPRMC(rmc);

        // This means that this has moved too
        x = contentBuffer.readInt32LE(80 - 12);
        y = contentBuffer.readInt32LE(80 - 8);
        z = contentBuffer.readInt32LE(80 - 4);

        // /console.log(contentBuffer.toString('hex', 81 - 12, 81 - 12 + 4))

        if (!rmcData) {
            return false;
        }
    }

    var parsedLat = parseLatLon(rmcData.lat, (rmcData.northSouth == 'N' ? 1 : -1));
    var parsedLon = parseLatLon(rmcData.lon, (rmcData.eastWest == 'E' ? 1 : -1));

    var gpsData = {
        datetime: new Date(rmcData.year, rmcData.month - 1, rmcData.day, rmcData.hour, rmcData.min, rmcData.sec),

        gpsStatus: rmcData.gpsStatus, // Active or Void
        lat: parsedLat, //[+/-]HHMM.SSSSSSSS, +North -South
        lon: parsedLon, //[+/-]HHMM.SSSSSSSS, +East -West

        speed: knotsToMPH(rmcData.speed), // MPH
        bearing: rmcData.bearing, // Degrees

        // See table above for these translations
        xAcc: y * -1,
        yAcc: x * -1,
        zAcc: z * -1,

        gpgga: gpgga,

        _raw: null //contentBuffer.toString('utf8')
    };

    if(gpsData.datetime.isDstObserved()) {
        gpsData.datetime.setHours(gpsData.datetime.getHours() + 1);
    }

    // We lower these values so downward force (gravity) is roughly 1.
    gpsData.xAcc = (gpsData.xAcc / 256) - 1;
    gpsData.yAcc = (gpsData.yAcc / 256);
    gpsData.zAcc = gpsData.zAcc / 256;

    return gpsData;
}

function parseGpsContentBuffer_212G(contentBuffer) {
    
    /** G Sensor Data
                X-      X+      Y-      Y+      Z-      Z+
        RAW     UP      DOWN    RGHT    LEFT    FRWD    BKWD
        NORM    RGHT    LEFT    DOWN    UP      BKWD    FRWD
    **/

    var x = contentBuffer.readInt32LE(80 - 12);
    var y = contentBuffer.readInt32LE(80 - 8);
    var z = contentBuffer.readInt32LE(80 - 4);

    var rmc = contentBuffer.toString('utf8', 80, 207)

    console.log(rmc)

    //console.log("X:%d Y:%d Z:%d", x, y, z)

    var rmcData = parseGPRMC(rmc);

    

    if (!rmcData) {
        // Unable to parse the data
        //TODO: throw a error or something?
        return false;
    }

    var parsedLat = parseLatLon(rmcData.lat, (rmcData.northSouth == 'N' ? 1 : -1));
    var parsedLon = parseLatLon(rmcData.lon, (rmcData.eastWest == 'E' ? 1 : -1));

    var gpsData = {
        datetime: new Date(rmcData.year, rmcData.month - 1, rmcData.day, rmcData.hour, rmcData.min, rmcData.sec),

        gpsStatus: rmcData.gpsStatus, // Active or Void
        lat: parsedLat, //[+/-]HHMM.SSSSSSSS, +North -South
        lon: parsedLon, //[+/-]HHMM.SSSSSSSS, +East -West

        speed: knotsToMPH(rmcData.speed), // MPH
        bearing: rmcData.bearing, // Degrees

        // See table above for these translations
        xAcc: y * -1,
        yAcc: x * -1,
        zAcc: z * -1,

        _raw: null //contentBuffer.toString('utf8')
    };

    if(gpsData.datetime.isDstObserved()) {
        gpsData.datetime.setHours(gpsData.datetime.getHours() + 1);
    }

    // We lower these values so downward force (gravity) is roughly 1.
    gpsData.xAcc = (gpsData.xAcc / 256);
    gpsData.yAcc = (gpsData.yAcc / 256) + 1;
    gpsData.zAcc = gpsData.zAcc / 256;

    return gpsData;
}

function parseGpsContentBuffer_380GW(contentBuffer) {

    /** G Sensor Data
                X-      X+      Y-      Y+      Z-      Z+
        RAW     UP      DOWN    RGHT    LEFT    FRWD    BKWD
        NORM    RGHT    LEFT    DOWN    UP      BKWD    FRWD
    **/

    var x = contentBuffer.readInt32LE(136 - 12);
    var y = contentBuffer.readInt32LE(136 - 8);
    var z = contentBuffer.readInt32LE(136 - 4);

    var rmc = contentBuffer.toString('utf8', 136, 207)

    var rmcData = parseGPRMC(rmc);


    if (!rmcData) {
        // Unable to parse the data
        //TODO: throw a error or something?
        return false;
    }

    var parsedLat = 0;
    var parsedLon = 0;

    if(rmcData.gpsStatus == 'A') {
        parsedLat = parseLatLon(rmcData.lat, (rmcData.northSouth == 'N' ? 1 : -1));
        parsedLon = parseLatLon(rmcData.lon, (rmcData.eastWest == 'E' ? 1 : -1));
    } else {
        rmcData.speed = 0;
        rmcData.bearing = 0;
    }
    
    var gpsData = {
        datetime: new Date(rmcData.year, rmcData.month - 1, rmcData.day, rmcData.hour, rmcData.min, rmcData.sec),

        gpsStatus: rmcData.gpsStatus, // Active or Void
        lat: parsedLat, //[+/-]HHMM.SSSSSSSS, +North -South
        lon: parsedLon, //[+/-]HHMM.SSSSSSSS, +East -West

        speed: knotsToMPH(rmcData.speed), // MPH
        bearing: rmcData.bearing, // Degrees

        // See table above for these translations
        xAcc: y * -1,
        yAcc: x * -1,
        zAcc: z * -1,

        _raw: null //contentBuffer.toString('utf8')
    };

    // We lower these values so downward force (gravity) is roughly 1.
    gpsData.xAcc = (gpsData.xAcc / 256);
    gpsData.yAcc = (gpsData.yAcc / 256);
    gpsData.zAcc = (gpsData.zAcc / 256) - 1;

    return gpsData;
}

function parseGpsContentBuffer_512GW(contentBuffer) {

    /** G Sensor Data
                X-      X+      Y-      Y+      Z-      Z+
        RAW     UP      DOWN    RGHT    LEFT    FRWD    BKWD
        NORM    RGHT    LEFT    DOWN    UP      BKWD    FRWD
    **/

    var x = contentBuffer.readInt32LE(136 - 12);
    var y = contentBuffer.readInt32LE(136 - 8);
    var z = contentBuffer.readInt32LE(136 - 4);

    var rmc = contentBuffer.toString('utf8', 136, 207)
    var key = contentBuffer.toString('utf8', 264, 274)

    //console.log("X:%d Y:%d Z:%d", x, y, z)

    var rmcData = parseGPRMC(rmc);

    if (!rmcData) {
        log && console.log('"' + rmc)

        // Try reading from other position
        rmc = contentBuffer.toString('utf8', 81, 152)
        rmcData = parseGPRMC(rmc);

        // This means that this has moved too
        x = contentBuffer.readInt32LE(80 - 12);
        y = contentBuffer.readInt32LE(80 - 8);
        z = contentBuffer.readInt32LE(80 - 4);

        // /console.log(contentBuffer.toString('hex', 81 - 12, 81 - 12 + 4))

        if (!rmcData) {
            return false;
        }
    }

    var parsedLat = parseLatLon(rmcData.lat, (rmcData.northSouth == 'N' ? 1 : -1));
    var parsedLon = parseLatLon(rmcData.lon, (rmcData.eastWest == 'E' ? 1 : -1));

    var gpsData = {
        datetime: new Date(rmcData.year, rmcData.month - 1, rmcData.day, rmcData.hour, rmcData.min, rmcData.sec),

        gpsStatus: rmcData.gpsStatus, // Active or Void
        lat: parsedLat, //[+/-]HHMM.SSSSSSSS, +North -South
        lon: parsedLon, //[+/-]HHMM.SSSSSSSS, +East -West

        speed: knotsToMPH(rmcData.speed), // MPH
        bearing: rmcData.bearing, // Degrees

        // See table above for these translations
        xAcc: y * -1,
        yAcc: x * -1,
        zAcc: z * -1,

        _raw: null //contentBuffer.toString('utf8')
    };

    if(gpsData.datetime.isDstObserved()) {
        gpsData.datetime.setHours(gpsData.datetime.getHours() + 1);
    }

    // These values indicate its a time lapse video w/o g sensor data
    if(x == 1800 && y == 1000 && z == 1000) {
        
        gpsData.xAcc = 0;
        gpsData.yAcc = 0;
        gpsData.zAcc = 0;

    } else {

        // We lower these values so downward force (gravity) is roughly 1.
        gpsData.xAcc = gpsData.xAcc / 256;
        gpsData.yAcc = (gpsData.yAcc / 256) + 1;
        gpsData.zAcc = gpsData.zAcc / 256;

    }

    return gpsData;
}

function parseGpsContentBuffer_612GW(contentBuffer) {

    /** G Sensor Data
                X-      X+      Y-      Y+      Z-      Z+
        RAW     UP      DOWN    RGHT    LEFT    FRWD    BKWD
        NORM    RGHT    LEFT    DOWN    UP      BKWD    FRWD
    **/

    //console.log("X:%d Y:%d Z:%d", contentBuffer.readInt32BE(16), contentBuffer.readInt32BE(20), contentBuffer.readInt32BE(24))
    log && console.log("X:%d Y:%d Z:%d", contentBuffer.readInt32LE(16), contentBuffer.readInt32LE(20), contentBuffer.readInt32LE(24))

    // 0001 = +0.001 
    // 1000 = +1.000
    // 3000 = -1.000
    // 3999 = -0.001
    function parseAMBAGSensorValue(rawValue) {

        if(rawValue > 2000) {
            return (4000 - rawValue) / 1000 * -1;
        } else {
            return rawValue / 1000;
        }

    }

    var x = parseAMBAGSensorValue(contentBuffer.readInt32LE(16));
    var y = parseAMBAGSensorValue(contentBuffer.readInt32LE(20));
    var z = parseAMBAGSensorValue(contentBuffer.readInt32LE(24));

    var rmc = contentBuffer.toString('utf8', 28, 99)

    log && console.log("X:%d Y:%d Z:%d", x, y, z)

    //log && console.log(rmc)

    var rmcData = parseGPRMC(rmc);

    if (!rmcData) {
        // Unable to parse the data
        //TODO: throw a error or something?
        return false;
    }

    var parsedLat = parseLatLon(rmcData.lat, (rmcData.northSouth == 'N' ? 1 : -1));
    var parsedLon = parseLatLon(rmcData.lon, (rmcData.eastWest == 'E' ? 1 : -1));

    // RMC Date isn't adjusted for DST
    var year = parseInt(contentBuffer.toString('utf8', 0, 4));
    var month = parseInt(contentBuffer.toString('utf8', 4, 6));
    var day = parseInt(contentBuffer.toString('utf8', 6, 8));
    var hour = parseInt(contentBuffer.toString('utf8', 8, 10));
    var min = parseInt(contentBuffer.toString('utf8', 10, 12));
    var sec = parseInt(contentBuffer.toString('utf8', 12, 14));

    var gpsData = {
        datetime: new Date(rmcData.year, rmcData.month - 1, rmcData.day, rmcData.hour, rmcData.min, rmcData.sec),

        gpsStatus: rmcData.gpsStatus, // Active or Void
        lat: parsedLat, //[+/-]HHMM.SSSSSSSS, +North -South
        lon: parsedLon, //[+/-]HHMM.SSSSSSSS, +East -West

        speed: knotsToMPH(rmcData.speed), // MPH
        bearing: rmcData.bearing, // Degrees

        // See table above for these translations
        xAcc: y,
        yAcc: x - 1, // -1 to remove gravity
        zAcc: z,

        _raw: null //contentBuffer.toString('utf8')
    };

    if(gpsData.datetime.isDstObserved()) {
        gpsData.datetime.setHours(gpsData.datetime.getHours() + 1);
    }

    // We lower these values so downward force (gravity) is roughly 1.
    //gpsData.xAcc = gpsData.xAcc / 256;
    //gpsData.yAcc = (gpsData.yAcc / 256) + 1;
    //gpsData.zAcc = gpsData.zAcc / 256;

    return gpsData;
}

function parseGpsContentBuffer_522GW(contentBuffer) {

    /** G Sensor Data
                X-      X+      Y-      Y+      Z-      Z+
        RAW     UP      DOWN    RGHT    LEFT    FRWD    BKWD
        NORM    RGHT    LEFT    DOWN    UP      BKWD    FRWD
    **/

    //console.log("X:%d Y:%d Z:%d", contentBuffer.readInt32BE(16), contentBuffer.readInt32BE(20), contentBuffer.readInt32BE(24))
    log && console.log("X:%d Y:%d Z:%d", contentBuffer.readInt32LE(16), contentBuffer.readInt32LE(20), contentBuffer.readInt32LE(24))

    // 0001 = +0.001 
    // 1000 = +1.000
    // 3000 = -1.000
    // 3999 = -0.001
    function parseAMBAGSensorValue(rawValue) {

        if(rawValue > 2000) {
            return (4000 - rawValue) / 1000 * -1;
        } else {
            return rawValue / 1000;
        }

    }

    var x = parseAMBAGSensorValue(contentBuffer.readInt32LE(16));
    var y = parseAMBAGSensorValue(contentBuffer.readInt32LE(20));
    var z = parseAMBAGSensorValue(contentBuffer.readInt32LE(24));

    var rmc = contentBuffer.toString('utf8', 28, 99)

    log && console.log("X:%d Y:%d Z:%d", x, y, z)

    //log && console.log(rmc)

    var rmcData = parseGPRMC(rmc);

    if (!rmcData) {
        // Unable to parse the data
        //TODO: throw a error or something?
        return false;
    }

    var parsedLat = parseLatLon(rmcData.lat, (rmcData.northSouth == 'N' ? 1 : -1));
    var parsedLon = parseLatLon(rmcData.lon, (rmcData.eastWest == 'E' ? 1 : -1));

    // RMC Date isn't adjusted for DST
    var year = parseInt(contentBuffer.toString('utf8', 0, 4));
    var month = parseInt(contentBuffer.toString('utf8', 4, 6));
    var day = parseInt(contentBuffer.toString('utf8', 6, 8));
    var hour = parseInt(contentBuffer.toString('utf8', 8, 10));
    var min = parseInt(contentBuffer.toString('utf8', 10, 12));
    var sec = parseInt(contentBuffer.toString('utf8', 12, 14));

    var gpsData = {
        datetime: new Date(rmcData.year, rmcData.month - 1, rmcData.day, rmcData.hour, rmcData.min, rmcData.sec),

        gpsStatus: rmcData.gpsStatus, // Active or Void
        lat: parsedLat, //[+/-]HHMM.SSSSSSSS, +North -South
        lon: parsedLon, //[+/-]HHMM.SSSSSSSS, +East -West

        speed: knotsToMPH(rmcData.speed), // MPH
        bearing: rmcData.bearing, // Degrees

        // See table above for these translations
        xAcc: y,
        yAcc: x - 1, // -1 to remove gravity
        zAcc: z,

        _raw: null //contentBuffer.toString('utf8')
    };

    if(gpsData.datetime.isDstObserved()) {
        gpsData.datetime.setHours(gpsData.datetime.getHours() + 1);
    }

    // We lower these values so downward force (gravity) is roughly 1.
    //gpsData.xAcc = gpsData.xAcc / 256;
    //gpsData.yAcc = (gpsData.yAcc / 256) + 1;
    //gpsData.zAcc = gpsData.zAcc / 256;

    return gpsData;
}

function parseGpsContentBuffer_MIRGW(contentBuffer) {

    /** G Sensor Data
                X-      X+      Y-      Y+      Z-      Z+
        RAW     UP      DOWN    RGHT    LEFT    FRWD    BKWD
        NORM    RGHT    LEFT    DOWN    UP      BKWD    FRWD
    **/

    //console.log("X:%d Y:%d Z:%d", x, y, z)

    var gpsStatus = contentBuffer.toString('utf8', 72, 73);
    var northSouth = contentBuffer.toString('utf8', 73, 74);
    var eastWest = contentBuffer.toString('utf8', 74, 75);
    var lat = contentBuffer.readFloatLE(76);
    var lon = contentBuffer.readFloatLE(80);
    var speed = contentBuffer.readFloatLE(84);
    var bearing = contentBuffer.readFloatLE(88);

    log && console.log('raw: ' + contentBuffer.toString('utf8', 70, 70 + 20))
    log && console.log('raw lon: ' + contentBuffer.toString('utf8', 80, 80 + 4))
    log && console.log('raw lat: ' + contentBuffer.toString('utf8', 76, 76 + 4))

    var gSensorOffset = 104;
    var x = contentBuffer.readInt32LE(gSensorOffset - 12);
    var y = contentBuffer.readInt32LE(gSensorOffset - 8);
    var z = contentBuffer.readInt32LE(gSensorOffset - 4);

    log && console.log('lat: ' + lat)
    log && console.log('lon: ' + lon)

    var parsedLat = parseLatLon(lat, (northSouth == 'N' ? 1 : -1));
    var parsedLon = parseLatLon(lon, (eastWest == 'E' ? 1 : -1));

    log && console.log('parsedLat: ' + parsedLat)
    log && console.log('parsedLon: ' + parsedLon)

    var hour = contentBuffer.readUInt32LE(48);
    var min = contentBuffer.readUInt32LE(52);
    var sec = contentBuffer.readUInt32LE(56);
    var year = contentBuffer.readUInt32LE(60);
    var month = contentBuffer.readUInt32LE(64);
    var day = contentBuffer.readUInt32LE(68);

    if(year < 2000) {
        year += 2000;
    }

    var gpsData = {
        datetime: new Date(year, month - 1, day, hour, min, sec),

        gpsStatus: gpsStatus, // Active or Void
        lat: parsedLat, //[+/-]HHMM.SSSSSSSS, +North -South
        lon: parsedLon, //[+/-]HHMM.SSSSSSSS, +East -West

        speed: knotsToMPH(speed), // MPH
        bearing: bearing, // Degrees

        // See table above for these translations
        xAcc: x * -1,
        yAcc: y,
        zAcc: z * -1,

        _raw: null//contentBuffer.toString('utf8')
    };

    // We lower these values so downward force (gravity) is roughly 1.
    gpsData.xAcc = gpsData.xAcc / 256;
    gpsData.yAcc = (gpsData.yAcc / 256) + 1;
    gpsData.zAcc = gpsData.zAcc / 256;

    // Mirror FW < 4.1 has incorrect values for Y
    if(Math.ceil(gpsData.yAcc) > 1) {
        gpsData.yAcc = gpsData.yAcc - 2;
    }

    return gpsData;
}

function parseGpsContentBuffer_DUOHD(contentBuffer, itemIndex) {

    /** G Sensor Data
                X-      X+      Y-      Y+      Z-      Z+
        RAW     UP      DOWN    RGHT    LEFT    FRWD    BKWD
        NORM    RGHT    LEFT    DOWN    UP      BKWD    FRWD
    **/
    log && console.log('Item: ' + itemIndex)

    var startOfData = 15;

    var year = contentBuffer.toString('utf8', startOfData + 0, startOfData + 0 + 4);
    var month = contentBuffer.toString('utf8', startOfData + 4, startOfData + 4 + 2);
    var day = contentBuffer.toString('utf8', startOfData + 6, startOfData + 6 + 2);
    var hour = contentBuffer.toString('utf8', startOfData + 8, startOfData + 8 + 2);
    var min = contentBuffer.toString('utf8', startOfData + 10, startOfData + 10 + 2);
    var sec = contentBuffer.toString('utf8', startOfData + 12, startOfData + 12 + 2);
    
    var date = new Date(year, month - 1, day, hour, min, sec);

    log && console.log('Date: ' + date)

    var gpsStatus = contentBuffer.readInt8(startOfData + 14);
    if(gpsStatus == 3) {
        gpsStatus = 'A';
    } else {
        gpsStatus = 'V';
    }

    var northSouth = contentBuffer.toString('utf8', startOfData + 15, startOfData + 15 + 1);
    var lat = contentBuffer.toString('utf8', startOfData + 16, startOfData + 16 + 8);

    var eastWest = contentBuffer.toString('utf8', startOfData + 24, startOfData + 24 + 1);
    var lon = contentBuffer.toString('utf8', startOfData + 25, startOfData + 25 + 9);

    log && console.log('GPS: %s %s %s %s', northSouth, lat, eastWest, lon);

    // To get the real lat lon we need to insert the decimal point, and pass it to the parse function.
    lat = lat.substr(0, 4) + '.' + lat.substr(4);
    lon = lon.substr(0, 5) + '.' + lon.substr(5);

    var parsedLat = parseLatLon(lat, (northSouth == 'N' ? 1 : -1));
    var parsedLon = parseLatLon(lon, (eastWest == 'E' ? 1 : -1));

    log && console.log('Parsed Lat: %s, Parsed Lon: %s', parsedLat, parsedLon);

    var altitude = contentBuffer.toString('utf8', startOfData + 34, startOfData + 34 + 5);
    var speed = contentBuffer.toString('utf8', startOfData + 39, startOfData + 39 + 4);

    speed = kmhToMph(parseInt(speed) / 10);

    var bearing = 0;

    log && console.log('Altitude: %s, Speed: %s', altitude, speed);

    var gStart = 43, gX = [], gY = [], gZ = [];
    // X1, Y1, Z1, X2, Y2, Z2, ...
    for(var i = 0; i < 15; i++) {

        var raw = contentBuffer.toString('utf8', startOfData + gStart + (i * 4), startOfData + gStart + (i * 4) + 4);
        var value = parseICatchGSensor(raw);

        switch(i % 3) {
            case 0:
                gX.push(value);
                break;
            case 1:
                gY.push(value);
                break;
            case 2:
                gZ.push(value);
                break;
        }
    }

    var x = maxAbsValue(gX);
    var y = maxAbsValue(gY);
    var z = maxAbsValue(gZ);

    log && console.log('GSensor: X: %s, Y: %s, Z: %s', x, y, z);

    var gpsData = {
        datetime: date,

        gpsStatus: gpsStatus, // Active or Void
        lat: parsedLat, //[+/-]HHMM.SSSSSSSS, +North -South
        lon: parsedLon, //[+/-]HHMM.SSSSSSSS, +East -West

        speed: speed, // MPH
        bearing: bearing, // Degrees

        // See table above for these translations
        xAcc: x,
        yAcc: y,
        zAcc: z,

        _raw: null//contentBuffer.toString('utf8')
    };

    // We lower these values so downward force (gravity) is roughly 1.
    /*gpsData.xAcc = gpsData.xAcc / 256;
    gpsData.yAcc = (gpsData.yAcc / 256) + 1;
    gpsData.zAcc = gpsData.zAcc / 256;*/

    return gpsData;
}

function parseGPRMC(gprmc) {

    //$GPRMC,HHMMSS.SSS,A,LATTITUDE,N,LONGITUDE ,W,SPEED,HEADI,YYMMDD,,,ACHK
    //$GPRMC,152250.000,A,5112.9932,N,00047.8372,W,17.38,49.13,160117,,,A*74

    // remove any random white space
    gprmc = gprmc.trim();

    // check it is a GPRMC
    if (gprmc.indexOf('$GPRMC') == 0) {
        // is a GPRMC

        var splitData = gprmc.split(',');

        // If we get a incomplete GPMRC then return false before error thrown
        if(splitData.length < 10) {
            return false;
        }

        var hour = parseInt(splitData[1].substring(0, 2));
        var min = parseInt(splitData[1].substring(2, 4));
        var sec = parseInt(splitData[1].substring(4, 6));

        //console.warn(splitData[1])

        var gpsStatus = splitData[2];

        var lat = splitData[3];
        var northSouth = splitData[4];
        var lon = splitData[5];
        var eastWest = splitData[6];

        var speed = parseFloat(splitData[7]);
        var bearing = parseFloat(splitData[8]);

        var day = parseInt(splitData[9].substring(0, 2));
        var month = parseInt(splitData[9].substring(2, 4));
        var year = 2000 + parseInt(splitData[9].substring(4, 6));

        //console.log("hour: %d, min: %d, sec: %d", hour, min, sec);
        //console.log("status: %s, lat: %d %s, lon: %d %s", gpsStatus, lat, northSouth, lon, eastWest);
        //console.log("speed: %d, heading: %d ", speed, heading);
        //console.log("year: %d, month: %d, day: %d", year, month, day);

        return {
            hour: hour,
            min: min,
            sec: sec,
            gpsStatus: gpsStatus,
            lat: lat,
            northSouth: northSouth,
            lon: lon,
            eastWest: eastWest,
            speed: speed,
            bearing: bearing,
            year: year,
            month: month,
            day: day
        }

    } else {
        return false;
    }
}

function getGpsContentBuffer(fd, offset, length) {
    var contentBuffer = new Buffer(length);
    fs.readSync(fd, contentBuffer, 0, contentBuffer.length, offset);
    return contentBuffer;
}

function knotsToMPH(speedInKnots) {
    return speedInKnots * 1.15078;
}

function kmhToMph(kmh) {
    return parseFloat(kmh) * 0.621371;
}

function pad(n, width, z) {
    z = z || ' ';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

// value = raw value, modifier = 1 or -1 (N or S)
function parseLatLon(value, modifier) {
    var hours = 0,
        mins = 0,
        secs = 0;

    var strVal = value.toString();
    var strFirst = strVal.substring(0, strVal.indexOf('.'));
    
    if (strFirst.length == 5) { // 5 digits HHHMM

        hours = parseInt(strVal.substring(0, 3));
        mins = parseInt(strVal.substring(3, 5));

    } else if (strFirst.length == 4) { // 4 digits HHMM

        hours = parseInt(strVal.substring(0, 2));
        mins = parseInt(strVal.substring(2, 4));

    } else if (strFirst.length == 3) { // 3 Digits HMM

        hours = parseInt(strVal.substring(0, 1));
        mins = parseInt(strVal.substring(1, 3));

    } else if (strFirst.length == 2) { // 2 Digits MM

        hours = 0; //parseInt(strVal.substring(0, 1));
        mins = parseInt(strVal.substring(0, 2));

    } else { // 1 Digit M, no hours  // 1 Digit H, no mins
        // Change 02/08/17 SL@NTS Bug with low lat, < 1 deg...
        hours = 0; // parseInt(strVal.substring(0, 1));
        mins = parseInt(strVal.substring(0, 1)); // 0;

    }

    var secVal = parseFloat(value) - parseInt(value);
    secs = parseFloat(secVal * 60);

    //log && console.log('Raw: %f, H: %d, M: %d, S: %f', value, hours, mins, secs);

    return hoursMinsSecsToDegrees(hours, mins, secs) * modifier;

}

function parseICatchGSensor(strVal) {
    // '+003'
    var modifier = strVal.substr(0, 1) == '+' ? 1 : -1; // '+' or '-'
    var rawVal = strVal.substr(1); // '003'
    var value = parseFloat(rawVal);

    return value / 100 * modifier;
}

function maxAbsValue(values) {
    var maxAbs = Math.abs(values[0]);
    var max = values[0];

    for(var i = 1; i < values.length; i++) {

        if(Math.abs(values[i]) > maxAbs) {
            maxAbs = Math.abs(values[i]);
            max = values[i];
        }
    }

    return max;
}

function average(data){
    var sum = data.reduce(function(sum, value) {
        return sum + value;
    }, 0);

    var avg = sum / data.length;
    return avg;
}

function standardDeviation(values){
    var avg = average(values);

    var squareDiffs = values.map(function(value){
        var diff = value - avg;
        var sqrDiff = diff * diff;
        return sqrDiff;
    });

    var avgSquareDiff = average(squareDiffs);

    var stdDev = Math.sqrt(avgSquareDiff);
    return stdDev;
}

function hoursMinsSecsToDegrees(hours, mins, secs) {
    var degValue = 0.0;
    degValue = hours + parseFloat(mins / 60) + parseFloat(secs / (60 * 60));

    //log && console.log(degValue);

    return degValue
}

Number.prototype.toRadians = function() {
    return this * Math.PI / 180;
}
Number.prototype.toDegrees  = function () {
  return this * (180 / Math.PI);
}

function latLonDistance(lat1, lon1, lat2, lon2) {
    var RADIUS_OF_EARTH = 6371000; // metres
    var MILES_PER_KILOMETER = 0.6213711925;
   
    var radLat1 = lat1.toRadians();
    var radLat2 = lat2.toRadians();
    var deltRadLat = (lat2 - lat1).toRadians();
    var deltRadLon = (lon2 - lon1).toRadians();

    var a = Math.sin(deltRadLat / 2) * Math.sin(deltRadLat / 2) +
        Math.cos(radLat1) * Math.cos(radLat2) *
        Math.sin(deltRadLon / 2) * Math.sin(deltRadLon / 2);

    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    var distKM = (RADIUS_OF_EARTH * c) / 1000;
    var distMi = distKM * MILES_PER_KILOMETER;

    if (distMi == NaN) distMi = 0;

    return distMi;
}

function latLonBearing(lat1, lon1, lat2, lon2) {

    //log && console.log('Calculating bearing from lat lon')
    //log && console.log('Point 1: Lat: %s, Lon: %s', lat1, lon1)
    //log && console.log('Point 2: Lat: %s, Lon: %s', lat2, lon2)

    var y = Math.sin(lon2.toRadians() - lon1.toRadians()) * Math.cos(lat2.toRadians());
    var x = Math.cos(lat1.toRadians()) * Math.sin(lat2.toRadians()) -
            Math.sin(lat1.toRadians()) * Math.cos(lat2.toRadians()) * Math.cos(lon2.toRadians() - lon1.toRadians());

    //log && console.log('Intermediate: x: %s, y: %s', x, y)
    //log && console.log('Result: %s', Math.atan2(y, x).toDegrees())

    var result = Math.atan2(y, x).toDegrees();

    return (result + 360) % 360; // Normalise result, else its in the range -180 -> +180
}

function fileExists(filePath) {
    return fs.existsSync(filePath);
}

var analyseTimeout;
var processing = false;
var analyseQueue = [];

function register(getMainWindow) {

    ipc.on('analyse-video', function (e, msg) {

        analyseQueue.push(msg.filePath);
        processQueue();

        //analyseVideo(msg.filePath, function (err, result) {

            //getMainWindow().webContents.send('analysed-video', result);
        //})
    });

    function processQueue() {
        
        console.log('processQueue')

        if(!processing && analyseQueue.length > 0) {

            processing = true;

            // Create timeout
            analyseTimeout = setTimeout(function () {
                console.log('timeout')
                processing = false;
                processQueue();
            }, 2 * 1000)

            analyseVideo(analyseQueue.pop(), function (err, result) {
    
                // Finished so no need to timeout
                clearTimeout(analyseTimeout);

                processing = false;
                getMainWindow().webContents.send('analysed-video', result);
                processQueue();
            });
        }
    
        
    }
}

Date.prototype.stdTimezoneOffset = function () {
    var jan = new Date(this.getFullYear(), 0, 1);
    var jul = new Date(this.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}

Date.prototype.isDstObserved = function () {
    return this.getTimezoneOffset() < this.stdTimezoneOffset();
}


module.exports.default =  {
//export default {
    analyseVideo: analyseVideo,
    fileExists: fileExists,
    register: register,
    findAtoms: findAtoms
};