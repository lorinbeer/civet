

var streamscreen = function(socket,freq,count) {
    if (count > 12){ count = 1; }
    var imgpath = "media/"+count.toString()+".bmp";
    count++;
    var img = new Image();
    img.src = imgpath;
    img.onload = function() {
        var context = $("#mainviewer")[0].getContext('2d');
        context.drawImage( img, 0, 0 );
    }

    console.log( "streaming a steaming screen: "+imgpath);
 
    socket.emit( 'upstreamscreen', {data:imgpath} );
    var delay = function() {
        streamscreen(socket,freq,count);
    }
    setTimeout( delay, freq );
 }

/*
 *
 *
 */
function initstream(freq) {
 
    
    console.log("die");
    freq = freq || 500; //default is 10Hz
    var socket = io.connect('http://localhost:8080');
    socket.on('news', function (data) {
              console.log('wut?');
              socket.emit('my other event', { my: 'data' });
              });
    //streamscreen(socket,freq);
    streamscreen(socket,freq,1);
    $('#statustext').html("Status: initializing");
}