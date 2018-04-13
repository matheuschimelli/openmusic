## Open Music 
This is the Open Music source code. Open Music is a youtube mp3 converter.

### How it works
Open Music works like a music conversor, but with a little more functionalities.

1. First Open Music will access the free iTunes API to get the music metadata
2. After will do a search in YouTube API with metadata obtained from iTunes API to get the ` id `  from video music 
3. Now, we have the music metadata and the video id. So, Open Music will download the video in mp4 format
4. After downloaded, the video is converted in a mp3 file 
5. Is added to mp3 file the music metadata and album cover with FFMPEG
6. The file is ready to be sent to download



The  file generated can not be sold or distributed due to Copyright by labels and artists.

## In short
This is a youtube mp3 converter.

### Deployng
You should have the last ffmpeg static build to make this works:
```
wget https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-64bit-static.tar.xz // to get the last ffmpeg static build
# wget inside the open music dir
export PATH=$PATH:../ffmpeg  
```
Now install
```
git clone https://github.com/matheuschimelli/openmusic.git
cd openmusic
npm install
npm start
```


### License
The MIT License (MIT)

Copyright (c) 2016 Matheus Chimelli

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.