/*global module, google, setInterval */

var Meet = function(options) {
    this.options = options;
    this.room = options.room;
    this.socket = options.socket;
    this.markers = {};
};

Meet.prototype = {
    lastPos: undefined,
    start: function() {
        var self = this;
        
	var mapOptions = {
	    zoom: 14
	};
	this.map = new google.maps.Map(document.getElementById('map'),
				       mapOptions);
        this.socket.emit('set room', this.room);
        this.updateLocation(true);
        this.socket.on('positions updated', function(positions) {
            for (var marker_id in self.markers) {
                // update
                var pos = positions[marker_id],
                    latlng = new google.maps.LatLng(pos.k, pos.D);

                if (self.markers[marker_id] !== undefined) {                    
                    self.markers[marker_id].marker.setPosition(latlng);
                    delete positions[marker_id];
                }
            }
            
            // add remaining
            for (marker_id in positions) {
                var pos = positions[marker_id],
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
        
        this.interval = setInterval((function(scope) {
            return function() { scope.updateLocation.call(scope, false); };
        })(this), 3000);
    },
    
    updateLocation: function(should_pan) {
        var self = this;
        this.getPosition(function(position) {
            var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            if (should_pan === true) {
                self.map.panTo(latlng);
            }


            if (!self.lastPos) {
                self.socket.emit('pos', latlng);
            } else {
                var distance = google.maps.geometry.spherical
                        .computeDistanceBetween(self.lastPos, latlng);
                if (distance > 5) {
                    self.socket.emit('pos', latlng);
                }
            }
            self.lastPos = latlng;
        });
    },
    
    getPosition: function(callback) {
        navigator.geolocation.getCurrentPosition(callback);
    }
};
