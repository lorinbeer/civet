//==================================================================================================
var sys  = require('sys');
var exec = require('child_process').exec;
var http = require('http');
var path = require('path');
var fs   = require('fs');
var io   = require('socket.io');
//==================================================================================================
// setup the server, point socket.io listener to the server, and configure static file 
//
//==================================================================================================
var eventsimulate = function(x,y) {
    exec( "./click -x "+x+" -y "+y, function(err,stdout,stderror) {
        //console.log(err,stdout,stderror);
    });
}
//==================================================================================================
var keystrokesimulate = function(data) {
    console.log("osascript keystrokesimulate.scpt "+data.data);
    exec( "osascript keystrokesimulate.scpt "+data.data, function( error, stdout, stderr) { 
        console.log(error,stdout,stderr);  
    });   
}
//==================================================================================================

var server = http.createServer( 
  function (request,response){
      //parse url
      var filepath = request.url;
      if ( filepath == '/' || filepath == '/?') {
          filepath = './public/index.html';
      }
      console.log( request.url );
      //parse file extension to properly supply contenttype
      var ext = path.extname(filepath);
      var contenttype;
      switch (ext) {
      case '.png':
          filepath    = '.'+filepath;
          contenttype = 'image/png';
	  break;
      case '.html':
	  contenttype = 'text/html';
	  break;
      case '.js':
          filepath    = './public'+filepath;
	  contenttype = 'text/javascript';
	  break;
      case '.css':
          filepath    = './public'+filepath;
	  contenttype = 'text/css';
	  break;
      }
      //check to see if request references a valid file
      path.exists( filepath,
          function(exists) {
              if(exists) {
                  fs.readFile(filepath, 
                      function(error,content) {
                          if(error) {
                              response.writeHead(500);
		              response.end();
		          }
                          else {
	                      response.writeHead(200, {'Content-Type':contenttype});
		              response.end(content, 'utf-8');
		          }
	               });
	      }
	      else {
                  response.writeHead(404);
	          response.end();
	      }
          });
  });
server.listen(8080);
var socket = io.listen(server);
//==================================================================================================
//set up socket message handlers
var child;
socket.sockets.on('connection', function (socket) {
//wipe previous session data
exec("rm public/session/*.*", function(err, stdout, stderror) {
   // console.log(err, stdout, stderror);
});
    //==============================================================================================
    socket.emit('news', {hello: 'world' });
    //==============================================================================================
    socket.on('downstreammsg', function() {
        child = exec( "osascript takeiossimscreen.scpt", function( error, stdout, stderr) { 
            //console.log( "apple script simulator to pasteboard" );
            child = exec( "./bmppaste session/"+frame+".bmp", function(error,stdout, stderr) {
                //console.log( "cocoa program pasteboard to file, frame: ", frame );
                frame++;
	    });
        });
    });
    //==============================================================================================
    //handles mouseup messages from clients
    socket.on('mouseup', function(data) {
        console.log("received mouseup event: (",data.xpos,data.ypos,")");
        eventsimulate(data.xpos +470 ,data.ypos+50);
    });
    //==============================================================================================
    socket.on('keystroke', function(data) {
        console.log("received keystroke event:",data);
        keystrokesimulate(data);
    });
    //==============================================================================================
    var streamscreen = function(freq,count) {
        var frame = count;
       
        var imgpath = frame+".png";
        var screenpath = frame+".png.0";
      //  console.log("streaming a steaming screen",imgpath);
        exec( "screencapture -x -t png public/session/"+screenpath, function( error, stdout, stderr) {
            exec( "sips -c 710 358 public/session/"+screenpath+" -o public/session/"+imgpath, function(error, stdout, stderr) {
         //       console.log( error, stdout, stderr );
     //	console.log("picture is cropped and ready",imgpath);
	    });
            frame++;
	});
/*        child = exec( "osascript takeiossimscreen.scpt", function( error, stdout, stderr) { 
            console.log( "apple script simulator to pasteboard" );
            child = exec( "./bmppaste public/session/"+imgpath, function(error,stdout, stderr) {
                console.log( "cocoa program pasteboard to file, frame: ", frame );
                frame++;
	    });
        });
*/
        //check to see if image is ever made
        waitforimage(socket,'public/session/'+imgpath,0);

        //socket.emit('news', {data:imgpath} );
        var delay = function() {
            streamscreen(freq,frame);
        }
        setTimeout(delay,freq);
    }
    //streamscreen(150,0);
    streamscreen(1500,0);
   //===============================================================================================
});
//==================================================================================================
var waitforimage = function(_socket,_path,_delta) {
    var filepath = _path;
    var socket = _socket;
    var delta = _delta;
//    console.log( 'waiting for image', _path );
    var delay = function() {
        waitforimage(socket,filepath,delta+10);
    }
    path.exists('./'+filepath,
        function(exists) {
            if(exists) {
//                console.log( filepath );
//                console.log("file exists, let's roll!");
                socket.emit('news', {data:filepath} );
	    }
	    else {
//                console.log( filepath, delta );
//                console.log("file does not exist, wait for it...");
                setTimeout(delay,10);
	    }
        });      
}
//==================================================================================================



//==================================================================================================