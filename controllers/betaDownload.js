const chalk = require('chalk');
const request = require('request');
const shortid = require('shortid');
const fs = require('fs');
const mkdirp = require('mkdirp');
const ytdl = require('youtube-dl');
const pretty = require('prettysize');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const remove = require('remove');
const URL = require('url-parse');



//ffmpeg.setFfmpegPath('../ffmpeg/ffmpeg');

exports.getDownload = function(req, res, next) {
    req.on('close', function(err) {
        remove(__dirname + '/../downloads/' + sessionId, function(err) {
            if (err) console.error(err);
            else console.log(sessionId + 'Deleted!');
        });
    });


    console.log("working");

    console.log(req.body);

    const youtubeUrl = req.body.url;
    
    const artistName = req.body.artist;
    const musicName = req.body.music;
    var mp3Name;
    var videoId;
    var videoTitle;
    
    if (youtubeUrl == "") {
        return res.send("<h1>Form field is missing, please complete all</h1>");
    }
    if (youtubeUrl.indexOf("http") == -1) {
        return res.send("<h1>Yotube url is not valid</h1>");
    }

    console.log("YoutubeURL: " + youtubeUrl);
    console.log("Artist Name" + artistName);
    console.log("Track Name " + musicName);

    const sessionId = shortid.generate();
    console.log(chalk.green('Session: ') + sessionId);


    mkdirp(__dirname + '/../downloads/' + sessionId, function(err) {
        if (err) console.error(err)
        else console.log('pow pow! directory created');
    });

    var video = ytdl(youtubeUrl.toString(), ['--format=18']);
    video.on('info', function(info) {
        var download = function(uri, filename, callback) {
            request.head(uri, function(err, res, body) {
                if (err) throw err;

                var localImgCover = path.join(__dirname + "/../downloads/" + sessionId, String(filename))

                request(uri).pipe(fs.createWriteStream(localImgCover))
            })
        }
        download("https://img.youtube.com/vi/" + info.id + "/0.jpg", info.id + ".jpg", function() {
            console.log(chalk.green('✓') + 'Image art Downloaded');
        });

        console.log(info.title)
        videoId = info.id;
        videoTitle = info.title;
        

        console.log(chalk.yellow(info._filename))
        console.log(chalk.yellow(pretty(info.size)));

        mp3Name = info.filename;
        /**
         * download video to session id directory
         * and remove special characters and white spaces
         *
         */

        var localVideo = path.join(__dirname + '/../downloads/' + sessionId, info.id + '.mp4');
        video.pipe(fs.createWriteStream(localVideo));

    });
    video.on('end', function() {
        var mp4Video = path.join(__dirname + '/../downloads/' + sessionId, videoId + '.mp4');

        /**
         * ffmpeg uses mp3ToMetadata to save file in this same local
         * 
         */

        var mp3ToMetadata = path.join(__dirname + '/../downloads/' + sessionId, videoId + 'withoutMetadata.mp3');

        var mp3Final = path.join(__dirname + '/../downloads/' + sessionId, videoTitle + '.mp3');


        /**
         * start mp4 to mp3 conversion
         * 
         */
        ffmpeg(mp4Video)

            .output(mp3ToMetadata)

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

                    .outputOptions(
                        "-i",
                        __dirname + "/../downloads/" + sessionId + '/' + videoId + ".jpg",
                        "-map", "0:0",
                        "-map", "1:0",
                        "-c", "copy",
                        "-id3v2_version", "3",
                        "-metadata", "artist=" + artistName + "",
                        "-metadata", "title=" + videoTitle + "",
                        "-metadata", "album=" + videoTitle + ""
                    )
                    .on('error', function(e) {
                        console.log(chalk.red("Error" + e));
                        res.json({
                            error: 'unknow',
                            a: e
                        });

                    })
                    .on('end', function() {
                        console.log(chalk.green('✓') + 'Done adding metadata');
                        console.log(chalk.green('✓') + 'Generating download link');
                        console.log("/api/track/download/" + videoId + "/" + sessionId);


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




                    })
                    .save(mp3Final);

            })
            .run()

    })


}
