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
    var room_id = req.params.room_id;
    if (locations[room_id] === undefined) {
        locations[room_id] = {};
    }
    res.send(mapTemplate({ room: req.params.room_id }));
});

app.get('/', function(req, res) {
    res.send(indexTemplate({ randomString: randomstring.generate(5) }));
});

app.use("/media", express.static(__dirname + '/media'));

io.on('connection', function(socket) {
    socket.on('set room', function(room) {
        socket.join(room);
        socket.room = room;
    });

    socket.on('pos', function(newpos) {
        console.log(locations);
        locations[socket.room][socket.id] = newpos;
        io.to(socket.room).emit('positions updated', locations[socket.room]);
    });
    
    socket.on('disconnect', function() {
        io.to(socket.room).emit('remove position', socket.id);
        if (locations[socket.room]) {
            if (locations[socket.room][socket.id]) {
                delete locations[socket.room][socket.id];
            }
            
            if (locations[socket.room].length === 0) {
                delete locations[socket.room];
            }
        }
    });
});

http.listen(PORT, function(){
    console.log('listening on *: ' + PORT);
});
