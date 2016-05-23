var Agent = require('agentkeepalive');

var request = require('request').defaults({
    timeout : 3000,
    agentClass : Agent,
    agentOptions : {
      // 开启长连接
      keepAlive : true,
      // 最大连接数
      maxSockets : 100,
      // 最大空闲连接数
      maxFreeSockets : 10,
      keepAliveTimeout : 60000
    }
  });
  
function NOOP () {}


/**
 * 发起请求，返回Promise对象
 * @param options {Object}
 * @returns {Promise}
 */
module.exports = function(options) {
  options = options || {};

  options.method = (options.method || '').toUpperCase();
    
    if (~['POST', 'PUT', 'PATCH', 'DELETE'].indexOf(options.method)) {
        var headers = options.headers || {};
        headers['Content-Type'] = 'application/json;charset=UTF-8';
        
        options.headers = headers;
    }
    
    return new Promise(function(resolve, reject) {
        request(options, function(error, response, body) {
                if(error) {
                    reject(error);
                    return
                }

                if (response.statusCode == 200) {
                    resolve(body);
                } else {
                    // 使用 HTTP 的错误回报
                    error = {
                        message: 'HTTP [' + response.statusCode + '] error'
                    };
                    error.type = 'http';
                    error.code = response.statusCode;
                    error.statusCode = response.statusCode;
                    reject(error);
                }
            }
        );
    });
};
