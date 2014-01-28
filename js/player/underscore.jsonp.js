

;(function(_){
    _.getScript = function (url, op) {
        var doc = document,
            s = doc.createElement('script');
        s.async = 'async';

        if (!op) {
            op = {};
        } else if (isFunction(op)) {
            op = {
                callback : op
            };
        }

        if (op.charset) {
            s.charset = op.charset;
        }

        s.src = url;

        var h = doc.getElementsByTagName('head')[0];

        s.onload = s.onreadystatechange = function (__, isAbort) {
            if (isAbort || !s.readyState || /loaded|complete/.test(s.readyState)) {
                s.onload = s.onreadystatechange = null;
                if (h && s.parentNode) {
                    h.removeChild(s);
                }
                s = undefined;
                if (!isAbort && op.callback) {
                    op.callback();
                }
            }
        };

        h.insertBefore(s, h.firstChild);
    };

    var _createScriptTag = function (scr, url, charset) {
        scr.setAttribute('type', 'text/javascript');
        charset && scr.setAttribute('charset', charset);
        scr.setAttribute('src', url);
        document.getElementsByTagName('head')[0].appendChild(scr);
    };

    var _removeScriptTag = function (scr) {
        if (scr.clearAttributes) {
            scr.clearAttributes();
        } else {
            for (var attr in scr) {
                if (scr.hasOwnProperty(attr)) {
                    delete scr[attr];
                }
            }
        }
        if (scr && scr.parentNode) {
            scr.parentNode.removeChild(scr);
        }
        scr = null;
    };
    //摘自tangram
    _.ajaxJSONP = function (url, callback, opt_options) {
        var scr = document.createElement('SCRIPT'),
            prefix = 'bd__cbs__',
            callbackName,
            options = opt_options || {},
            charset = options['charset'],
            queryField = options['queryField'] || 'callback',
            timeOut = options['timeOut'] || 0,
            timer,
            reg = new RegExp('(\\?|&)' + queryField + '=([^&]*)'),
            matches;

        if (baidu.lang.isFunction(callback)) {
            callbackName = prefix + Math.floor(Math.random() * 2147483648).toString(36);
            window[callbackName] = getCallBack(0);
        } else {
            if (matches = reg.exec(url)) {
                callbackName = matches[2];
            }
        }

        if (timeOut) {
            timer = setTimeout(getCallBack(1), timeOut);
        }

        //如果用户在URL中已有callback，用参数传入的callback替换之
        url = url.replace(reg, '\x241' + queryField + '=' + callbackName);

        if (url.search(reg) < 0) {
            url += (url.indexOf('?') < 0 ? '?' : '&') + queryField + '=' + callbackName;
        }
        _createScriptTag(scr, url, charset);

        /*
         * 返回一个函数，用于立即（挂在window上）或者超时（挂在setTimeout中）时执行
         */
        function getCallBack(onTimeOut) {
            /*global callbackName, callback, scr, options;*/
            return function () {
                try {
                    if (onTimeOut) {
                        options.onfailure && options.onfailure();
                    } else {
                        callback.apply(window, arguments);
                        clearTimeout(timer);
                    }
                    window[callbackName] = null;
                    delete window[callbackName];
                } catch (exception) {
                    // ignore the exception
                } finally {
                    _removeScriptTag(scr);
                }
            }
        }
    };

    _.param = function (data) {
        var arr = [];
        for (var i in data) {
            if (data.hasOwnProperty(i)) {
                arr.push(encodeURIComponent(i) + "=" + encodeURIComponent(data[i]));
            }
        }
        return arr.join('&');
    };
})(_);
