(function() {
    var cfg = mbox.CONF;
    var apiStore = cfg.storages.api,
        apiCode = cfg.apiCode,
        storage = {};

    return _.utils = {
        api: function(url, data, options) {
            var def = _.Deferred(),
                getURL = function(method) {
                    return cfg.api.replace('{{method}}', method);
                },
                key = apiStore.key,

                defaults = {
                    expires: apiStore.expires,

                    // TODO: 默认的错误处理方案是简单粗暴的跳回首页,
                    // 看看是不是还要向服务器端log一下
                    handleError: function(r) {
                        if (cfg.debug) {
                            console.error(r);
                        }
                    }
                };

            // 如果不支持localStorage就干脆不缓存了
            /*if (!storage.isSupportLocalStorage) {
                _.each(_.functions(storage), function(fn) {
                    storage[fn] = function() {};
                });
            }*/

            // TODO: 考虑网络性能问题，应该让后端API Service
            // 提供一个multi api调用的接口
            if (_.isArray(url)) {
                var apis = _.map(url, function(api) {
                        return _.utils.api(api);
                    });
                return _.when.apply(_.utils, apis);
            }

            if (_.isObject(url)) {
                options = data;
                data = url.data || {};
                url = url.url;
            }

            var opts = _.extend(defaults, options);

            key = key + url + JSON.stringify(data);

            var r = cfg.cacheApi && storage[key];
            if (r) {
                def.resolve(r);
                return def.promise();
            }

            // XXX: 所有API请求都应该加上默认from=mixapp（除非强制传了from参数）
            // 该参数和返回的数据有关, 如要改动务必咨询开发API的RD
            if (_.isUndefined(data.from)) {
                data.from = 'mixapp';
            }

            /*$.ajaxJSONP({
                url: getURL(url),
                data: data,
                success: function(r) {
                    var code = r.error_code;

                    if (code) {
                        if ([apiCode.SUCCESS, apiCode.USER_IP_LIMIT].indexOf(code) !== -1) {
                            if (code === apiCode.SUCCESS) {
                                //storage.set(key, r, opts.expires);
                                storage[key] =  r;
                            }
                            def.resolve(r);
                        } else {
                            def.reject(r);
                            opts.handleError(r);
                        }
                    } else {
                        //storage.set(key, r, opts.expires);
                        storage[key] =  r;
                        def.resolve(r);
                    }
                }
            });*/
            var param = _.param(data),
              _url = getURL(url);
            _.ajaxJSONP(_url.indexOf('?') > -1 ? _url + '&' + param : _url + '?' + param, function (r) {
                var code = r.error_code;

                if (code) {
                    if ([apiCode.SUCCESS, apiCode.USER_IP_LIMIT].indexOf(code) !== -1) {
                        if (code === apiCode.SUCCESS) {
                            //storage.set(key, r, opts.expires);
                            storage[key] = r;
                        }
                        def.resolve(r);
                    } else {
                        def.reject(r);
                        opts.handleError(r);
                    }
                } else {
                    //storage.set(key, r, opts.expires);
                    storage[key] = r;
                    def.resolve(r);
                }
            });

            return def.promise();
        },

       duration : function (sec) {
           sec = Math.ceil(sec);

           var fix = function (num) {
                   return num < 10 ? '0' + num : num;
               },
               floor = function (num) {
                   return Math.floor(num);
               },
               parseMinites = function (sec) {
                   var m = floor(sec / 60),
                       s = sec % 60;
                   return fix(m) + ':' + fix(s);
               };

           if (!sec) {
               return '00:00';
           } else if (sec < 60) {
               return '00:' + fix(sec);
           } else if (sec < 3600) {
               return parseMinites(sec);
           } else {
               var h = floor(sec / 3600);
               return fix(h) + ':' + parseMinites(sec % 3600);
           }
       },

        os: (function() {
            var ua = navigator.userAgent,
                ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
                iphone = !ipad && ua.match(/(iPhone\sOS)\s([\d_]+)/);
            return iphone ? 'iphone' : (ua.match(/(Android)\s+([\d.]+)/) ? 'android' : 'other');
        }(undefined))
    };
})();
