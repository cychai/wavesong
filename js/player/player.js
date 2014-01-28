(function (utils, cfg, Model, Timer) {
    _.extend(Timer.prototype, {
        time : function () {
            return this.ticks() * this.resolution();
        }
    });

    var win = window,
        cfg = mbox.CONF;
    code = cfg.apiCode,
        encode = encodeURIComponent,
        decode = decodeURIComponent,
        timerResolution = 25,

        Playlist = Model.extend({
            initialize : function () {
                this.reset();
            },

            curMode : 'loop',

            add : function (sid) {
                var list = this.list;

                if (_.isArray(sid)) {
                    // 将sid统一转成字符串有利于减少API返回的数据类型区别的特例处理
                    sid = _.map(sid, function (i) {
                        return '' + i;
                    });
                    this.list = list.concat(_.difference(sid, list));
                } else {
                    sid = '' + sid;
                    if (list.indexOf(sid) === -1) {
                        this.list.push(sid);
                    }
                }
            },

            remove : function (sid) {
                var index = this.list.indexOf(sid);
                if (index !== -1) {
                    this.list.splice(index, 1);
                }
            },

            // TODO: 今后可能有随机播放等不同模式，prev和next方法就要做相应适应
            prev : function () {
                var list = this.list,
                    prev = list.indexOf(this.cur) - 1,
                    l = list.length;

                switch (this.curMode) {
                    case 'single':
                        prev = list.indexOf(this.cur);
                        break;
                    case 'random':
                        prev = Math.floor(Math.random() * (l - 1) + 0);
                        break;
                    case 'list':
                        if (prev === -1) {
                            prev = 0;
                        }
                        break;
                    case 'loop':
                    case 'default':
                        if (prev === -1) {
                            prev = l - 1;
                        }
                        break;
                }

                return this.cur = list[prev];
            },

            next : function () {
                var list = this.list,
                    next = list.indexOf(this.cur) + 1,
                    l = list.length;

                switch (this.curMode) {
                    case 'single':
                        next = list.indexOf(this.cur);
                        break;
                    case 'random':
                        next = Math.floor(Math.random() * (l - 1) + 0);
                        break;
                    case 'list':
                        if (next === l) {
                            next = l - 1;
                        }
                        break;
                    case 'loop':
                    case 'default':
                        if (next === l) {
                            next = 0;
                        }
                        break;
                }

                return this.cur = list[next];
            },

            setCur : function (sid) {
                if (this.list.indexOf(sid) === -1) {
                    this.add(sid);
                }
                this.cur = sid;
            },

            reset : function () {
                // 为隔离删除等操作对cur的影响，存放的是当前song id，而非播放到的列表位置
                this.cur = '';

                // XXX: 应维护类似set的数据结构，song id在list中是唯一的，这个需求假设不变！
                if (_.isArray(this.list)) {
                    this.list.length = 0;
                } else {
                    this.list = [];
                }
            }
        }),

        Logger = Model.extend({
            initialize : function (player, data) {
                var defaults = {
                    os : utils.os,
                    pid : cfg.pid,
                    v : cfg.version,
                    from : win.location.href
                };

                // 存放默认的统计字段用
                this.data = _.extend(defaults, data);

                this.player = player;
                this.engine = player.engine;
                // XXX: timerResolution = 25ms是最小的计时粒度，
                // 这个不经测试调优就尽量不要改，会影响部分统计数据和性能
                this.timer = new Timer(timerResolution);

                this.initListeners();
            },

            initListeners : function () {
                var self = this;
                this.firstPlay = false; //标记是不是setUrl后的第一次play

                _.bindAll(this, 'send60s', 'send100ms', 'sendPlayEnd');

                this.player.on('player:fetchstart', function () {
                    //self.timer.clear().after('60 seconds', self.send60s).start();
                    self.firstPlay = true;
                });

                this.player.on('player:fetch', function (r) {
                    // 每首歌特有的统计项, 在fetch时会重置覆盖上一首歌的
                    _.extend(self.data, {
                        lid : '13_' + Math.random().toString().substr(2),
                        l : r.bitrate && r.bitrate.file_link || '',
                        bn : -1,
                        bwt : 0,
                        flag : 1
                    });

                    if (r.error_code !== code.SUCCESS) {
                        _.extend(self.data, {
                            flag : 0,
                            lerr : r.error_code
                        });
                    }

                    var info = r.songinfo;
                    if (info) {
                        _.extend(self.data, {
                            songid : info.song_id,
                            resource_type : info.resource_type
                        });
                    }
                    self.sendPlayStart();
                });

                /* this.player.on('player:fetchend', function() {
                 self.data.s2p = self.timer.time();
                 });*/

                // timer的pause和play主要是为了不影响60s的统计
                this.player.on('player:pause', function () {
                    self.timer.stop();
                });

                this.player.on('player:play', function () {
                    if (self.firstPlay) {
                        self.firstPlay = false;
                        self.send100ms();
                        self.timer.clear().after('59 seconds', self.send60s).start();
                    }
                    self.timer.start();

                });

                this.player.on('player:next player:prev', function (manual) {
                    /*if (manual) {
                        self.sendPlayEnd({  //自动切换
                            endflag : 0
                        });
                    }else{
                        self.sendPlayEnd({  //手动切换
                            endflag : 1
                        });
                    }*/
                    self.sendPlayEnd({
                        endflag : manual ? 0 : 1
                    })
                });
                this.player.on('ended', function(){
                    self.sendComplete();
                });

                this.player.on('error', function () {
                    self.data.f = 0;
                    self.trigger('ended');
                });

                this.player.on('loadeddata', function () {
                    self.bufferTimer = (self.bufferTimer ||
                        new Timer(timerResolution)).start();
                    self.data.bn++;
                });

                this.player.on('canplay', function () {
                    self.data.bwt += self.bufferTimer.time();
                    self.bufferTimer.stop();
                    //self.send100ms();
                });
            },

            _send : function (params, options) {
                var data = _.clone(this.data),
                    opts = _.extend({
                        src : 'http://nsclick.baidu.com/v.gif'
                    }, options);

                params = _.extend(data, params);

                if (cfg.debug) {
                    console.log(params);
                }
                _.getScript(opts.src + '?' + _.param(params));
            },

            sendExposure : function () {
                this._send({ type : 'exposure', expoitem : 'bkmini', page : "baike"})
            },

            sendPlayStart : function () {
                this._send({
                    type : 'playstart'
                })
            },

            send100ms : function () {
                _.extend(this.data, {
                });
                this._send({
                    type : 'playsong100ms'
                });
            },

            send60s : function () {
                this._send({
                    type : '60play'
                });
            },

            sendPlayEnd : function (options) {
                var defaults = {
                        endflag : 1
                    },
                    opts = _.extend(defaults, options);

                this._send({
                    type : 'playend',
                    s2e : this.timer.time(),
                    pos : this.engine.getCurrentPosition(),
                    endflag : opts.endflag
                });
            },

            sendComplete : function(){
                this._send({
                    type : 'playcomplete'
                })
            }
        }),

        Player = Model.extend({
            initialize : function (options) {
                var defaults = {
                        playlist : new Playlist(),
                        engine : new PlayEngine({
                            subEngines : [
                                {
                                    constructorName : 'PlayEngine_Audio'
                                }
                            ]
                        }),
                        hasLogger : true
                    },
                    opts = _.extend(defaults, options);

                this._first = true;
                this.playlist = opts.playlist;
                this.initEngine(opts.engine);

                if (opts.hasLogger) {
                    this.initLogger();
                }
            },

            initLogger : function (logger) {
                this.logger = logger || new Logger(this);
            },

            // 事件参考: http://www.whatwg.org/specs/web-apps/current-work/multipage/the-video-element.html#mediaevents
            // 原则上应尽量保持和HTML5规范同样的事件名
            initEngine : function (engine) {
                var self = this;

                this.engine = engine;
                engine.init();

                _.each([
                    'canplay', 'play', 'playing', 'pause', 'waiting',
                    'timeupdate', 'error', 'ended', 'loadeddata'
                ], function (eventName) {
                    engine.curEngine.audio.addEventListener(eventName, function (e) {
                        self.trigger(eventName);
                        if (eventName === 'ended') {
                            self.next(true);
                        }
                    });
                });
            },

            // TODO: 现在为了方便传入的参数有多重含义, 之后必须重构
            // 为数字时表示需要第几毫秒开始播放
            // 为true时表示强制选连
            // 为'empty'时为了IOS5以下设备去HACK
            play : function (param) {
                var engine = this.engine;

                if (_.isNumber(param)) {
                    engine.setCurrentPosition(param);
                } else if (param === true) {

                    this.fetch().done(function () {
                        engine.play();
                    });
                } else if (param === 'empty' && this._first && engine.getState() === 'ready') {
                    // HACK: 某些设备下需先播一空mp3文件激活audio engine
                    // 在app.js里做了$doc第一次click时的触发
                    engine.setUrl(cfg.assetsPath + '/empty.mp3');
                    engine.play();
                    this._first = false;
                    return;
                } else {
                    engine.play();
                }

                return this.trigger('player:play', param);
            },

            pause : function () {
                if (this.engine.getState() !== 'pause') {
                    this.engine.pause();
                }
                this.trigger('player:pause');
                return this;
            },

            stop : function () {
                this.engine.stop();
                this.trigger('player:stop');
                return this;
            },

            replay : function () {
                return this.stop().play();
            },

            prev : function (manual) {
                this.playlist.prev();
                this.trigger('player:prev', manual);
                return this.play(true);
            },

            next : function (manual) {
                this.playlist.next();
                this.trigger('player:next', manual);
                return this.play(true);
            },

            // 传入sid时如果没有该歌曲则调用playlist的add
            // 将其加入playlist，并将其设为当前播放歌曲
            cur : function (sid) {
                var pl = this.playlist,
                    cur;

                if (sid) {
                    pl.setCur(sid);
                    return this;
                }

                cur = encode(pl.cur || '');

                if (!cur && pl.list.length) {
                    cur = pl.list[0];
                    pl.setCur(cur);
                }

                return cur;
            },
            /**
             * 根据index播放歌曲
             * @param index {Number}
             * @return {Object}
             */
            playByIndex : function (index) {
                var cur,
                    list = this.playlist.list;
                if (index > -1 && index < list.length) {
                    cur = list[index];
                } else {
                    cur = list[0];
                }
                this.playlist.setCur(cur);
                this.play(true);
                return cur;
            },
            /**
             *
             * @return {*}
             */
            getCurSong : function () {
                return this._curSong;
            },
            curPos : function () {
                return this.engine.getCurrentPosition() / 1000;
            },

            getSidByAid : function (aid, callback) {
                var self = this,
                    def = _.Deferred();
                utils.api('baidu.ting.album.getAlbumInfo', {album_id : aid}).done(function (r) {

                    var sid = _.pluck(r.songlist || [], 'song_id');

                    callback(sid);
                    def.resolve(r);
                });
            },

            duration : function () {
                if (!this._curSong) {
                    return 0;
                }

                var song = this._curSong,
                    duration = song.bitrate ? song.bitrate.file_duration : 0;

                return duration || this.engine.getTotalTime() / 1000;
            },

            add : function (sid) {
                if (sid) {
                    this.playlist.add(sid);
                }
                return this;
            },

            remove : function (sid) {
                if (sid) {
                    this.playlist.remove(sid);
                }
                return this;
            },

            reset : function () {
                this.playlist.reset();
                this.engine.reset();
                return this;
            },

            getState : function () {
                return this.engine.getState();
            },

            setUrl : function (url) {
                return this.engine.setUrl(url);
            },

            getUrl : function () {
                return this.engine.curEngine.audio.src;
            },

            canPlayType : function (type) {
                return this.engine.canPlayType(type);
            },

            fetch : function (sid) {
                var self = this,
                    def = _.Deferred();

                sid = decode(sid || this.cur());
                if (!sid) {
                    def.reject();
                    return def.promise();
                }

                this.trigger('player:fetchstart');

                utils.api('baidu.ting.song.play', {
                    songid : sid
                }, {
                    expires : 0,
                    handleError : function (r) {
                        if (cfg.debug) {
                            // TODO: server返回错误，之后要记录日志或重试吧？
                            console.error('player fetch error: ', sid, r.error_code);
                        }
                        self.trigger('error', r);
                    }
                }).done(function (r) {
                        self.trigger('player:fetch', r);

                        if (r.error_code === code.SUCCESS) {
                            self._curSong = r;
                            self.setUrl(r.bitrate.file_link);
                            self.trigger('player:fetchend', r);
                        }

                        def.resolve(r);
                    });

                return def.promise();
            }
        });

    // HACK: QA的自动化测试不支持Audio标签, 为了测试能跑通做了如下hack
    if (typeof Audio === 'undefined') {
        var proto = Player.prototype;
        _.each(_.functions(proto), function (fn) {
            if (proto.hasOwnProperty(fn)) {
                proto[fn] = function () {
                    return proto;
                };
            }
        });
    }

    // 对外只暴露了Player，故对外而言Playlist是一个供Player内部调用的私有类
    return mbox.Player = {
        Player : Player,
        Logger : Logger
    };
})(_.utils, mbox.CONF, mbox.Model, Timer);
