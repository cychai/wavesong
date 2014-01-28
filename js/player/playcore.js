// Copyright (c) 2009, Baidu Inc. All rights reserved.
//
// Licensed under the BSD License
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://tangram.baidu.com/license.html
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


var T,
    baidu = T = baidu || {version : "1.5.0"};

//提出guid，防止在与老版本Tangram混用时
//在下一行错误的修改window[undefined]
baidu.guid = "$BAIDU$";

//Tangram可能被放在闭包中
//一些页面级别唯一的属性，需要挂载在window[baidu.guid]上
window[baidu.guid] = window[baidu.guid] || {};

baidu.fn = baidu.fn || {};


baidu.fn.blank = function () {
};


baidu.object = baidu.object || {};


baidu.object.each = function (source, iterator) {
    var returnValue, key, item;
    if ('function' == typeof iterator) {
        for (key in source) {
            if (source.hasOwnProperty(key)) {
                item = source[key];
                returnValue = iterator.call(source, item, key);

                if (returnValue === false) {
                    break;
                }
            }
        }
    }
    return source;
};


baidu.extend =
    baidu.object.extend = function (target, source) {
        for (var p in source) {
            if (source.hasOwnProperty(p)) {
                target[p] = source[p];
            }
        }

        return target;
    };

baidu.number = baidu.number || {};


baidu.number.pad = function (source, length) {
    var pre = "",
        negative = (source < 0),
        string = String(Math.abs(source));

    if (string.length < length) {
        pre = (new Array(length - string.length + 1)).join('0');
    }

    return (negative ? "-" : "") + pre + string;
};


baidu.platform = baidu.platform || {};


baidu.platform.isAndroid = /android/i.test(navigator.userAgent);


baidu.platform.isIpad = /ipad/i.test(navigator.userAgent);


baidu.platform.isIphone = /iphone/i.test(navigator.userAgent);


baidu.browser = baidu.browser || {};

//IE 8下，以documentMode为准
//在百度模板中，可能会有$，防止冲突，将$1 写成 \x241

baidu.browser.ie = baidu.ie = /msie (\d+\.\d+)/i.test(navigator.userAgent) ? (document.documentMode || +RegExp['\x241']) : undefined;


baidu.array = baidu.array || {};


baidu.array.remove = function (source, match) {
    var len = source.length;

    while (len--) {
        if (len in source && source[len] === match) {
            source.splice(len, 1);
        }
    }
    return source;
};


baidu.lang = baidu.lang || {};


baidu.lang.isArray = function (source) {
    return '[object Array]' == Object.prototype.toString.call(source);
};


baidu.lang.isFunction = function (source) {
    // chrome下,'function' == typeof /a/ 为true.
    return '[object Function]' == Object.prototype.toString.call(source);
};


(function () {
    //不直接使用window，可以提高3倍左右性能
    var guid = window[baidu.guid];

    baidu.lang.guid = function () {
        return "TANGRAM__" + (guid._counter++).toString(36);
    };

    guid._counter = guid._counter || 1;
})();


window[baidu.guid]._instances = window[baidu.guid]._instances || {};


baidu.lang.Class = function (guid) {
    this.guid = guid || baidu.lang.guid();
    window[baidu.guid]._instances[this.guid] = this;
};
window[baidu.guid]._instances = window[baidu.guid]._instances || {};


baidu.lang.Class.prototype.dispose = function () {
    delete window[baidu.guid]._instances[this.guid];

    for (var property in this) {
        if (!baidu.lang.isFunction(this[property])) {
            delete this[property];
        }
    }
    this.disposed = true;   // 20100716
};


baidu.lang.Class.prototype.toString = function () {
    return "[object " + (this._className || "Object" ) + "]";
};


baidu.lang.isString = function (source) {
    return '[object String]' == Object.prototype.toString.call(source);
};

// 声明快捷方法
baidu.isString = baidu.lang.isString;


baidu.lang.Event = function (type, target) {
    this.type = type;
    this.returnValue = true;
    this.target = target || null;
    this.currentTarget = null;
};


baidu.lang.Class.prototype.addEventListener = function (type, handler, key) {
    if (!baidu.lang.isFunction(handler)) {
        return;
    }

    !this.__listeners && (this.__listeners = {});

    var t = this.__listeners, id;
    if (typeof key == "string" && key) {
        if (/[^\w\-]/.test(key)) {
            throw("nonstandard key:" + key);
        } else {
            handler.hashCode = key;
            id = key;
        }
    }
    type.indexOf("on") != 0 && (type = "on" + type);

    typeof t[type] != "object" && (t[type] = {});
    id = id || baidu.lang.guid();
    handler.hashCode = id;
    t[type][id] = handler;
};


baidu.lang.Class.prototype.removeEventListener = function (type, handler) {
    if (typeof handler != "undefined") {
        if ((baidu.lang.isFunction(handler) && !(handler = handler.hashCode))
            || (!baidu.lang.isString(handler))
            ) {
            return;
        }
    }

    !this.__listeners && (this.__listeners = {});

    type.indexOf("on") != 0 && (type = "on" + type);

    var t = this.__listeners;
    if (!t[type]) {
        return;
    }
    if (typeof handler != "undefined") {
        t[type][handler] && delete t[type][handler];
    } else {
        for (var guid in t[type]) {
            delete t[type][guid];
        }
    }
};


baidu.lang.Class.prototype.dispatchEvent = function (event, options) {
    if (baidu.lang.isString(event)) {
        event = new baidu.lang.Event(event);
    }
    !this.__listeners && (this.__listeners = {});

    // 20100603 添加本方法的第二个参数，将 options extend到event中去传递
    options = options || {};
    for (var i in options) {
        event[i] = options[i];
    }

    var i, t = this.__listeners, p = event.type;
    event.target = event.target || this;
    event.currentTarget = this;

    p.indexOf("on") != 0 && (p = "on" + p);

    baidu.lang.isFunction(this[p]) && this[p].apply(this, arguments);

    if (typeof t[p] == "object") {
        for (i in t[p]) {
            t[p][i].apply(this, arguments);
        }
    }
    return event.returnValue;
};


baidu.lang.createClass = function (constructor, options) {
    options = options || {};
    var superClass = options.superClass || baidu.lang.Class;

    // 创建新类的真构造器函数
    var fn = function () {
        // 继承父类的构造器
        if (superClass != baidu.lang.Class) {
            superClass.apply(this, arguments);
        } else {
            superClass.call(this);
        }
        constructor.apply(this, arguments);
    };

    fn.options = options.options || {};

    var C = function () {
        },
        cp = constructor.prototype;
    C.prototype = superClass.prototype;

    // 继承父类的原型（prototype)链
    var fp = fn.prototype = new C();

    // 继承传参进来的构造器的 prototype 不会丢
    for (var i in cp) fp[i] = cp[i];

    typeof options.className == "string" && (fp._className = options.className);

    // 修正这种继承方式带来的 constructor 混乱的问题
    fp.constructor = cp.constructor;

    // 给类扩展出一个静态方法，以代替 baidu.object.extend()
    fn.extend = function (json) {
        for (var i in json) {
            fn.prototype[i] = json[i];
        }
        return fn;  // 这个静态方法也返回类对象本身
    };

    return fn;
};


baidu.lang.inherits = function (subClass, superClass, className) {
    var key, proto,
        selfProps = subClass.prototype,
        clazz = new Function();

    clazz.prototype = superClass.prototype;
    proto = subClass.prototype = new clazz();
    for (key in selfProps) {
        proto[key] = selfProps[key];
    }
    subClass.prototype.constructor = subClass;
    subClass.superClass = superClass.prototype;

    // 类名标识，兼容Class的toString，基本没用
    if ("string" == typeof className) {
        proto._className = className;
    }
};

// 声明快捷方法
baidu.inherits = baidu.lang.inherits;


baidu.lang.isBoolean = function (o) {
    return typeof o === 'boolean';
};


baidu.lang.isElement = function (source) {
    return !!(source && source.nodeName && source.nodeType == 1);
};


baidu.lang.isNumber = function (source) {
    return '[object Number]' == Object.prototype.toString.call(source) && isFinite(source);
};


baidu.lang.isObject = function (source) {
    return 'function' == typeof source || !!(source && 'object' == typeof source);
};

// 声明快捷方法
baidu.isObject = baidu.lang.isObject;


baidu.fn.bind = function (func, scope) {
    var xargs = arguments.length > 2 ? [].slice.call(arguments, 2) : null;
    return function () {
        var fn = baidu.lang.isString(func) ? scope[func] : func,
            args = (xargs) ? xargs.concat([].slice.call(arguments, 0)) : arguments;
        return fn.apply(scope || fn, args);
    };
};


baidu.each = baidu.array.forEach = baidu.array.each = function (source, iterator, thisObject) {
    var returnValue, item, i, len = source.length;

    if ('function' == typeof iterator) {
        for (i = 0; i < len; i++) {
            item = source[i];
            //TODO
            //此处实现和标准不符合，标准中是这样说的：
            //If a thisObject parameter is provided to forEach, it will be used as the this for each invocation of the callback. If it is not provided, or is null, the global object associated with callback is used instead.
            returnValue = iterator.call(thisObject || source, item, i);

            if (returnValue === false) {
                break;
            }
        }
    }
    return source;
};


baidu.array.some = function (source, iterator, thisObject) {
    var i = 0,
        len = source.length;
    for (; i < len; i++) {
        if (i in source && iterator.call(thisObject || source, source[i], i)) {
            return true;
        }
    }
    return false;
};


baidu.browser.chrome = /chrome\/(\d+\.\d+)/i.test(navigator.userAgent) ? +RegExp['\x241'] : undefined;


baidu.browser.firefox = /firefox\/(\d+\.\d+)/i.test(navigator.userAgent) ? +RegExp['\x241'] : undefined;


baidu.browser.isWebkit = /webkit/i.test(navigator.userAgent);

try {
    if (/(\d+\.\d+)/.test(external.max_version)) {

        baidu.browser.maxthon = +RegExp['\x241'];
    }
} catch (e) {
}

(function () {
    var ua = navigator.userAgent;


    baidu.browser.safari = /(\d+\.\d)?(?:\.\d)?\s+safari\/?(\d+\.\d+)?/i.test(ua) && !/chrome/i.test(ua) ? +(RegExp['\x241'] || RegExp['\x242']) : undefined;
})();

baidu.dom = baidu.dom || {};


baidu.dom.g = function (id) {
    if ('string' == typeof id || id instanceof String) {
        return document.getElementById(id);
    } else if (id && id.nodeName && (id.nodeType == 1 || id.nodeType == 9)) {
        return id;
    }
    return null;
};

// 声明快捷方法
baidu.g = baidu.G = baidu.dom.g;

baidu.string = baidu.string || {};


/**
 * @fileoverview: 通用库
 * @author: qiaogang
 * @requires tangram.js
 * @date: Wednesday, April 11, 2012
 *
 */
var mbox = mbox || {};
var M3 = M3 || mbox || {};
T.object.extend(mbox, {
    /**
     * 创建命名空间，  支持申请多级命名和多个命名空间如
     * @example 例mbox.namespace("lang"), mbox.lang=mbox.lang||{},
     *  mbox.namespace("m3.dispatch"), mbox.namespace("lang","m3");
     * @param {string} name
     * @return obj,最后申请的命名空间.
     */
    namespace : function () {
        var a = arguments, o = null, i, j, d;
        for (i = 0, len = a.length; i < len; i++) {
            d = ('' + a[i]).split('.');
            o = mbox;
            for (j = (d[0] == 'mbox') ? 1 : 0; j < d.length; j = j + 1) {
                o[d[j]] = o[d[j]] || {};
                o = o[d[j]];
            }
        }
        return o;
    },

    /**
     * 转换时间，毫秒转换为mm:ss格式
     * @param {Number} time
     * @return {String} 格式mm:ss
     * @member mbox
     */
    convertTime : function (time) {
        var minute, second;
        time = Math.round(time / 1000);
        minute = Math.floor(time / 60);
        second = time % 60;
        return T.number.pad(minute, 2) + ':' + T.number.pad(second, 2);
    },

    /**
     * 计时器类
     * 可以创建新的 Timer 对象，以便按指定的时间顺序运行代码。 使用 start() 方法来启动计时器。
     * 通过addEventListener添加定时处理句柄。
     * 可以开始、暂停、终止一个计时器
     * @member mbox
     * @namespace
     * @name Timer
     */
    Timer : (function (window, undefined) {
        /**
         * Timer构造函数,由于是由匿名执行的函数返回的构造函数，所以在生成文档时名称难改。（音乐盒文档中出现多次）
         * @example 创建一个计时器
         *          var timer=new mbox.Timer(1000,3);
         * @param {Number} delay 计时器事件间的延迟 单位:毫秒(ms) 注意：间隔在0-15ms时可能计算不准确
         * @param {Number} repeatCount 设置的计时器运行总次数。如果重复计数设置为 0，则计时器将持续不断运行，直至调用了 stop()/reset() 方法或程序停止。
         * @member mbox.Timer
         */
        var fn = function (delay, repeatCount) {
            this._timer = function () {
            };
            this._listener = function () {
            };
            this._timerComplete = function () {
            };
            this._timerID = null;
            this._delay = this._remain = delay;
            this._repeatCount = repeatCount || 0;
            this._currentCount = 0;
            this._isRunning = false;
            this._startTime = this._endTime = 0;
            this.EVENTS = {
                TIMER : 'timer',
                COMPLETE : 'timerComplete'
            };
        };


        fn.prototype =
        /**
         * @lends mbox.Timer
         */
        {
            /**
             * 根据传参创建新的计时器
             * @param {Object} dalay 计时器事件间的延迟 单位:毫秒(ms) 注意：间隔在0-15ms时可能计算不准确
             * @param {Object} repeatCount 设置的计时器运行总次数。如果重复计数设置为 0，则计时器将持续不断运行，直至调用了 stop()/reset() 方法或程序停止。
             * @private
             */
            _createTimer : function (delay, repeatCount) {
                var me = this;
                if (repeatCount == 1) {
                    return function () {
                        return window.setTimeout(function () {
                            me.reset();
                            me._listener(me._delay, repeatCount);
                            me._timerComplete();
                        }, delay);
                    }
                } else {
                    return function () {
                        return window.setInterval(function () {
                            if (repeatCount != 0 && me._currentCount >= repeatCount) {
                                me.reset();
                                me._timerComplete();
                            } else {
                                me._currentCount++;
                                me._listener(delay, me._currentCount);
                            }
                        }, delay);
                    }
                }
            },

            /**
             * 添加事件侦听器
             * 监听类型: EVENTS.TIMER 每当 Timer 对象达到根据 Timer.delay 属性指定的间隔时调度。
             * EVENTS.COMPLETE 每当它完成 Timer.repeatCount 设置的请求数后调度。
             * @method addEventListener
             * @param {String} type 监听事件类型
             * @param {Function} listener 事件侦听器
             * @member mbox.Timer
             */
            addEventListener : function (type, listener) {
                if (type == "timer") {
                    this._listener = listener;
                    this._timer = this._createTimer(this._delay, this._repeatCount);
                } else if (type == "timerComplete") {
                    this._timerComplete = listener;
                }
            },

            /**
             * 如果计时器正在运行，则停止计时器，并将 _currentCount 属性设回为 0，这类似于秒表的重置按钮。
             * @method reset
             * @member mbox.Timer
             */
            reset : function () {
                this.stop();
                if (this._repeatCount == 1) {
                    this._timer = this._createTimer(this._delay, this._repeatCount);
                }
                this._currentCount = 0;
                this._remain = this._delay;
                this._startTime = this._endTime = 0;
            },

            /**
             * 如果计时器尚未运行，则启动计时器。
             * @method start
             * @member mobx.Timer
             */
            start : function () {
                if (!this._timerID) {
                    this._timerID = this._timer();
                    if (this._repeatCount == 1) {
                        this._startTime = new Date().getTime();
                    }
                    this._isRunning = true;
                }
            },

            /**
             * 停止计时器。 如果在调用 stop() 后调用 start()，则将继续运行计时器实例，运行次数为剩余的 重复次数（由 repeatCount 属性设置）。
             * @method stop
             * @member mobx.Timer
             */
            stop : function () {
                if (this._timerID) {
                    if (this._repeatCount == 1) {
                        window.clearTimeout(this._timerID);
                    } else {
                        window.clearInterval(this._timerID);
                    }
                    this._timerID = null;
                    this._isRunning = false;
                }
            },

            /**
             * 暂停计时器。
             * 调用时暂停计时器计时，start()后，从上次暂停时的时间开始继续计时。
             * 例如：一个20秒的计时器，在第5秒处暂停，当再次start()后，计时器将从第6秒开始，完成剩余的时间。
             * 注意：目前只支持repeatCount = 1的情况。其他情况调用等同于stop()。
             * @method pause
             * @member mbox.Timer
             */
            pause : function () {
                if (this._repeatCount == 1) {
                    if (this._timerID) {
                        this.stop();

                        this._endTime = new Date().getTime();
                        this._remain = this._remain - (this._endTime - this._startTime);
                        if (this._remain > 0) {
                            this._timer = this._createTimer(this._remain, 1);
                        } else {
                            this.reset();
                        }
                    }
                } else {
                    this.stop();
                }
            },

            /**
             * 获得计时器从 0 开始后触发的总次数。
             * @method getCurrentCount
             * @return {Number}
             * @member mbox.Timer
             */
            getCurrentCount : function () {
                return this._currentCount;
            },

            /**
             * 判断计时器是否在运行
             * @method isRunning
             * @return {Boolean}
             * @member mbox.Timer
             */
            isRunning : function () {
                return this._isRunning;
            }
        };

        return fn;
    })(window)

});

/**
 * @namespace
 * @name mbox.lang
 */
mbox.namespace('mbox.lang');
T.object.extend(mbox.lang, {
    /**
     * @lends mbox.lang
     */
    /**
     * 创建一个类，包括创造类的构造器、继承基类T.lang.Class
     * 基于T.lang.createClass进行了封装
     * @param {Function} constructor 构造函数
     * @param {Object} options
     * @return
     * @member mbox.lang
     */
    createClass : function (constructor, options) {
        var fn = T.lang.createClass(constructor, options);

        /*fn.extend = function (json) {
            for (var i in json) {
                fn.prototype[i] = (function (method, name) {
                    if (T.lang.isFunction(method)) {
                        return function () {
                            this.dispatchEvent(name, {
                                name : name,
                                arguments : arguments
                            });
                            var res = method.apply(this, arguments);
//                            this.dispatchEvent('afterCallMethod', {
//                                name : name,
//                                arguments : arguments,
//                                result : res
//                            });
                            return res;
                        };
                    } else {
                        return method;
                    }
                })(json[i], i);
//                fn.prototype[i] = json[i];
            }
            return fn;
        };*/

        /*
         fn.before = function(json) {
         for (var i in json) {
         var _method = fn.prototype[i];
         if (typeof _method == 'function') {
         var _newMethod = function(arguments) {
         _method.apply(fn, arguments);
         }
         }
         fn.prototype[i] = json[i];
         }
         return fn;
         };

         fn.after = function(json) {

         return fn;
         };
         */
        return fn;
    }
});


/**
 * @fileoverview 播放器控制类 外部调用的入口
 * @authod qiaogang@baidu.com
 * @requires PlayEngine_Interface.js
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */
/**
 * @requires ../common/commone.js, ../common/tangram-custom-full-yui.js
 * 播放核心PlayEngine,封装了playcore2子内核的实现，提供给外部统一的创建实例和使用playcore2的入口。
 * @class PlayEngine 继承了tangram.lang.Class,带有setEventListener,dispatchEvent等事件监听和派发的函数.
 * @extends T.lang.Class
 * @param {Object}  conf初始化参数，设置要加载的子内核
 * @conf {Array} subEngines 子内核的配置项，
 * @example var player = new PlayEngine({
    subEngines : [{ constructorName : 'PlayEngine_Audio' }] });
 */
var PlayEngine = mbox.lang.createClass(function (conf) {
    conf = conf || {};
    //子内核的配置项

    this.subEnginesConf = [];
    this.subEnginesInitArgs = {};
    this.curEngine = null;
    this.curEngineType = '';
    //只未初始化的内核(已new)
    this.unInitEngineList = [];
    //初始化(init)成功&浏览器支持(test)的内核实例
    this.engineList = [];
    this.engineTypeList = [];
    this.ready = false;
    this.defaultExt = '.mp3';

    this.coreContainer = null;
    /**
     * 常量PlayEngine中定义的事件<br/>
     * this.EVENTS = {
     &nbsp;&nbsp;STATECHANGE     : 'playStateChange',    //播放状态改变事件(STATES)<br/>
     &nbsp;&nbsp;POSITIONCHANGE  : 'positionChange',     //播放时播放进度改变事件<br/>
     &nbsp;&nbsp;PROGRESS        : 'progress',           //加载时加载进度改变事件<br/>
     &nbsp;&nbsp;ERROR           : 'error',              //播放过程中出错时的事件<br/>
     &nbsp;&nbsp;INIT            : 'initSuccess',        //播放器初始化成功时的事件<br/>
     &nbsp;&nbsp;INITFAIL        : 'initFail'            //播放器初始化失败时的事件<br/>
        };
     * @final EVENTS,
     * @type {Object}
     * @member PlayEngine
     */
    this.EVENTS = {
        STATECHANGE : 'player_playStateChange', //播放状态改变事件(STATES)
        POSITIONCHANGE : 'player_positionChange', //播放时播放进度改变事件
        PROGRESS : 'player_progress', //加载时加载进度改变事件
        ERROR : 'player_error', //播放过程中出错时的事件
        INIT : 'player_initSuccess', //播放器初始化成功时的事件
        INITFAIL : 'player_initFail'            //播放器初始化失败时的事件
    };

    /**
     * 常量PlayEngine中定义的播放器状态.       <br/>
     * this.STATES={                         <br/>
     &nbsp;INIT       : 'init',        //-2 还未初始化<br/>
     &nbsp;READY      : 'ready',       //-1 初始化成功(dom已加载)<br/>
     &nbsp;STOP       : 'stop',        //0<br/>
     &nbsp;PLAY       : 'play',        //1<br/>
     &nbsp;PAUSE      : 'pause',       //2<br/>
     &nbsp;END        : 'end',         //3<br/>
     &nbsp;BUFFERING  : 'buffering',   //4<br/>
     &nbsp;PREBUFFER  : 'pre-buffer'   //5<br/>
        };
     * @final EVENTS,
     * @member PlayEngine
     */
    this.STATES = {
        INIT : 'init', //-2 还未初始化
        READY : 'ready', //-1 初始化成功(dom已加载)
        STOP : 'stop', //0
        PLAY : 'play', //1
        PAUSE : 'pause', //2
        END : 'end', //3
        BUFFERING : 'buffering', //4
        PREBUFFER : 'pre-buffer', //5
        ERROR : 'error'        //6
    };

    //progress timer 模拟加载进度事件
    this.progressTimer = new mbox.Timer(200, 0);
    //position timer 模拟播放进度事件
    this.positionTimer = new mbox.Timer(100, 0);
    this._initEngines(conf);
}, {
    className : 'PlayEngine'
}).extend({
        /**
         * @private _error
         */
        _error : function (errMsg) {
            throw new Error(errMsg);
        },

        /**
         * @method  初始化给定的子内核构造函数名称
         * @private
         * @member PlayEngine
         * @param {String} engines,子内核的构造函数名称，如:"PlayEngine_FMP";
         */
        _initEngines : function (config) {
            this.coreContainer = config.el || null;

            this.subEnginesConf = config.subEngines || [];

            T.array.each(this.subEnginesConf, T.fn.bind(function (item, index) {
                var subEngineName = item.constructorName,
                    args = item.args || {},
                    subEngineConstructor;

                this.subEnginesInitArgs[subEngineName] = args;

                try {
                    subEngineConstructor = eval(subEngineName);
                    if (!T.lang.isFunction(subEngineConstructor)) {
                        return;
                    }
                } catch (e) {
                    return;
                }
                var engine = new subEngineConstructor(args);
                this.unInitEngineList.push(engine);
            }, this));

            // 给一个默认的 curEngine 值，防止调用 play、reset 等方法时报错
            this.curEngine = this.unInitEngineList[0];
        },

        /**
         * 初始化播放内核
         * //注意：监听初始化事件，需要在init之前注册
         * @method
         * @member PlayEngine
         */
        init : function (options) {
            if (this.ready) {
                return this._error('');
            }

            options = options || {};

            this.subEnginesInitArgs = options.subEngines ?
                options.subEngines : this.subEnginesInitArgs;

            this.coreContainer = options.el ?
                options.el : this.coreContainer;

            if (!this.coreContainer) {
                var con = document.createElement('div');
                con.id = '_player_container_' + T.lang.guid()
                con.style.width = '1px';
                con.style.height = '1px';
                con.style.overflow = "hidden";
                /*T.dom.setStyles(con, {
                 'width'     : '1px',
                 'height'    : '1px',
                 'overflow'  : 'hidden'*/
                /*,
                 'position'  : 'absolute',
                 'top'       : '-10px',
                 'zIndex'    : '1'*/
                /*
                 });*/
                document.body.appendChild(con);
                this.coreContainer = options.el = con;
            }

            //init core
            T.array.each(this.unInitEngineList, T.fn.bind(function (engine, index) {
                var subEngineNameToString = engine.toString(),
                    subEngineName = '',
                    reg = /^\[object (.*)\]$/i;
                if (reg.test(subEngineNameToString)) {
                    subEngineName = RegExp.$1;
                }
                var args = this.subEnginesInitArgs[subEngineName] || {};
                if (engine.test(true)) {
                    args.instanceName = args.instanceName + '.engineList[' + this.engineList.length + ']';
                    args.el = args.el || this.coreContainer;
                    this.engineList.push(engine);
                    engine.init.apply(engine, [args]);
                }
            }, this));

            //switch core
            this.switchEngineByUrl(this.defaultExt);
            this.ready = true;
            this._initProgressEvent();
            this._initPositionChangeEvent();
        },

        /**
         * 判断指定的mimeType或格式是否支持
         *
         * @param {String} mimeType mimeType或文件扩展名
         * @return {Boolean}
         * @member PlayEngine
         * @method canPlayType
         */
        canPlayType : function (mimeType) {
            return T.array.some(this.engineList, function (item, index) {
                return item.canPlayType(mimeType);
            });
        },

        /**
         * 获取支持的格式类型
         *
         * @member PlayEngine
         * @return {Array(String)} 支持的类型
         * @method
         */
        getSupportMimeTypeList : function () {
            var list = [];
            T.array.each(this.engineList, T.fn.bind(function (item, index) {
                list = list.concat(item.getSupportMimeTypeList());
            }, this));
            return list;
        },

        /**
         * 根据播放资源的URL选择播放子内核
         * @member PlayEngine
         * @param {String} url
         * @return
         * @method
         */
        switchEngineByUrl : function (url/*, stopRecursion*/) {
            var has = T.array.some(this.engineList, T.fn.bind(function (item, index) {
                var str = item.getSupportMimeTypeList().join('|');
                var reg = new RegExp('\\.(' + str + ')(\\?|$)', 'ig');
                if (reg.test(url)) {
                    this.curEngine = item;
                    this.curEngineType = item.getEngineType();
                    return true;
                }
            }, this));
            //如果没有匹配到，使用默认扩展名适配。并且切断递归调用，防止死循环
            var stopRecursion = arguments[1];
            if (!has && !stopRecursion) {
                arguments.callee.apply(this, [this.defaultExt, true]);
            }
        },

        /**
         * 根据指定的扩展名或MimeType选择播放子内核
         * @member PlayEngine
         * @param {String} mimeType
         * @return
         * @method
         */
        switchEngineByMimeType : function (mimeType) {
            T.array.some(this.engineList, T.fn.bind(function (item, index) {
                if (item.canPlayType(mimeType)) {
                    this.curEngine = item;
                    this.curEngineType = item.getEngineType();
                    return true;
                }
            }, this));
        },

        /**
         * 重置播放器
         * @member PlayEngine
         * @example player.reset();
         * @return
         * @method reset
         */
        reset : function () {
            this.curEngine.reset.apply(this.curEngine, arguments);
        },

        /**
         *
         * 设置播放核调度器的音频地址
         * @member PlayEngine
         * @param {String} url 音频地址
         * @return
         * @method setUrl
         */
        setUrl : function (url) {
            var oldEngie = this.curEngine;
            this.switchEngineByUrl(url);
            if (oldEngie && oldEngie != this.curEngine) {
                oldEngie.stop();
            }
            if (this.curEngine) {
                this.curEngine.setUrl.apply(this.curEngine, arguments);
            }
        },
        /**
         * 获取当前资源的url
         * @member PlayEngine
         * @return {String} url
         */
        getUrl : function () {
            return this.curEngine.getUrl.apply(this.curEngine, arguments);
        },

        /**
         *
         * 操作播放核调度器播放
         * @param {Number} [pos] Default: 'undefined'。制定播放的位置 单位：毫秒。如果没有参数，则从当前位置开始播放。
         * @method play
         * @member PlayEngine
         */
        play : function (pos) {
            if (typeof pos == 'undefined') {
                if (this.curEngine) {
                    return this.curEngine.play.apply(this.curEngine, arguments);
                }
            } else {
                return this.setCurrentPosition(pos);
            }
        },

        /**
         * 操作播放核调度器暂停
         * @member PlayEngine
         * @method pause
         */
        pause : function () {
            if (this.curEngine) {
                return this.curEngine.pause.apply(this.curEngine, arguments);
            }
        },

        /**
         * 操作播放核调度器停止
         * @member PlayEngine
         * @method stop
         */
        stop : function () {
            if (this.curEngine) {
                return this.curEngine.stop.apply(this.curEngine, arguments);
            }
        },

        /**
         * 设置播放核调度器静音状态
         * @method setMute
         * @member PlayEngine
         * @param {Boolean} mute 播放核是否静音
         */
        setMute : function (mute) {
            var args = arguments;
            T.array.each(this.engineList, function (item, index) {
                item.setMute.apply(item, args);
            });
        },

        /**
         * 取得播放核调度器静音状态
         * @member PlayEngine
         * @method getMute
         * @return {Boolean} 播放核是否静音
         */
        getMute : function () {
            if (this.curEngine) {
                return this.curEngine.getMute.apply(this.curEngine, arguments);
            }
            return false;
        },

        /**
         * 设置播放核调度器音量大小
         * @member PlayEngine
         * @method setVolume
         * @param {Number} volume 音量大小，取值范围 0-100，0 最小声
         */
        setVolume : function (volume) {
            var args = arguments;
            T.array.each(this.engineList, function (item, index) {
                item.setVolume.apply(item, args);
            });
        },

        /**
         * 取得播放核调度器音量大小
         * @method getVolume
         * @member PlayEngine
         * @return {Number} 播放核音量大小，范围 0-100，0 最小声
         */
        getVolume : function () {
            if (this.curEngine) {
                return this.curEngine.getVolume.apply(this.curEngine, arguments);
            }
            return 0;
        },

        /**
         * 设置播放核调度器当前播放进度并播放
         * @member PlayEngine
         * @method setCurrentPosition
         * @param {Number} time 目标播放时间，单位：毫秒
         */
        setCurrentPosition : function (time) {
            if (this.curEngine) {
                return this.curEngine.setCurrentPosition.apply(this.curEngine,
                    arguments);
            }
        },

        /**
         * 取得播放核调度器当前播放进度
         *  @member PlayEngine
         * @method getCurrentPosition
         * @return {Number} 当前播放时间，单位：毫秒
         */
        getCurrentPosition : function () {
            if (this.curEngine) {
                return this.curEngine.getCurrentPosition.apply(this.curEngine,
                    arguments);
            }
            return 0;
        },

        /**
         * 取得播放核调度器当前播放进度的字符串表现形式
         *  @member PlayEngine
         * @method getCurrentPositionString
         * @return {String} 当前播放时间，如 00:23
         */
        getCurrentPositionString : function () {
            return mbox.convertTime(this.getCurrentPosition());
        },

        /**
         * 取得播放核调度器当前下载百分比
         *  @member PlayEngine
         * @method getLoadedPercent
         * @return {Number} 下载百分比，取值范围 0-1
         */
        getLoadedPercent : function () {
            if (this.curEngine) {
                return this.curEngine.getLoadedPercent.apply(this.curEngine,
                    arguments);
            }
            return 0;
        },

        /**
         * 取得当前文件下载了多少byte，单位byte
         * @member PlayEngine
         * @method getLoadedBytes
         * @reuturn {Number} 下载了多少byte
         */
        getLoadedBytes : function () {
            if (this.curEngine) {
                return this.curEngine.getLoadedBytes.apply(this.curEngine,
                    arguments);
            }
        },
        /**
         * 取得当前链接文件的总大小
         * @member PlayEngine
         * @method getTotalBytes
         * @return {Number} 当前资源的总大小，单位byte
         */
        getTotalBytes : function () {
            if (this.curEngine) {
                return this.curEngine.getTotalBytes.apply(this.curEngine,
                    arguments);
            }
            return 0;
        },

        /**
         * 取得播放核调度器当前 URL 总播放时长
         * @member PlayEngine
         * @method getTotalTime
         * @return {Number} 总时长，单位：毫秒
         */
        getTotalTime : function () {
            if (this.curEngine) {
                return this.curEngine.getTotalTime.apply(this.curEngine,
                    arguments);
            }
            return 0;
        },

        /**
         * 取得播放核调度器当前 URL 总播放时长的字符串表现形式
         * @member PlayEngine
         * @method getTotalTimeString
         * @return {String} 总时长，如 00:23
         */
        getTotalTimeString : function () {
            return mbox.convertTime(this.getTotalTime());
        },

        /**
         * 获取当前子内核的实例
         * @member PlayEngine
         * @return {Object} curEngine 当前子内核实例对象
         */
        getCurEngine : function () {
            return this.curEngine;
        },

        /**
         * 获取当前播放内核的种类
         * @member PlayEngine
         * @return {String} 播放内核种类
         * @method getEngineType
         */
        getEngineType : function () {
            return this.getCurEngine().getEngineType();
        },

        /**
         * 获取播放器版本号
         * @member PlayEngine
         * @return {Object} 当前已初始化成功的子内核类型和对应的版本号 {engineType:engineVersion,...}
         */
        getVersion : function () {
            var res = {};
            T.array.each(this.engineList, function (item, index) {
                res[item.getEngineType()] = item.getVersion();
            });
            return res;
        },

        /**
         * 取得当前播放核调度器播放状态
         * @member PlayEngine
         * @method getState
         * @return {?String} 当前播放状态
         */
        getState : function () {
            if (this.curEngine) {
                return this.curEngine.getState.apply(this.curEngine,
                    arguments);
            }
            return null;
        },

        /**
         * 添加事件
         *
         * @param {String} eventName 事件名称，目前支持的事件有:
         *      1. 'playStateChange'   播放状态改变时
         *      funtion(event){
     *          event.newState      //当前播放状态
     *          event.oldState      //上一个播放状态
     *          event.engineType    //当前播放内核类型
     *          event.target        //当前子播放内核的实例
     *      }
         *
         *      2. 'positionChange'    播放位置改变时
         *      function(event) {
     *          event.position      //当前播放进度 单位：毫秒
     *          event.target        //当前子播放内核的实例
     *      }
         *
         *      3. 'progress'          数据加载时
         *      function(event) {
     *          event.progress      //当前加载进度百分比 范围：0-1
     *          event.totalTime     //当前音频总时长 单位：毫秒
     *          event.target        //当前子播放内核的实例
     *      }
         *
         *      4. 'error'             播放错误时 // todo
         *
         *      5. 'initSuccess'       内核加载成功时
         *      function(event) {
     *          event.engineType    //当前播放内核类型
     *          event.engine        //当前播放内核的DOM
     *          event.target        //当前子播放内核的实例
     *      }
         *
         *      6. 'initFail'          内核加载失败时(浏览器不支持等)
         *      function(event) {
     *          event.engineType    //加载失败的子内核类型
     *          event.config        //init初始化时传入subEngines配置项
     *      }
         * @param {Function} handler
         * @member PlayEngine
         * @return
         * @method
         */
        setEventListener : function (eventName, listener) {
            var _listener;
            if (eventName == this.EVENTS.INITFAIL ||
                eventName == this.EVENTS.INIT) {
                _listener = T.fn.bind(function (e) {
                    listener.apply(this, arguments);
                }, this);
            } else {
                _listener = T.fn.bind(function (e) {
                    if (e.target && e.target.getEngineType() == this.curEngineType) {
                        listener.apply(this, arguments);
                    }
                }, this);
            }

            T.array.each(this.unInitEngineList, function (item, index) {
                item.setEventListener(eventName, _listener);
            });
        },

        /**
         * 初始化加载进度改变的事件
         * @member PlayEngine
         * @return
         * @method _initProgressEvent
         * @private
         */
        _initProgressEvent : function () {
            this.progressTimer.addEventListener('timer',
                T.fn.bind(function (delay, repeatCount) {
                    var percent = this.getLoadedPercent();
                    this.curEngine.dispatchEvent(this.EVENTS.PROGRESS, {
                        progress : percent,
                        totalBytes : this.getTotalBytes(),
                        loadedBytes : this.getLoadedBytes(),
                        totalTime : this.getTotalTime()
                    });
                    if (percent == 1 && this.curEngineType != 'wmp') {
                        this.progressTimer.stop();
                    }
                }, this)
            );

            this.setEventListener(this.EVENTS.STATECHANGE,
                T.fn.bind(function (e) {
                    var st = e.newState;
                    switch (st) {
                        //st == 'pre-buffer'
                        case this.STATES.PREBUFFER :
                        //st == 'play'
                        case this.STATES.PLAY :
                            if (this.getLoadedPercent() < 1) {
                                this.progressTimer.start();
                            }
                            break;
                        //stop
                        case this.STATES.STOP :
                        //ready
                        case this.STATES.READY :
                        //end
                        case this.STATES.END :
                            this.progressTimer.reset();
                            break;
                    }
                }, this)
            );

            this.setEventListener('setUrl', T.fn.bind(function (e) {
                this.progressTimer.reset();
                this.progressTimer.start();
            }, this));
        },

        /**
         * 初始化播放进度改变的事件
         * @member PlayEngine
         * @return
         * @method _initPositionChangeEvent
         * @private
         */
        _initPositionChangeEvent : function () {
            this.positionTimer.addEventListener('timer',
                T.fn.bind(function (delay, repeatCount) {
                    var curPos = this.getCurrentPosition();
                    this.curEngine.dispatchEvent(this.EVENTS.POSITIONCHANGE, {
                        position : curPos
                    });
                }, this)
            );

            this.setEventListener(this.EVENTS.STATECHANGE,
                T.fn.bind(function (e) {
                    var st = e.newState;
                    switch (st) {
                        //st == 'play'
                        case this.STATES.PLAY :
                            this.positionTimer.start();
                            break;
                        //st == 'stop'
                        case this.STATES.STOP :
                        //st == 'pause'
                        case this.STATES.PAUSE :
                            this.positionTimer.pause();
                            // 刷新一下position
                            this.curEngine.dispatchEvent(this.EVENTS.POSITIONCHANGE, {
                                position : this.getCurrentPosition()
                            });
                            break;
                        //ready
                        case this.STATES.READY :
                        //end
                        case this.STATES.END :
                            this.positionTimer.reset();
                            break;
                    }
                }, this)
            );
            this.setEventListener('setUrl', T.fn.bind(function (e) {
                this.positionTimer.reset();
            }, this));
        }
    });
/**
 * @fileoverview 播放器超类
 * @authod qiaogang@baidu.com
 * @class PlayEngine_Interface
 * @requires tangram-1.5.0.js
 * @requires common.js
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */

/**
 * @class PlayEngine_Interface播放核心的接口类, fmp
 *
 */
var PlayEngine_Interface = mbox.lang.createClass((function (window, undefined) {
    var guid = 0;

    var defConf = {
        mute : false,
        volume : 50
    };

    var fn = function (conf) {
        /**
         * 标准状态
         *
         */
        this.STATES = {
            INIT : 'init', //-2 还未初始化(dom未加载)
            READY : 'ready', //-1 初始化成功(dom已加载,且可以播放)
            STOP : 'stop', //0
            PLAY : 'play', //1
            PAUSE : 'pause', //2
            END : 'end', //3
            BUFFERING : 'buffering', //4
            PREBUFFER : 'pre-buffer', //5
            ERROR : 'error'        //6
        };

        /**
         * 标准事件
         *
         */
        this.EVENTS = {
            STATECHANGE : 'player_playStateChange',
            POSITIONCHANGE : 'player_positionChange',
            PROGRESS : 'player_progress',
            ERROR : 'player_error',
            INIT : 'player_initSuccess', //dom加载成功，已进入ready状态
            INITFAIL : 'player_initFail'        //dom加载失败，版本不支持或加载异常
        };

        conf = conf || {};
        this.mute = typeof conf.mute == 'undefined' ? defConf.mute : !!conf.mute;
        this.volume = typeof conf.volume == 'undefined' ? defConf.volume : conf.volume;
        this.ready = false;
        this.url = '';
        this.state = this.STATES.INIT;
        this.engineType = '';
        this.stateStack = [this.STATES.INIT];
        this.supportMimeType = [];
    };

    fn.prototype = {
        /**
         * 创建新的guid
         *
         * @return {String}
         */
        newId : function () {
            return "_m3_" + guid++;
        },

        /**
         * 初始化播放器
         * 进行加载dom
         */
        init : function () {

        },

        /**
         * 重置播放器
         * 除音量和静音状态外的其他状态，都要进行重置
         */
        reset : function () {

        },

        /**
         * 开始加载资源
         *
         * @param {String}
         */
        setUrl : function (url) {

        },

        /**
         * 获取当前的资源地址
         *
         * @return {String}
         */
        getUrl : function () {
            return this.url;
        },

        /**
         * 开始播放/继续播放
         *
         */
        play : function () {

        },

        /**
         * 暂停播放
         * 播放位置不清零，资源继续下载
         */
        pause : function () {

        },

        /**
         * 停止当前播放的资源
         * 播放位置清零 ，中断下载
         */
        stop : function () {

        },

        /**
         * 设置静音状态
         *
         * @param {Boolean}
         */
        setMute : function (mute) {

        },

        /**
         * 获取静音状态
         *
         * @return {Boolean}
         */
        getMute : function () {
            return this.mute;
        },

        /**
         * 设置音量
         *
         * @param {Number} 取值范围 0-100
         */
        setVolume : function (vol) {

        },

        /**
         * 获取音量
         *
         * @return {Number} 取值范围 0-100
         */
        getVolume : function () {
            return this.volume;
        },

        /**
         * 获取当前播放状态
         *
         * @return {String} 播放状态
         */
        getState : function () {
            return '';
        },

        /**
         * 设置当前播放进度
         *
         * @param {Number} pos 当前播放进度。单位:毫秒
         */
        setCurrentPosition : function (pos) {

        },

        getCurrentPosition : function () {
            return 0;
        },

        /**
         * 获取当前加载进度百分比
         *
         * @return {Number} 取值范围 0-1
         */
        getLoadedPercent : function () {
            return 0;
        },

        /**
         * 获取已加载的字节数
         *
         * @return {Number} 已加载的字节数。单位: bytes
         */
        getLoadedBytes : function () {
            return 0;
        },

        /**
         * 获取资源总字节数
         *
         * @return {Number} 总字节数。单位: bytes
         */
        getTotalBytes : function () {
            return 0;
        },

        /**
         * 获取歌曲总时长
         *
         * @return {Number} 单位: 毫秒
         */
        getTotalTime : function () {
            return 0;
        },

        /**
         * 获取当前播放内核版本号
         *
         * @return {String}
         */
        getVersion : function () {
            return '';
        },

        /**
         * 获取当前内核的类型
         *
         * @return {String} 当前内核类型
         */
        getEngineType : function () {
            return this.engineType;
        },

        /**
         * 判断制定的mimeType是否可以播放
         *
         * @param {String} mimeType
         * @return {Boolean}
         */
        canPlayType : function (mimeType) {
            var list = this.getSupportMimeTypeList();
            return T.array.some(list, function (item, index) {
                return mimeType == item;
            });
        },

        /**
         * 获取当前内核支持的格式
         *
         * @return {Array(String)} 支持的格式
         */
        getSupportMimeTypeList : function () {
            return this.supportMimeType;
        },

        /**
         * 添加事件
         *
         * @param {String} eventName 事件名称，目前支持的事件有:
         *      'playStateChange'   播放状态改变时
         *      'positionChange'    播放位置改变时
         *      'progress'          数据加载时
         *      'complete'          数据加载完成
         *      'error'             播放错误时
         *      'initSuccess'       内核加载成功时
         *      'initFail'          内核加载失败时(浏览器不支持等)
         * @param {Function} listener 返回自定义的Event，其中target为触发的子内核实力
         */
        setEventListener : function (eventName, listener) {
            var _listener = T.fn.bind(function () {
                return listener.apply(this, arguments);
            }, this);

            this.addEventListener(eventName, _listener);
        }
    };

    return fn;
})(window), {superClass : T.lang.Class, className : 'PlayEngine_Interface'});
/**
 * @fileoverview 播放内核 HTML5 Audio 内核的封装
 * @authod liangweibin@baidu.com
 * @class PlayEngine_Audio
 * @requires PlayEngine_Interface.js
 *
 * 每位工程师都有保持代码优雅的义务
 * each engineer has a duty to keep the code elegant
 */
var PlayEngine_Audio = mbox.lang.createClass(function (conf) {
    conf = conf || {};

    this.engineType = 'audio';

    /**
     * 文件扩展名对应的 Content-Type，一个扩展名可能会对应多个 Content-Type
     */
    this.contentType = {
        'mp3' : ['audio/mpeg', 'audio/mp3'],
        'mp4' : ['audio/mp4' , 'audio/MP4A-LATM', 'video/mpeg4', 'audio/mpeg4-generic'],
        'm4a' : ['audio/mp4' , 'audio/MP4A-LATM', 'video/mpeg4', 'audio/mpeg4-generic'],
        'aac' : ['audio/aac' , 'audio/aacp'],
        '3gp' : ['audio/3gpp', 'audio/3gpp2'],
        'ogg' : ['audio/ogg' , 'video/ogg', 'application/ogg', 'audio/vorbis'],
        'oga' : ['audio/ogg' , 'application/ogg', 'audio/vorbis'],
        'wma' : ['audio/x-ms-wma']
    };

    this.supportAudio = typeof Audio != "undefined";

    /**
     * 子内核支持的格式(文件扩展名)
     */
    this.supportMimeType = [];

    /**
     * 如果支持 Audio，那么检测并填充 this.supportMimeType
     */
    if (this.supportAudio) {
        this.audio = new Audio();
        if (typeof this.audio.canPlayType == "function") {
            T.object.each(this.contentType, T.fn.bind(function (types, ext) {
                for (var i = 0; i < types.length; i++) {
                    // 只要支持任意一种 content-type，就可以认为浏览器支持该扩展名
                    var canPlayType = this.audio.canPlayType(types[i]);
                    if (canPlayType == 'probably' || canPlayType == 'maybe') {
                        this.supportMimeType.push(ext);
                        break;
                    }
                }
            }, this));
        }
        // 如果没有能支持的扩展名，那么可以认为浏览器不支持 Audio
        if (!this.supportMimeType.length) {
            this.supportAudio = false;
        }
    }

    /**
     * 判断是否支持调节音量（预留）
     * 原理：对于 iOS，audio.volume 总是返回 1
     * 只针对 iOS，其他系统的音量特性未测试
     */
    this.supportVolume = T.fn.bind(function () {
        if (this.supportAudio) {
            this.audio.volume = 0.5;
            return (this.audio.volume < 1);
        }
        return false;
    }, this)();

}, {
    superClass : PlayEngine_Interface,
    className : 'PlayEngine_Audio'
}).extend({
        /**
         * 判断当前环境中是否可用，子内核加载时，依据这里的结果
         *
         * @param {Boolean} dispatch 是否派发INITFAIL事件，默认不派发
         * @return {Boolean}
         */
        test : function (dispatch) {
            dispatch = !!dispatch;
            if (!this.supportAudio && dispatch) {
                this.dispatchEvent(this.EVENTS.INITFAIL, {
                    engineType : this.engineType
                });
            }
            return this.supportAudio;
        },

        /**
         * 播放核的初始化
         *
         * @param {Object} options
         * @config {HTMLElement|String} [el] 播放内核容器或容器id
         * @config {String} instanceName 创建的实例名字 用于flash回调
         * @config {String} swfPath flash文件路径
         */
        init : function (options) {
            this.lastState = this.STATES.INIT;
            this.muted = this.audio.muted = false;
            this.volume = 50;
            this.audio.volume = 0.5;
            this.url = "";
            this._definedEvents();

            this.state = this.STATES.READY;
            this.dispatchEvent(this.EVENTS.INIT, {
                engineType : this.engineType,
                engine : this.audio
            });
        },

        /**
         * 播放核状态恢复
         * @method reset
         */
        reset : function () {
            if (!this.supportAudio) return;
            this.url = "";
            this.audio.pause();
            this.state = "ready";
            this.lastState = "ready";
        },

        /**
         * 设置播放核的音频地址,开始加载url
         * @method setUrl
         * @param {String} url 音频地址
         */
        setUrl : function (url) {
            if (!this.supportAudio) return;
            this.url = url;
            this.audio.src = url;
            this.audio.load();
            this._firePlayStateChange(this.STATES.PREBUFFER);
        },

        /**
         * 操作音频播放
         * @method play
         */
        play : function () {
            if (!this.supportAudio) return;
            if (this.state != "ready") {
                if (T.platform.isAndroid && T.browser.isWebkit && this.audio.readyState < 3) {
                    var canPlay = T.fn.bind(function () {
                        this.audio.play();
                        this.audio.removeEventListener("canplay", canPlay, false);
                    }, this);
                    this.audio.addEventListener("canplay", canPlay, false);
                } else {
                    this.audio.play();
                }
            }
        },

        /**
         * 操作音频暂停
         * @method pause
         */
        pause : function () {
            if (!this.supportAudio) return;
            if (this.state != this.STATES.STOP
                && this.state != this.STATES.READY && this.state != this.STATES.END) {
                this.audio.pause();
                this._firePlayStateChange(this.STATES.PAUSE);
            }
        },

        /**
         * 操作音频停止
         * @method stop
         */
        stop : function () {
            if (!this.supportAudio) return;
            if (this.state != this.STATES.READY) {
                if (this.audio.currentTime != 0) {
                    this.audio.currentTime = 0;
                }
                this.audio.pause();
                this._firePlayStateChange(this.STATES.STOP);
            }
        },

        /**
         * 设置播放核静音状态
         * @method setMute
         * @param {Boolean} mute 播放核是否静音
         */
        setMute : function (mute) {
            if (!this.supportAudio) return;
            this.audio.muted = this.mute = mute;
        },

        /**
         * 设置播放核音量大小
         * @method setVolume
         * @param {Number} volume 音量大小，取值范围 0-100，0 最小声
         */
        setVolume : function (volume) {
            if (!this.supportAudio) return;
            volume = T.lang.isNumber(volume) ? volume : 50;
            volume = Math.max(Math.min(volume, 100), 0);
            this.volume = volume;  //set a NaN can crash chrome broswer!
            this.audio.volume = volume / 100;
        },

        /**
         * 设置播放核当前播放进度
         * @method setCurrentPosition
         * @param {Number} time 目标播放时间，单位：毫秒
         */
        setCurrentPosition : function (time) {
            if (!this.supportAudio) return;
            if (T.platform.isAndroid && this.audio.readyState < 3) {
                var canPlay = T.fn.bind(function () {
                    this.audio.currentTime = time / 1000;
                    this.audio.play();
                    this.audio.removeEventListener("canplay", canPlay, false);
                }, this);
                this.audio.addEventListener("canplay", canPlay, false);
            } else {
                this.audio.currentTime = time / 1000;
                this.audio.play();
            }
        },

        /**
         * 取得播放核当前播放进度
         * @method getCurrentPosition
         * @return {Number} 当前播放时间，单位：毫秒
         */
        getCurrentPosition : function () {
            if (!this.supportAudio) return 0;
            return Math.round(this.audio.currentTime * 1000);
        },

        /**
         * 取得播放核当前下载百分比
         * @method getLoadedPercent
         * @return {Number} 下载百分比，取值范围 0-1
         */
        getLoadedPercent : function () {
            try {
                var end = this.audio.buffered.end(0),
                    dur = this.audio.duration;
                dur = isNaN(dur) ? 0 : dur;
                return Math.round(end / dur * 100) / 100;
            } catch (e) {
                return 0;
            }
        },

        /**
         * 取得播放核当前 URL 总播放时间
         * @method getTotalTime
         * @return {Number} 总时长，单位：毫秒
         */
        getTotalTime : function () {
            if (!this.supportAudio) return 0;
            var dur = this.audio.duration;
            dur = isNaN(dur) ? 0 : dur;
            return Math.round(dur * 1000);
        },

        /**
         * 取得当前播放器原生状态
         * @method getState
         * @return {String} 当前播放状态
         */
        getState : function () {
            return this.state;
        },

        /**
         * 这个函数有特殊用途，不允许污染函数体的代码
         * @private
         */
        _firePlayStateChange : function (stateName) {
            if (this.state != stateName) {
                this.lastState = this.state;
                this.state = stateName;
                this.dispatchEvent(this.EVENTS.STATECHANGE, {
                    newState : stateName,
                    oldState : this.lastState,
                    engineType : this.engineType
                });
            }
        },

        /**
         * 定义事件，即把 HTML5 Audio 的事件转换成 PlayEngine 事件
         * @private
         */
        _definedEvents : function () {
            this.audio.addEventListener("error", T.fn.bind(function () {
                this._firePlayStateChange(this.STATES.ERROR);
                this.dispatchEvent(this.EVENTS.ERROR, {
                    engineType : this.engineType
                });
            }, this), false);

            this.audio.addEventListener("ended", T.fn.bind(function () {
                this._firePlayStateChange(this.STATES.END);
            }, this), false);

            this.audio.addEventListener("playing", T.fn.bind(function () {
                this._firePlayStateChange(this.STATES.PLAY);
            }, this), false);

            this.audio.addEventListener("pause", T.fn.bind(function () {
                if (this.getState() == this.STATES.PLAY) {
                    this._firePlayStateChange(this.getCurrentPosition() ? this.STATES.PAUSE : this.STATES.STOP);
                }
            }, this), false);

            this.audio.addEventListener("waiting", T.fn.bind(function () {
                this._firePlayStateChange(this.getCurrentPosition() ? this.STATES.BUFFERING : this.STATES.PREBUFFER);
            }, this), false);

            /*this.audio.addEventListener("seeking", T.fn.bind(function () {
             if (!this.audio.paused) {
             this._firePlayStateChange(this.STATES.BUFFERING);
             }
             }, this), false);

             this.audio.addEventListener("seeked", T.fn.bind(function () {
             if (!this.audio.paused) {
             this._firePlayStateChange(this.STATES.PLAY);
             }
             }, this), false);*/

            /*this.audio.addEventListener("progress", T.fn.bind(function (event) {
             //in chrome broswer, call "progress" event pre 350ms one time.
             var playingTime = this.getCurrentPosition(), end = 0;
             try {
             end = Math.round(this.audio.buffered.end(0) * 1000);
             } catch (e) {
             }
             var res = end - playingTime;
             //play buffer is about 1000ms in chrome
             if (end && res > 350) {
             if (this.state == "buffering") {
             this._firePlayStateChange(this.STATES.PLAY);
             }
             } else {
             if (this.state == "play") {
             this._firePlayStateChange(this.STATES.BUFFERING);
             }
             }
             }, this), false);*/
        }
    });
