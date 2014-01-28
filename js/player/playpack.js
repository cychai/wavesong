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

/*!
 Lo-Dash 1.0.0-rc.3 (Custom Build) lodash.com/license
 Build: `lodash mobile underscore`
 Underscore.js 1.4.3 underscorejs.org/LICENSE
*/
;(function(e,t){function n(e){if(e&&"object"==typeof e&&e.__wrapped__)return e;if(!(this instanceof n))return new n(e);this.__wrapped__=e}function r(e,t){var n=e.b,r=t.b,e=e.a,t=t.a;if(e!==t){if(e>t||"undefined"==typeof e)return 1;if(e<t||"undefined"==typeof t)return-1}return n<r?-1:1}function i(e,t,n){function r(){var i=arguments,s=t;return n.length&&(i=i.length?n.concat(f(i)):n),this instanceof r?(a.prototype=e.prototype,s=new a,a.prototype=null,i=e.apply(s,i),y(i)?i:s):e.apply(s,i)}return r}function s
(e,t,n){return e?"function"!=typeof e?function(t){return t[e]}:"undefined"!=typeof t?n?function(n,r,i,s){return e.call(t,n,r,i,s)}:function(n,r,i){return e.call(t,n,r,i)}:e:q}function o(e){return"\\"+Tt[e]}function u(e){return Lt[e]}function a(){}function f(e,t,n){t||(t=0),"undefined"==typeof n&&(n=e?e.length:0);for(var r=-1,n=n-t||0,i=Array(0>n?0:n);++r<n;)i[r]=e[t+r];return i}function l(e){return At[e]}function c(e){if(!e)return e;for(var t=1,n=arguments.length;t<n;t++){var r=arguments[t];if(r)
for(var i in r)e[i]=r[i]}return e}function h(e){var t=[];return kt(e,function(e,n){t.push(n)}),t}function p(e){if(!e)return e;for(var t=1,n=arguments.length;t<n;t++){var r=arguments[t];if(r)for(var i in r)null==e[i]&&(e[i]=r[i])}return e}function d(e){var t=[];return Ct(e,function(e,n){g(e)&&t.push(n)}),t.sort()}function v(e){var t={};return kt(e,function(e,n){t[e]=n}),t}function m(e,t,n,r){if(e===t)return 0!==e||1/e==1/t;if(null==e||null==t)return e===t;var i=it.call(e),s=it.call(t);if(i!=s)return!1
;switch(i){case dt:case vt:return+e==+t;case mt:return e!=+e?t!=+t:0==e?1/e==1/t:e==+t;case yt:case bt:return e==t+""}s=i==pt;if(!s){if(e.__wrapped__||t.__wrapped__)return m(e.__wrapped__||e,t.__wrapped__||t);if(i!=gt)return!1;var i=e.constructor,o=t.constructor;if(i!=o&&(!g(i)||!(i instanceof i&&g(o)&&o instanceof o)))return!1}n||(n=[]),r||(r=[]);for(i=n.length;i--;)if(n[i]==e)return r[i]==t;var u=!0,a=0;n.push(e),r.push(t);if(s){a=e.length;if(u=a==t.length)for(;a--&&(u=m(e[a],t[a],n,r)););return u
}return Ct(e,function(e,i,s){if(nt.call(s,i))return a++,!(u=nt.call(t,i)&&m(e,t[i],n,r))&&V}),u&&Ct(t,function(e,t,n){if(nt.call(n,t))return!(u=-1<--a)&&V}),u}function g(e){return"function"==typeof e}function y(e){return e?xt[typeof e]:!1}function b(e){return"number"==typeof e||it.call(e)==mt}function w(e){return"string"==typeof e||it.call(e)==bt}function E(e){var t=[];return kt(e,function(e){t.push(e)}),t}function S(e,t){var n=!1;return"number"==typeof (e?e.length:0)?n=-1<H(e,t):Nt(e,function(e)
{return(n=e===t)&&V}),n}function x(e,t,n){var r=!0,t=s(t,n);if(Ot(e))for(var n=-1,i=e.length;++n<i&&(r=!!t(e[n],n,e)););else Nt(e,function(e,n,i){return!(r=!!t(e,n,i))&&V});return r}function T(e,t,n){var r=[],t=s(t,n);if(Ot(e))for(var n=-1,i=e.length;++n<i;){var o=e[n];t(o,n,e)&&r.push(o)}else Nt(e,function(e,n,i){t(e,n,i)&&r.push(e)});return r}function N(e,t,n){var r,t=s(t,n);return C(e,function(e,n,i){if(t(e,n,i))return r=e,V}),r}function C(e,t,n){if(Ot(e)){var r=-1,i=e.length;if(!t||"undefined"!=typeof 
n)t=s(t,n);for(;++r<i&&t(e[r],r,e)!==V;);}else Nt(e,t,n)}function k(e,t,n){var r=-1,i=e?e.length:0,o=Array("number"==typeof i?i:0),t=s(t,n);if(Ot(e))for(;++r<i;)o[r]=t(e[r],r,e);else Nt(e,function(e,n,i){o[++r]=t(e,n,i)});return o}function L(e,t,n){var r=-Infinity,i=-1,o=e?e.length:0,u=r;if(t||!Ot(e))t=s(t,n),Nt(e,function(e,n,i){n=t(e,n,i),n>r&&(r=n,u=e)});else for(;++i<o;)e[i]>u&&(u=e[i]);return u}function A(e,t){return k(e,t+"")}function O(e,t,n,r){var i=3>arguments.length,t=s(t,r,V);if(Ot(e))
{var o=-1,u=e.length;for(i&&(n=e[++o]);++o<u;)n=t(n,e[o],o,e)}else Nt(e,function(e,r,s){n=i?(i=!1,e):t(n,e,r,s)});return n}function M(e,t,n,r){var i=e?e.length:0,o=3>arguments.length;if("number"!=typeof i)var u=Mt(e),i=u.length;return t=s(t,r,V),C(e,function(r,s,a){s=u?u[--i]:--i,n=o?(o=!1,e[s]):t(n,e[s],s,a)}),n}function _(e,t,n){var r,t=s(t,n);if(Ot(e))for(var n=-1,i=e.length;++n<i&&!(r=t(e[n],n,e)););else Nt(e,function(e,n,i){return(r=t(e,n,i))&&V});return!!r}function D(e,t,n){if(e){var r=e.length
;return null==t||n?e[0]:f(e,0,ct(lt(0,t),r))}}function P(e,t){for(var n=-1,r=e?e.length:0,i=[];++n<r;){var s=e[n];Ot(s)?rt.apply(i,t?s:P(s)):i.push(s)}return i}function H(e,t,n){var r=-1,i=e?e.length:0;if("number"==typeof n)r=(0>n?lt(0,i+n):n||0)-1;else if(n)return r=j(e,t),e[r]===t?r:-1;for(;++r<i;)if(e[r]===t)return r;return-1}function B(e,t,n){return f(e,null==t||n?1:lt(0,t))}function j(e,t,n,r){for(var i=0,o=e?e.length:i,n=n?s(n,r):q,t=n(t);i<o;)r=i+o>>>1,n(e[r])<t?i=r+1:o=r;return i}function F
(e,t,n,r){var i=-1,o=e?e.length:0,u=[],a=u;"function"==typeof t&&(r=n,n=t,t=!1),n&&(a=[],n=s(n,r));for(;++i<o;){var r=e[i],f=n?n(r,i,e):r;if(t?!i||a[a.length-1]!==f:0>H(a,f))n&&a.push(f),u.push(r)}return u}function I(e,t){return wt||st&&2<arguments.length?st.call.apply(st,arguments):i(e,t,f(arguments,2))}function q(e){return e}function R(e){C(d(e),function(t){var r=n[t]=e[t];n.prototype[t]=function(){var e=[this.__wrapped__];return rt.apply(e,arguments),e=r.apply(n,e),this.__chain__&&(e=new n(e),
e.__chain__=!0),e}})}var U="object"==typeof exports&&exports,z="object"==typeof global&&global;z.global===z&&(e=z);var W=[],z=new function(){},X=0,V=z,$=e._,J=/&(?:amp|lt|gt|quot|#x27);/g,K=RegExp("^"+(z.valueOf+"").replace(/[.*+?^=!:${}()|[\]\/\\]/g,"\\$&").replace(/valueOf|for [^\]]+/g,".+?")+"$"),Q=/($^)/,G=/[&<>"']/g,Y=/['\n\r\t\u2028\u2029\\]/g,Z=Math.ceil,et=W.concat,tt=Math.floor,nt=z.hasOwnProperty,rt=W.push,it=z.toString,st=K.test(st=f.bind)&&st,ot=K.test(ot=Array.isArray)&&ot,ut=e.isFinite
,at=e.isNaN,ft=K.test(ft=Object.keys)&&ft,lt=Math.max,ct=Math.min,ht=Math.random,pt="[object Array]",dt="[object Boolean]",vt="[object Date]",mt="[object Number]",gt="[object Object]",yt="[object RegExp]",bt="[object String]",z=!!e.attachEvent,z=st&&!/\n|true/.test(st+z),wt=st&&!z,Et=(Et={0:1,length:1},W.splice.call(Et,0,1),Et[0]),St=arguments.constructor==Object,xt={"boolean":!1,"function":!0,object:!0,number:!1,string:!1,"undefined":!1},Tt={"\\":"\\","'":"'","\n":"n","\r":"r","	":"t","\u2028":"u2028"
,"\u2029":"u2029"};n.templateSettings={escape:/<%-([\s\S]+?)%>/g,evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,variable:""};var Nt=function(e,t,n){if(!e)return e;var t=t&&"undefined"==typeof n?t:s(t,n),r=e.length,n=-1;if("number"==typeof r){for(;++n<r;)if(t(e[n],n,e)===V)return e}else for(n in e)if(nt.call(e,n)&&t(e[n],n,e)===V)return e};n.isArguments=function(e){return"[object Arguments]"==it.call(e)},n.isArguments(arguments)||(n.isArguments=function(e){return e?nt.call(e,"callee"):!1
});var Ct=function(e,t){var n;if(!e)return e;t||(t=q);for(n in e)if(t(e[n],n,e)===V)break;return e},kt=function(e,t){var n;if(!e)return e;t||(t=q);for(n in e)if(nt.call(e,n)&&t(e[n],n,e)===V)break;return e},Lt={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;"},At=v(Lt),Ot=ot||function(e){return St&&e instanceof Array||it.call(e)==pt};g(/x/)&&(g=function(e){return e instanceof Function||"[object Function]"==it.call(e)});var Mt=ft?function(e){return y(e)?ft(e):[]}:h;n.after=function(e,t)
{return 1>e?t():function(){if(1>--e)return t.apply(this,arguments)}},n.bind=I,n.bindAll=function(e){for(var t=arguments,n=1<t.length?0:(t=d(e),-1),r=t.length;++n<r;){var i=t[n];e[i]=I(e[i],e)}return e},n.compact=function(e){for(var t=-1,n=e?e.length:0,r=[];++t<n;){var i=e[t];i&&r.push(i)}return r},n.compose=function(){var e=arguments;return function(){for(var t=arguments,n=e.length;n--;)t=[e[n].apply(this,t)];return t[0]}},n.countBy=function(e,t,n){var r={},t=s(t,n);return C(e,function(e,n,i){n=t
(e,n,i),nt.call(r,n)?r[n]++:r[n]=1}),r},n.debounce=function(e,t,n){function r(){u=null,n||(s=e.apply(o,i))}var i,s,o,u;return function(){var a=n&&!u;return i=arguments,o=this,clearTimeout(u),u=setTimeout(r,t),a&&(s=e.apply(o,i)),s}},n.defaults=p,n.defer=function(e){var n=f(arguments,1);return setTimeout(function(){e.apply(t,n)},1)},n.delay=function(e,n){var r=f(arguments,2);return setTimeout(function(){e.apply(t,r)},n)},n.difference=function(e){for(var t=-1,n=e.length,r=et.apply(W,arguments),i=[]
;++t<n;){var s=e[t];0>H(r,s,n)&&i.push(s)}return i},n.filter=T,n.flatten=P,n.forEach=C,n.functions=d,n.groupBy=function(e,t,n){var r={},t=s(t,n);return C(e,function(e,n,i){n=t(e,n,i),(nt.call(r,n)?r[n]:r[n]=[]).push(e)}),r},n.initial=function(e,t,n){if(!e)return[];var r=e.length;return f(e,0,ct(lt(0,r-(null==t||n?1:t||0)),r))},n.intersection=function(e){var t=arguments,n=t.length,r=-1,i=e?e.length:0,s=[];e:for(;++r<i;){var o=e[r];if(0>H(s,o)){for(var u=n;--u;)if(0>H(t[u],o))continue e;s.push(o)}}
return s},n.invert=v,n.invoke=function(e,t){var n=f(arguments,2),r="function"==typeof t,i=[];return C(e,function(e){i.push((r?t:e[t]).apply(e,n))}),i},n.keys=Mt,n.map=k,n.max=L,n.memoize=function(e,t){var n={};return function(){var r=t?t.apply(this,arguments):arguments[0];return nt.call(n,r)?n[r]:n[r]=e.apply(this,arguments)}},n.min=function(e,t,n){var r=Infinity,i=-1,o=e?e.length:0,u=r;if(t||!Ot(e))t=s(t,n),Nt(e,function(e,n,i){n=t(e,n,i),n<r&&(r=n,u=e)});else for(;++i<o;)e[i]<u&&(u=e[i]);return u
},n.object=function(e,t){for(var n=-1,r=e?e.length:0,i={};++n<r;){var s=e[n];t?i[s]=t[n]:i[s[0]]=s[1]}return i},n.omit=function(e){var t=et.apply(W,arguments),n={};return Ct(e,function(e,r){0>H(t,r,1)&&(n[r]=e)}),n},n.once=function(e){var t,n=!1;return function(){return n?t:(n=!0,t=e.apply(this,arguments),e=null,t)}},n.pairs=function(e){var t=[];return kt(e,function(e,n){t.push([n,e])}),t},n.pick=function(e){for(var t=0,n=et.apply(W,arguments),r=n.length,i={};++t<r;){var s=n[t];s in e&&(i[s]=e[s]
)}return i},n.pluck=A,n.range=function(e,t,n){e=+e||0,n=+n||1,null==t&&(t=e,e=0);for(var r=-1,t=lt(0,Z((t-e)/n)),i=Array(t);++r<t;)i[r]=e,e+=n;return i},n.reject=function(e,t,n){return t=s(t,n),T(e,function(e,n,r){return!t(e,n,r)})},n.rest=B,n.shuffle=function(e){var t=-1,n=Array(e?e.length:0);return C(e,function(e){var r=tt(ht()*(++t+1));n[t]=n[r],n[r]=e}),n},n.sortBy=function(e,t,n){var i=[],t=s(t,n);C(e,function(e,n,r){i.push({a:t(e,n,r),b:n,c:e})}),e=i.length;for(i.sort(r);e--;)i[e]=i[e].c;return i
},n.tap=function(e,t){return t(e),e},n.throttle=function(e,t){function n(){u=new Date,o=null,i=e.apply(s,r)}var r,i,s,o,u=0;return function(){var a=new Date,f=t-(a-u);return r=arguments,s=this,0>=f?(clearTimeout(o),o=null,u=a,i=e.apply(s,r)):o||(o=setTimeout(n,f)),i}},n.times=function(e,t,n){for(var e=+e||0,r=-1,i=Array(e);++r<e;)i[r]=t.call(n,r);return i},n.toArray=function(e){return"number"==typeof (e?e.length:0)?f(e):E(e)},n.union=function(){return F(et.apply(W,arguments))},n.uniq=F,n.values=E
,n.where=function(e,t){var n=Mt(t);return T(e,function(e){for(var r=n.length;r--;){var i=e[n[r]]===t[n[r]];if(!i)break}return!!i})},n.without=function(e){for(var t=-1,n=e.length,r=[];++t<n;){var i=e[t];0>H(arguments,i,1)&&r.push(i)}return r},n.wrap=function(e,t){return function(){var n=[e];return rt.apply(n,arguments),t.apply(this,n)}},n.zip=function(e){for(var t=-1,n=e?L(A(arguments,"length")):0,r=Array(n);++t<n;)r[t]=A(arguments,t);return r},n.collect=k,n.drop=B,n.each=C,n.extend=c,n.methods=d,
n.select=T,n.tail=B,n.unique=F,n.clone=function(e){return e&&xt[typeof e]?Ot(e)?f(e):c({},e):e},n.contains=S,n.escape=function(e){return null==e?"":(e+"").replace(G,u)},n.every=x,n.find=N,n.has=function(e,t){return e?nt.call(e,t):!1},n.identity=q,n.indexOf=H,n.isArray=Ot,n.isBoolean=function(e){return!0===e||!1===e||it.call(e)==dt},n.isDate=function(e){return e instanceof Date||it.call(e)==vt},n.isElement=function(e){return e?1===e.nodeType:!1},n.isEmpty=function(e){if(!e)return!0;if(Ot(e)||w(e))
return!e.length;for(var t in e)if(nt.call(e,t))return!1;return!0},n.isEqual=m,n.isFinite=function(e){return ut(e)&&!at(parseFloat(e))},n.isFunction=g,n.isNaN=function(e){return b(e)&&e!=+e},n.isNull=function(e){return null===e},n.isNumber=b,n.isObject=y,n.isRegExp=function(e){return e instanceof RegExp||it.call(e)==yt},n.isString=w,n.isUndefined=function(e){return"undefined"==typeof e},n.lastIndexOf=function(e,t,n){var r=e?e.length:0;for("number"==typeof n&&(r=(0>n?lt(0,r+n):ct(n,r-1))+1);r--;)if(
e[r]===t)return r;return-1},n.mixin=R,n.noConflict=function(){return e._=$,this},n.random=function(e,t){return null==e&&null==t&&(t=1),e=+e||0,null==t&&(t=e,e=0),e+tt(ht()*((+t||0)-e+1))},n.reduce=O,n.reduceRight=M,n.result=function(e,t){var n=e?e[t]:null;return g(n)?e[t]():n},n.size=function(e){var t=e?e.length:0;return"number"==typeof t?t:Mt(e).length},n.some=_,n.sortedIndex=j,n.template=function(e,t,r){e||(e="");var r=p({},r,n.templateSettings),i=0,s="__p+='",u=r.variable;e.replace(RegExp((r.escape||
Q).source+"|"+(r.interpolate||Q).source+"|"+(r.evaluate||Q).source+"|$","g"),function(t,n,r,u,a){s+=e.slice(i,a).replace(Y,o),s+=n?"'+_['escape']("+n+")+'":u?"';"+u+";__p+='":r?"'+((__t=("+r+"))==null?'':__t)+'":"",i=a+t.length}),s+="';\n",u||(u="obj",s="with("+u+"||{}){"+s+"}"),s="function("+u+"){var __t,__p='',__j=Array.prototype.join;function print(){__p+=__j.call(arguments,'')}"+s+"return __p}";try{var a=Function("_","return "+s)(n)}catch(f){throw f.source=s,f}return t?a(t):(a.source=s,a)},n.
unescape=function(e){return null==e?"":(e+"").replace(J,l)},n.uniqueId=function(e){var t=++X+"";return e?e+t:t},n.all=x,n.any=_,n.detect=N,n.foldl=O,n.foldr=M,n.include=S,n.inject=O,n.first=D,n.last=function(e,t,n){if(e){var r=e.length;return null==t||n?e[r-1]:f(e,lt(0,r-t))}},n.take=D,n.head=D,n.chain=function(e){return e=new n(e),e.__chain__=!0,e},n.VERSION="1.0.0-rc.3",R(n),n.prototype.chain=function(){return this.__chain__=!0,this},n.prototype.value=function(){return this.__wrapped__},Nt("pop push reverse shift sort splice unshift"
.split(" "),function(e){var t=W[e];n.prototype[e]=function(){var e=this.__wrapped__;return t.apply(e,arguments),Et&&e.length===0&&delete e[0],this}}),Nt(["concat","join","slice"],function(e){var t=W[e];n.prototype[e]=function(){var e=t.apply(this.__wrapped__,arguments);return this.__chain__&&(e=new n(e),e.__chain__=!0),e}}),U?"object"==typeof module&&module&&module.exports==U?(module.exports=n)._=n:U._=n:e._=n})(this);


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

(function(root){

  // Let's borrow a couple of things from Underscore that we'll need

  // _.each
  var breaker = {},
      AP = Array.prototype,
      OP = Object.prototype,

      hasOwn = OP.hasOwnProperty,
      toString = OP.toString,
      forEach = AP.forEach,
      indexOf = AP.indexOf,
      slice = AP.slice;

  var _each = function( obj, iterator, context ) {
    var key, i, l;

    if ( !obj ) {
      return;
    }
    if ( forEach && obj.forEach === forEach ) {
      obj.forEach( iterator, context );
    } else if ( obj.length === +obj.length ) {
      for ( i = 0, l = obj.length; i < l; i++ ) {
        if ( i in obj && iterator.call( context, obj[i], i, obj ) === breaker ) {
          return;
        }
      }
    } else {
      for ( key in obj ) {
        if ( hasOwn.call( obj, key ) ) {
          if ( iterator.call( context, obj[key], key, obj) === breaker ) {
            return;
          }
        }
      }
    }
  };

  // _.isFunction
  var _isFunction = function( obj ) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
  };

  // _.extend
  var _extend = function( obj ) {

    _each( slice.call( arguments, 1), function( source ) {
      var prop;

      for ( prop in source ) {
        if ( source[prop] !== void 0 ) {
          obj[ prop ] = source[ prop ];
        }
      }
    });
    return obj;
  };

  // $.inArray
  var _inArray = function( elem, arr, i ) {
    var len;

    if ( arr ) {
      if ( indexOf ) {
        return indexOf.call( arr, elem, i );
      }

      len = arr.length;
      i = i ? i < 0 ? Math.max( 0, len + i ) : i : 0;

      for ( ; i < len; i++ ) {
        // Skip accessing in sparse arrays
        if ( i in arr && arr[ i ] === elem ) {
          return i;
        }
      }
    }

    return -1;
  };

  // And some jQuery specific helpers

  var class2type = {};

  // Populate the class2type map
  _each("Boolean Number String Function Array Date RegExp Object".split(" "), function(name, i) {
    class2type[ "[object " + name + "]" ] = name.toLowerCase();
  });

  var _type = function( obj ) {
    return obj == null ?
      String( obj ) :
      class2type[ toString.call(obj) ] || "object";
  };

  // Now start the jQuery-cum-Underscore implementation. Some very
  // minor changes to the jQuery source to get this working.

  // Internal Deferred namespace
  var _d = {};
  // String to Object options format cache
  var optionsCache = {};

  // Convert String-formatted options into Object-formatted ones and store in cache
  function createOptions( options ) {
    var object = optionsCache[ options ] = {};
    _each( options.split( /\s+/ ), function( flag ) {
      object[ flag ] = true;
    });
    return object;
  }

  _d.Callbacks = function( options ) {

    // Convert options from String-formatted to Object-formatted if needed
    // (we check in cache first)
    options = typeof options === "string" ?
      ( optionsCache[ options ] || createOptions( options ) ) :
      _extend( {}, options );

    var // Last fire value (for non-forgettable lists)
      memory,
      // Flag to know if list was already fired
      fired,
      // Flag to know if list is currently firing
      firing,
      // First callback to fire (used internally by add and fireWith)
      firingStart,
      // End of the loop when firing
      firingLength,
      // Index of currently firing callback (modified by remove if needed)
      firingIndex,
      // Actual callback list
      list = [],
      // Stack of fire calls for repeatable lists
      stack = !options.once && [],
      // Fire callbacks
      fire = function( data ) {
        memory = options.memory && data;
        fired = true;
        firingIndex = firingStart || 0;
        firingStart = 0;
        firingLength = list.length;
        firing = true;
        for ( ; list && firingIndex < firingLength; firingIndex++ ) {
          if ( list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false && options.stopOnFalse ) {
            memory = false; // To prevent further calls using add
            break;
          }
        }
        firing = false;
        if ( list ) {
          if ( stack ) {
            if ( stack.length ) {
              fire( stack.shift() );
            }
          } else if ( memory ) {
            list = [];
          } else {
            self.disable();
          }
        }
      },
      // Actual Callbacks object
      self = {
        // Add a callback or a collection of callbacks to the list
        add: function() {
          if ( list ) {
            // First, we save the current length
            var start = list.length;
            (function add( args ) {
              _each( args, function( arg ) {
                var type = _type( arg );
                if ( type === "function" ) {
                  if ( !options.unique || !self.has( arg ) ) {
                    list.push( arg );
                  }
                } else if ( arg && arg.length && type !== "string" ) {
                  // Inspect recursively
                  add( arg );
                }
              });
            })( arguments );
            // Do we need to add the callbacks to the
            // current firing batch?
            if ( firing ) {
              firingLength = list.length;
            // With memory, if we're not firing then
            // we should call right away
            } else if ( memory ) {
              firingStart = start;
              fire( memory );
            }
          }
          return this;
        },
        // Remove a callback from the list
        remove: function() {
          if ( list ) {
            _each( arguments, function( arg ) {
              var index;
              while( ( index = _inArray( arg, list, index ) ) > -1 ) {
                list.splice( index, 1 );
                // Handle firing indexes
                if ( firing ) {
                  if ( index <= firingLength ) {
                    firingLength--;
                  }
                  if ( index <= firingIndex ) {
                    firingIndex--;
                  }
                }
              }
            });
          }
          return this;
        },
        // Control if a given callback is in the list
        has: function( fn ) {
          return _inArray( fn, list ) > -1;
        },
        // Remove all callbacks from the list
        empty: function() {
          list = [];
          return this;
        },
        // Have the list do nothing anymore
        disable: function() {
          list = stack = memory = undefined;
          return this;
        },
        // Is it disabled?
        disabled: function() {
          return !list;
        },
        // Lock the list in its current state
        lock: function() {
          stack = undefined;
          if ( !memory ) {
            self.disable();
          }
          return this;
        },
        // Is it locked?
        locked: function() {
          return !stack;
        },
        // Call all callbacks with the given context and arguments
        fireWith: function( context, args ) {
          args = args || [];
          args = [ context, args.slice ? args.slice() : args ];
          if ( list && ( !fired || stack ) ) {
            if ( firing ) {
              stack.push( args );
            } else {
              fire( args );
            }
          }
          return this;
        },
        // Call all the callbacks with the given arguments
        fire: function() {
          self.fireWith( this, arguments );
          return this;
        },
        // To know if the callbacks have already been called at least once
        fired: function() {
          return !!fired;
        }
      };

    return self;
  };

  _d.Deferred = function( func ) {

    var tuples = [
        // action, add listener, listener list, final state
        [ "resolve", "done", _d.Callbacks("once memory"), "resolved" ],
        [ "reject", "fail", _d.Callbacks("once memory"), "rejected" ],
        [ "notify", "progress", _d.Callbacks("memory") ]
      ],
      state = "pending",
      promise = {
        state: function() {
          return state;
        },
        always: function() {
          deferred.done( arguments ).fail( arguments );
          return this;
        },
        then: function( /* fnDone, fnFail, fnProgress */ ) {
          var fns = arguments;

          return _d.Deferred(function( newDefer ) {

            _each( tuples, function( tuple, i ) {
              var action = tuple[ 0 ],
                fn = fns[ i ];

              // deferred[ done | fail | progress ] for forwarding actions to newDefer
              deferred[ tuple[1] ]( _isFunction( fn ) ?

                function() {
                  var returned;
                  try { returned = fn.apply( this, arguments ); } catch(e){
                    newDefer.reject(e);
                    return;
                  }

                  if ( returned && _isFunction( returned.promise ) ) {
                    returned.promise()
                      .done( newDefer.resolve )
                      .fail( newDefer.reject )
                      .progress( newDefer.notify );
                  } else {
                    newDefer[ action !== "notify" ? 'resolveWith' : action + 'With']( this === deferred ? newDefer : this, [ returned ] );
                  }
                } :

                newDefer[ action ]
              );
            });

            fns = null;

          }).promise();

        },
        // Get a promise for this deferred
        // If obj is provided, the promise aspect is added to the object
        promise: function( obj ) {
          return obj != null ? _extend( obj, promise ) : promise;
        }
      },
      deferred = {};

    // Keep pipe for back-compat
    promise.pipe = promise.then;

    // Add list-specific methods
    _each( tuples, function( tuple, i ) {
      var list = tuple[ 2 ],
        stateString = tuple[ 3 ];

      // promise[ done | fail | progress ] = list.add
      promise[ tuple[1] ] = list.add;

      // Handle state
      if ( stateString ) {
        list.add(function() {
          // state = [ resolved | rejected ]
          state = stateString;

        // [ reject_list | resolve_list ].disable; progress_list.lock
        }, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
      }

      // deferred[ resolve | reject | notify ] = list.fire
      deferred[ tuple[0] ] = list.fire;
      deferred[ tuple[0] + "With" ] = list.fireWith;
    });

    // Make the deferred a promise
    promise.promise( deferred );

    // Call given func if any
    if ( func ) {
      func.call( deferred, deferred );
    }

    // All done!
    return deferred;
  };

  // Deferred helper
  _d.when = function( subordinate /* , ..., subordinateN */ ) {
    var i = 0,
      resolveValues = _type(subordinate) === 'array' && arguments.length === 1 ?
        subordinate : slice.call( arguments ),
      length = resolveValues.length,

      // the count of uncompleted subordinates
      remaining = length !== 1 || ( subordinate && _isFunction( subordinate.promise ) ) ? length : 0,

      // the master Deferred. If resolveValues consist of only a single Deferred, just use that.
      deferred = remaining === 1 ? subordinate : _d.Deferred(),

      // Update function for both resolve and progress values
      updateFunc = function( i, contexts, values ) {
        return function( value ) {
          contexts[ i ] = this;
          values[ i ] = arguments.length > 1 ? slice.call( arguments ) : value;
          if( values === progressValues ) {
            deferred.notifyWith( contexts, values );
          } else if ( !( --remaining ) ) {
            deferred.resolveWith( contexts, values );
          }
        };
      },

      progressValues, progressContexts, resolveContexts;

    // add listeners to Deferred subordinates; treat others as resolved
    if ( length > 1 ) {
      progressValues = new Array( length );
      progressContexts = new Array( length );
      resolveContexts = new Array( length );
      for ( ; i < length; i++ ) {
        if ( resolveValues[ i ] && _isFunction( resolveValues[ i ].promise ) ) {
          resolveValues[ i ].promise()
            .done( updateFunc( i, resolveContexts, resolveValues ) )
            .fail( deferred.reject )
            .progress( updateFunc( i, progressContexts, progressValues ) );
        } else {
          --remaining;
        }
      }
    }

    // if we're not waiting on anything, resolve the master
    if ( !remaining ) {
      deferred.resolveWith( resolveContexts, resolveValues );
    }

    return deferred.promise();
  };

  // Try exporting as a Common.js Module
  if ( typeof module !== "undefined" && module.exports ) {
    module.exports = _d;

  // Or mixin to Underscore.js
  } else if ( typeof root._ !== "undefined" ) {
    root._.mixin(_d);

  // Or assign it to window._
  } else {
    root._ = _d;
  }

})(this);

/*
 * Timer.js: A periodic timer for Node.js and the browser.
 *
 * Copyright (c) 2012 Arthur Klepchukov, Jarvis Badgley, Florian Schäfer
 * Licensed under the BSD license (BSD_LICENSE.txt)
 *
 * Version: 0.0.1
 *
 */
(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.Timer = factory();
    }
})(this, function () {

    function timeStringToMilliseconds(timeString) {
        if (typeof timeString === 'string') {

            if (isNaN(parseInt(timeString, 10))) {
                timeString = '1' + timeString;
            }

            var match = timeString
                .replace(/[^a-z0-9\.]/g, '')
                .match(/(?:(\d+(?:\.\d+)?)(?:days?|d))?(?:(\d+(?:\.\d+)?)(?:hours?|hrs?|h))?(?:(\d+(?:\.\d+)?)(?:minutes?|mins?|m\b))?(?:(\d+(?:\.\d+)?)(?:seconds?|secs?|s))?(?:(\d+(?:\.\d+)?)(?:milliseconds?|ms))?/);

            if (match[0]) {
                return parseFloat(match[1] || 0) * 86400000 +  // days
                       parseFloat(match[2] || 0) * 3600000 +   // hours
                       parseFloat(match[3] || 0) * 60000 +     // minutes
                       parseFloat(match[4] || 0) * 1000 +      // seconds
                       parseInt(match[5] || 0, 10);            // milliseconds
            }

            if (!isNaN(parseInt(timeString, 10))) {
                return parseInt(timeString, 10);
            }
        }

        if (typeof timeString === 'number') {
            return timeString;
        }

        return 0;
    }

    function millisecondsToTicks(milliseconds, resolution) {
        return parseInt(milliseconds / resolution, 10) || 1;
    }

    function Timer(resolution) {
        if (this instanceof Timer === false) {
            return new Timer(resolution);
        }

        this._notifications = [];
        this._resolution = timeStringToMilliseconds(resolution) || 1000;
        this._running = false;
        this._ticks = 0;
        this._timer = null;
    }

    Timer.prototype = {
        start: function () {
            var self = this;
            if (!this._running) {
                this._running = !this._running;
                setTimeout(function loopsyloop() {
                    self._ticks++;
                    for (var i = 0, l = self._notifications.length; i < l; i++) {
                        if (self._notifications[i] && self._ticks % self._notifications[i].ticks === 0) {
                            self._notifications[i].callback.call(self._notifications[i], { ticks: self._ticks, resolution: self._resolution });
                        }
                    }
                    if (self._running) {
                        self._timer = setTimeout(loopsyloop, self._resolution);
                    }
                }, this._resolution);
            }
            return this;
        },
        stop: function () {
            if (this._running) {
                this._running = !this._running;
                clearTimeout(this._timer);
            }
            return this;
        },
        reset: function () {
            this.stop();
            this._ticks = 0;
            return this;
        },
        clear: function () {
            this.reset();
            this._notifications = [];
            return this;
        },
        ticks: function () {
            return this._ticks;
        },
        resolution: function () {
            return this._resolution;
        },
        running: function () {
            return this._running;
        },
        bind: function (when, callback) {
            if (when && callback) {
                var ticks = millisecondsToTicks(timeStringToMilliseconds(when), this._resolution);
                this._notifications.push({
                    ticks: ticks,
                    callback: callback
                });
            }
            return this;
        },
        unbind: function (callback) {
            if (!callback) {
                this._notifications = [];
            } else {
                for (var i = 0, l = this._notifications.length; i < l; i++) {
                    if (this._notifications[i] && this._notifications[i].callback === callback) {
                        this._notifications.splice(i, 1);
                    }
                }
            }
            return this;
        }

    };

    Timer.prototype.every = Timer.prototype.bind;
    Timer.prototype.after = function (when, callback) {
        var self = this;
        Timer.prototype.bind.call(self, when, function fn () {
            Timer.prototype.unbind.call(self, fn);
            callback.apply(this, arguments);
        });
        return this;
    };

    return Timer;

});

mbox.CONF = {
    debug : false,
    version : '1.0.0',
    pid : '323', // production id, player log使用
    api : 'http://tingapi.ting.baidu.com/v1/restserver/ting?&method={{method}}&format=jsonp&callback=?',

    cacheApi : true,
    assetsPath : '..',

    // key, expires(ms)
    storages : {
        // api默认缓存5 mins
        // 5 mins = 5 * 60000 = 300000
        api : {
            key : 'api',
            expires : 300000
        }
    },

    // 调用api返回的code，参考api文档的“通用异常处理”章节
    apiCode : {
        SUCCESS : 22000,
        FAILED : 22001,
        USER_IP_LIMIT : 22463
    }
};

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

(function (_) {
    // Events
    // -----------------
    // Thanks to:
    //  - https://github.com/documentcloud/backbone/blob/master/backbone.js
    //  - https://github.com/joyent/node/blob/master/lib/events.js


    // Regular expression used to split event strings
    var eventSplitter = /\s+/


    // A module that can be mixed in to *any object* in order to provide it
    // with custom events. You may bind with `on` or remove with `off` callback
    // functions to an event; `trigger`-ing an event fires all callbacks in
    // succession.
    //
    //     var object = new Events();
    //     object.on('expand', function(){ alert('expanded'); });
    //     object.trigger('expand');
    //
    function Events() {
    }


    // Bind one or more space separated events, `events`, to a `callback`
    // function. Passing `"all"` will bind the callback to all events fired.
    Events.prototype.on = function (events, callback, context) {
        var cache, event, list
        if (!callback) return this

        cache = this.__events || (this.__events = {})
        events = events.split(eventSplitter)

        while (event = events.shift()) {
            list = cache[event] || (cache[event] = [])
            list.push(callback, context)
        }

        return this
    }


    // Remove one or many callbacks. If `context` is null, removes all callbacks
    // with that function. If `callback` is null, removes all callbacks for the
    // event. If `events` is null, removes all bound callbacks for all events.
    Events.prototype.off = function (events, callback, context) {
        var cache, event, list, i

        // No events, or removing *all* events.
        if (!(cache = this.__events)) return this
        if (!(events || callback || context)) {
            delete this.__events
            return this
        }

        events = events ? events.split(eventSplitter) : keys(cache)

        // Loop through the callback list, splicing where appropriate.
        while (event = events.shift()) {
            list = cache[event]
            if (!list) continue

            if (!(callback || context)) {
                delete cache[event]
                continue
            }

            for (i = list.length - 2; i >= 0; i -= 2) {
                if (!(callback && list[i] !== callback ||
                    context && list[i + 1] !== context)) {
                    list.splice(i, 2)
                }
            }
        }

        return this
    }


    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    Events.prototype.trigger = function (events) {
        var cache, event, all, list, i, len, rest = [], args
        if (!(cache = this.__events)) return this

        events = events.split(eventSplitter)

        // Fill up `rest` with the callback arguments.  Since we're only copying
        // the tail of `arguments`, a loop is much faster than Array#slice.
        for (i = 1, len = arguments.length; i < len; i++) {
            rest[i - 1] = arguments[i]
        }

        // For each event, walk through the list of callbacks twice, first to
        // trigger the event, then to trigger any `"all"` callbacks.
        while (event = events.shift()) {
            // Copy callback lists to prevent modification.
            if (all = cache.all) all = all.slice()
            if (list = cache[event]) list = list.slice()

            // Execute event callbacks.
            if (list) {
                for (i = 0, len = list.length; i < len; i += 2) {
                    list[i].apply(list[i + 1] || this, rest)
                }
            }

            // Execute "all" callbacks.
            if (all) {
                args = [event].concat(rest)
                for (i = 0, len = all.length; i < len; i += 2) {
                    all[i].apply(all[i + 1] || this, args)
                }
            }
        }

        return this
    }


    // Mix `Events` to object instance or Class function.
    Events.mixTo = function (receiver) {
        receiver = receiver.prototype || receiver
        var proto = Events.prototype

        for (var p in proto) {
            if (proto.hasOwnProperty(p)) {
                receiver[p] = proto[p]
            }
        }
    }


    // Helpers
    // -------

    var keys = Object.keys

    if (!keys) {
        keys = function (o) {
            var result = []

            for (var name in o) {
                if (o.hasOwnProperty(name)) {
                    result.push(name)
                }
            }
            return result
        }
    }




/**********************************c以下是自定义的Model
 * ********************************************/
    var Model = function () {
            _.extend(this, this.defaults);
            this.initialize.apply(this, arguments);
        },

    // 摘自Backbone.js源码
        extend = function (protoProps, staticProps) {
            var parent = this,
                child,
                Surrogate = function () {
                    this.constructor = child;
                };

            if (protoProps && _.has(protoProps, 'constructor')) {
                child = protoProps.constructor;
            } else {
                child = function () {
                    parent.apply(this, arguments);
                };
            }

            _.extend(child, parent, staticProps);
            Surrogate.prototype = parent.prototype;
            child.prototype = new Surrogate();

            if (protoProps) {
                _.extend(child.prototype, protoProps);
            }

            child.__super__ = parent.prototype;

            return child;
        };

    _.extend(Model.prototype, {
        initialize : function () {
        }
    });

    Events.mixTo(Model);

    Model.extend = extend;

    mbox.Model = Model;
})(_);

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
