/*global require, __dirname */

var express = require('express'),
    app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    locations = {},
    handlebars = require('handlebars'),
    fs = require('fs'),
    mapTemplate = handlebars.compile(fs.readFileSync('./map.hbs', 'utf-8')),
    indexTemplate = handlebars.compile(fs.readFileSync('./index.hbs', 'utf-8')),
    randomstring = require('randomstring'),
    PORT = 9999;


app.get('/:room_id/', function(req, res) {
    res.send(mapTemplate({ room: req.params.room_id }));
});

app.get('/', function(req, res) {
    res.send(indexTemplate({ randomString: randomstring.generate(5) }));
});

app.use("/media", express.static(__dirname + '/media'));

io.on('connection', function(socket){
    socket.on('pos', function(newpos) {
        locations[socket.id] = newpos;
        socket.emit('positions updated', locations);
    });
    
    socket.on('disconnect', function() {
        io.emit('remove position', socket.id);
        delete locations[socket.id];
    });
});

http.listen(PORT, function(){
    console.log('listening on *: ' + PORT);
});
