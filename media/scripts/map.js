/*global module, google, setInterval, setTimeout */

var LOCATION_POLL_RATE = 3000,
    Meet = function(options) {
        this.options = options;
        this.room = options.room;
        this.socket = options.socket;
        this.markers = {};
    };

Meet.prototype = {
    lastPos: undefined,
    start: function() {
        var self = this,
            mapOptions = {
	        zoom: 14
	    },
            callback = this.locationCallback(),
            errorCallback = function (err) { console.warn('ERR', err); },
            geoOptions = {
                enableHighAccuracy: true
            };
            
	this.map = new google.maps.Map(document.getElementById('map'),
				       mapOptions);
        this.socket.emit('set room', this.room);
        
        navigator.geolocation.getCurrentPosition(callback, errorCallback, geoOptions);
        navigator.geolocation.watchPosition(callback, errorCallback, geoOptions);
        
        
        this.socket.on('positions updated', function(positions) {
            var pos, latlng;
            for (var marker_id in self.markers) {
                // update
                pos = positions[marker_id];
                latlng = new google.maps.LatLng(pos.k, pos.D);

                if (self.markers[marker_id] !== undefined) {                    
                    self.markers[marker_id].marker.setPosition(latlng);
                    delete positions[marker_id];
                }
            }
            
            // add remaining
            for (marker_id in positions) {
                pos = positions[marker_id];
                latlng = new google.maps.LatLng(pos.k, pos.D);
                
                self.markers[marker_id] = {
                    marker: new google.maps.Marker(
                        {
                            map: self.map,
                            position: latlng
                        })
                };
            }
        });

        this.socket.on('remove position', function(position_id) {
            if (self.markers[position_id]) {
                self.markers[position_id].marker.setMap(null);
                delete self.markers[position_id];
            }
        });
    },
    
    locationCallback: function(position) {
        var self = this;

        return function(position) {
            console.log(position);
            var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

            if (!self.lastPos) {
                self.map.panTo(latlng);
                self.socket.emit('pos', latlng);
            } else {
                var distance = google.maps.geometry.spherical
                        .computeDistanceBetween(self.lastPos, latlng);
                console.log(distance);
                if (distance > 5) {
                    self.socket.emit('pos', latlng);
                }
            }
            self.lastPos = latlng;
            
        };
    },
    
    getPosition: function(callback) {
        navigator.geolocation.getCurrentPosition(callback);
    },
    
    watchPosition: function(callback) {
        navigator.geolocation.watchPosition(callback);
    }
};
