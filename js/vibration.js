var vibration = (function(self) {
    self.supported = ('vibrate' in window.navigator);
    var interval = null;

    self.start = function(duration) {
        if (self.supported) {
            window.navigator.vibrate(duration);
        }
    };

    self.stop = function() {
        if (self.supported) {
            if (interval !== null) {
                clearInterval(interval);
            }
            window.navigator.vibrate(0);
        }
    };

    self.loop = function(duration, interval) {
        interval = window.setInterval(function() {
            startVibrate(duration);
        }, interval);
    };

    return self;
})(vibration || {});

window.vibration = vibration;