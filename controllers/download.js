const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const remove = require('remove');
const URL = require('url-parse');
const mkdirp = require('mkdirp');
const request = require('request');
const shortid = require('shortid');
const ytdl = require('youtube-dl');
const pretty = require('prettysize');
const ffmpeg = require('fluent-ffmpeg');


exports.download = function(req, res, next) {

    req.on('close', function(err) {
        console.log("User connection was closed.");

    });
    req.on('close', function(err) {
        remove(__dirname + '/../downloads/' + sessionId, function(err) {
            if (err) console.error(err);
            else console.log(sessionId + 'Deleted!');
        });
    });

    let settings = {
        audioBitrate: '128k',
        debug: true
    };

    let input = {
        trackId: req.body.id,
        lyric: req.body.lyrics,
        youtubeURL: req.body.youtubeURL
    };
    console.log(input)



    let processStatus = {
        inputData: false,
        imgAlbumDownloaded: false,
        iTunesAPIaccess: false,
        openmusicAPIaccess: false,
        youtubeVideoDownloaded: false,
        ffmpegConversion: false
    };

    let jsonAPI;
    let trackInfo;
    let strToSearch;
    let youtubeId;

    let localVideo
    let mp4Video;
    let mp3ToMetadata;
    let mp3Final;


    // Generate a folder with a random short id
    const sessionId = shortid.generate();
    mkdirp(__dirname + '/../downloads/' + sessionId, function(err) {
        if (err) console.error(err)
        else console.log('Folder created');
    });





    const iTunesId = "http://itunes.apple.com/lookup?id=" + input.trackId; //1032913975
    const openMusicAPI = "http://open-music.herokuapp.com/api/search/";

    // Check if is a valid youtube id or if input is not blank 
    if (input.trackId == " ") {
        return res.json({ error: true, mesage: "Invalid data or it is blank" });
    }

    if (input.youtubeURL != '') {
        console.log("Custom youtube url");
        console.log(input.youtubeURL);

        if (input.youtubeURL.indexOf('youtu.be') == -1) {
            return res.send("Não é um url do youtubirl");
        }
    }

    // ruc - Replace stranger characters from a string
    const ruc = function replaceUnknownCharacters(string) {
        return string.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');

    };
    const rucws = function replaceUnknownCharactersWithoutSpace(string) {
        return string.replace(/[&\/\\#,+()$~%.'":*?<>{}/ /]/g, '');

    };


    const download = function(uri, filename, callback) {
        request.head(uri, function(err, res, body) {
            if (err) throw err

            let localImgCover = path.join(__dirname + "/../downloads/" + sessionId, String(filename))

            request(uri).pipe(fs.createWriteStream(localImgCover)).on('close', callback)
        })
    };

    const ffmpegConvert = function convertVideoUsingFFMPEG() {
        console.log("Converting video in a audio file...");
        console.log(settings.audioBitrate);

        ffmpeg(localVideo)
            .output(mp3ToMetadata)
            .audioBitrate(settings.audioBitrate)

            .on('error', function(e) {
                console.log(e)
            })
            .on('end', function() {
                console.log(chalk.green("Video convertted to MP3"));

                fs.unlink(mp4Video);
                console.log(chalk.green('✓ MP4 Video Deleted'));

                /**
                 * add metadata tags and album art cover
                 *
                 */
                ffmpeg(mp3ToMetadata)
                    .output(mp3Final)

                    .outputOptions(
                        "-i",
                        __dirname + "/../downloads/" + sessionId + '/' + rucws(trackInfo.trackRemix) + ".png",
                        "-map", "0:0",
                        "-map", "1:0",
                        "-c", "copy",
                        "-id3v2_version", "3",
                        "-metadata", "artist=" + trackInfo.artistName + "",
                        "-metadata", "title=" + trackInfo.trackRemix + "",
                        "-metadata", "album=" + trackInfo.albumName + "",
                        "-metadata", "composer=" + trackInfo.artistName + "", //TODO
                        "-metadata", "comment=Open Music", //TODO
                        "-metadata", "genre=" + trackInfo.trackGenre + "",
                        "-metadata", "track=" + trackInfo.trackNumber + "", //TODO
                        "-metadata", "date=" + trackInfo.trackDate + ""



                    )
                    .on('error', function(e) {
                        console.log(chalk.red("Error" + e));
                        res.json({
                            error: true,
                            a: e,
                            mesage: e
                        });

                    })
                    .on('end', function() {
                        console.log(chalk.green('✓') + 'Done adding metadata');
                        console.log(chalk.green('✓') + 'Generating download link');
                        console.log("/api/track/download/" + rucws(trackInfo.trackRemix) + "/" + sessionId);

                        res.type('audio/mpeg3');
                        res.download(mp3Final, function(err) {
                            if (err) {
                                if (err.code === "ECONNABORT" && res.statusCode == 304) {
                                    // No problem, 304 means client cache hit, so no data sent.
                                    console.log('304 cache hit for ' + mp3Final);

                                    return;
                                }


                                console.log(err)
                            }
                            else {

                                remove(__dirname + '/../downloads/' + sessionId, function(err) {
                                    if (err) console.error(err);
                                    else console.log(chalk.red(sessionId) + ' Deleted!');
                                });

                            }
                        })
                    }).run()
            }).run()

    }

    const downloadVideo = function downloadVideoFromYouTube() {

        let youtubeDownloadUrl = 'http://www.youtube.com/watch?v=' + youtubeId;
        if (input.youtubeURL != "") {
            youtubeDownloadUrl = input.youtubeURL
        }

        const video = ytdl(youtubeDownloadUrl.toString(), ['--format=18']);

        video.on('info', function(info) {
            console.log(chalk.yellow(info.filename));
            console.log(chalk.yellow(pretty(info.size)));

            // download video in sessionId folder
            localVideo = path.join(__dirname + '/../downloads/' + sessionId, rucws(trackInfo.trackRemix) + '.mp4');
            video.pipe(fs.createWriteStream(localVideo));

        });

        video.on('end', function() {
            processStatus.youtubeVideoDownloaded = true;

            console.log("video endedd;...");

            mp4Video = path.join(__dirname + '/../downloads/' + sessionId, rucws(trackInfo.trackRemix) + '.mp4');
            // ffmpeg uses mp3ToMetadata to save file in this same local
            mp3ToMetadata = path.join(__dirname + '/../downloads/' + sessionId, rucws(trackInfo.trackRemix) + 'withoutMetadata.mp3');
            mp3Final = path.join(__dirname + '/../downloads/' + sessionId, rucws(trackInfo.trackRemix) + '.mp3');


            console.log("Starting video conversion...");

            console.log(localVideo)

            ffmpegConvert()

        });

    };

    const requestYoutubeAPI = function accessYouTubeAPI() {
        if (settings.debug == true) {
            console.log(chalk.bgRed("Accessing YouTube API"));
        }

        if (trackInfo.albumName.toLowerCase().indexOf('remix') != -1 && trackInfo.trackRemix.toLowerCase().indexOf('mix') == -1) {
            strToSearch = ruc(trackInfo.albumName);
            console.log(strToSearch)
        }
        else {
            strToSearch = ruc(trackInfo.trackRemix);

            console.log(chalk.red("NADA"))
        }

        let stringToSearch = ruc(trackInfo.artistName) + ' ' + strToSearch;
        if (input.lyric == 'on') {
            stringToSearch = ruc(trackInfo.artistName) + ' ' + strToSearch + ' ' + 'lyrics music video';
        }

        console.log(stringToSearch);

        // start accessing openmusic api 
        request(openMusicAPI + encodeURIComponent(stringToSearch), function(error, response, data) {
            try {
                data = JSON.parse(data);

            }
            catch (error) {
                console.log(error)
                return res.json({ error: true, message: error });
            }

            if (data.pageInfo.totalResults == 0) {
                return res.json({
                    error: 'No result was found'
                });
            }

            youtubeId = data.items[0].id.videoId;
            processStatus.openmusicAPIaccess = true;
            if (settings.debug == true) {
                console.log(chalk.green("Youtube video id: " + youtubeId));
            };
            downloadVideo();

        });
    };

    const requestiTunesAPI = function accessITunesAPi() {
     
        request(iTunesId, {}, function(error, response, body) {

             
             jsonAPI = JSON.parse(body);

             // not found track returns a error mesage 
             if (jsonAPI.resultCount == 0) {
                 return res.json({ error: true, message: "unavaliable music from itunes search" });
             }

             // if not have an error, just proceed, getting data from itunes response
             trackInfo = {
                 imgCover: jsonAPI.results[0].artworkUrl100.replace("100x100bb.jpg", "400x400bb.png"),
                 artistName: jsonAPI.results[0].artistName,
                 trackName: jsonAPI.results[0].trackName,
                 albumName: jsonAPI.results[0].collectionName,
                 trackDate: jsonAPI.results[0].releaseDate,
                 trackCountry: jsonAPI.results[0].country,
                 trackGenre: jsonAPI.results[0].primaryGenreName,
                 trackNumber: jsonAPI.results[0].trackNumber,
                 trackRemix: jsonAPI.results[0].trackCensoredName
             };

             if (settings.debug == true) {
                 console.log(chalk.green("[Debugging]"));
                 console.log('🎵 ' + trackInfo.artistName);
                 console.log('🎵 ' + trackInfo.trackName);
                 console.log('🎵 ' + trackInfo.albumName);
                 console.log('🎵 ' + trackInfo.trackDate);
                 console.log('🎵 ' + trackInfo.trackCountry);
                 console.log('🎵 ' + trackInfo.trackGenre);
             }

             download(trackInfo.imgCover, rucws(trackInfo.trackRemix) + '.png', function() {
                 processStatus.imgAlbumDownloaded = true;
                 console.log(chalk.green('✓') + 'Image art Downloaded');
             });
             processStatus.iTunesAPIaccess = true;

             requestYoutubeAPI()

         });

    };





    // let's do the magic ;)

    if (input.data != "") {
        processStatus.inputData = true;
    }

    if (processStatus.inputData == true) {
        requestiTunesAPI(input.trackId);
    }


}
