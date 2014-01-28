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
