(function () {
    var wave = (function() {
        return {
            WAVEEVENT: 'wave',
            suportDeviceMotion: window.DeviceMotionEvent,
            threshold: 15,
            oldData: {
                time:  new Date(),
                x: '',
                y: '',
                z: ''
            },
            createEvent: function(name, bubbles, cancelable) {
                if (typeof document.CustomEvent === 'function') {
                    this.event = new document.CustomEvent(name, {
                        bubbles: bubbles,
                        cancelable: cancelable
                    });
                } else if (typeof document.createEvent === 'function') {
                    this.event = document.createEvent('Event');
                    this.event.initEvent(name, true, true);
                } else {
                    return false;
                }
            },

            reset: function() {
                this.oldData = {
                    time: +new Date(),
                    x: '',
                    y: '',
                    z: ''
                }
            },

            init: function() {
                this.createEvent(this.WAVEEVENT, true, true);

                if (this.suportDeviceMotion) {
                    window.addEventListener('devicemotion', this.handelMotion, false);
                };
            },

            handelMotion: function(e) {
                var current = e.accelerationIncludingGravity,
                    timeGap,
                    deltaX = 0,
                    deltaY = 0,
                    deltaZ = 0,
                    lastX = wave.oldData.x,
                    lastY = wave.oldData.y,
                    lastZ = wave.oldData.z;

                if ((lastX === null) && (lastY === null) && (lastZ === null)) {
                    wave.oldData.x = current.x;
                    wave.oldData.y = current.y;
                    wave.oldData.z = current.z;
                    return;
                }

                deltaX = Math.abs(lastX - current.x);
                deltaY = Math.abs(lastY - current.y);
                deltaZ = Math.abs(lastZ - current.z);

                if (((deltaX > wave.threshold) && (deltaY > wave.threshold)) || ((deltaX > wave.threshold) && (deltaZ > wave.threshold)) || ((deltaY > wave.threshold) && (deltaZ > wave.threshold))) {
                    timeGap = +new Date() - wave.oldData.time;

                    if (timeGap > 1000) {
                        window.dispatchEvent(wave.event);
                        wave.oldData.time = +new Date();
                    }
                }

                wave.oldData.x = current.x;
                wave.oldData.y = current.y;
                wave.oldData.z = current.z;
            },

            stop: function() {
                this.reset();
                if (this.hasDeviceMotion) {
                    window.removeEventListener('devicemotion', this.handelMotion, false);
                }
            }
        }
    })();

    window.wave = wave;
})();