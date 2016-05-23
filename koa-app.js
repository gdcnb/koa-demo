'use strict';
var request = require('request');
var api = require('./api');
var co = require('co');

/***************************** generator demo ****************************/
//function* test() {
//
//    var obj = yield {a:1};
//
//    console.log('=====> obj: ', obj);
//
//    var list = yield [1,2,3];
//
//    console.log('======> list: ', list);
//
//    var asyData = yield setTimeout(()=>{
//        console.log('asy call back');
//        return 'asyData';
//    }, 1000);
//
//
//    console.log('=======> asyData: ', asyData);
//
//    yield 'end';
//
//    return 'result';
//}
//
//var g = test();
//
////默认情况下 yield 不会有返回值的
////var r1 = g.next();
////var r2= g.next();
////var r3 = g.next();
////var r4 = g.next();
//
////如果想 yield 有返回值，则在调用next时传递一个参数作为它的返回值
//var r1 = g.next();
//var r2= g.next(r1.value);
//var r3 = g.next(r2.value);
//var r4 = g.next(r3.value);
//
//console.log('r1=%j, \nr2=%j, \nr3=%j \nr4=%j \n', r1, r2, r3, r4);

//问题：如何通过 yield 返回异步请求的结果值呢？

/***************************** generator 异步回调demo ****************************/
 //var contentIndex = 0;
 //function getContent(content){
 //    contentIndex++;
 //    return new Promise(function(resovle, reject){
 //        setTimeout(function(){
 //            if (contentIndex <=10 ) {
 //                resovle("after:" + content);
 //            } else {
 //                reject("getContent函数，不能运行两次以上!!");
 //            }
 //        }, 1000);
 //    });
 //};
 //
 //function autoRun(generator, preValue){
 //    var result = generator.next(preValue); //next带参数把上一次yield的结果返回
 //    console.log('==> result: ', result);
 //
 //    if (!result.done) {
 //        var value = result.value;
 //        if (value instanceof Promise) {
 //            value.then(function(data){
 //                autoRun(generator, data); //在当前promise对象中递归调用，继续调用遍历器的next，实现异步返回
 //            }, function(e){
 //                console.warn("产生错误:" + e);
 //            }).catch(function(e){
 //                console.error("重大错误:" + e);
 //            });
 //        } else {
 //            autoRun(generator, value);
 //        }
 //    }
 //};
 //
 //
 //function* testGenerator(){
 //    var content = yield getContent('test1')
 //    console.log(content);
 //
 //    content = yield getContent('test2')
 //    console.log(content);
 //
 //    content = yield getContent('test3')
 //    console.log(content);
 //};
 //
 //autoRun(testGenerator());

// Koa 框架就是将 generator 函数和 Promise 有效结合起来，通过 yield 返回异步请求的结果值。
// 从而实现了用同步的编码方式来实现异步逻辑，这也是Koa的核心思想。

/***************************** Koa 中间件原理分析 ****************************/

//var genList = [
//    function *(next) {
//        console.log('=======>a-begin');
//        //var obj = yield {a:1};
//        //console.log('=====>', obj)
//        //var list = yield [1,2, 3]
//        //console.log('======>', list)
//        //
//        //var gen = yield function* () {console.log('generator fn test')}
//
//        yield next;
//
//        console.log('=======>a-end');
//    },
//    function *(next) {
//        console.log('=======>b-begin');
//        //这里添加一个请求接口的处理
//        var html = yield api({
//            method: 'GET',
//            url: 'http://hao.uc.cn'
//        }).then((body) => {
//            console.log('======> api get body length: ', body.length);
//            return body;
//        });
//        console.log('html length: ', html.length);
//
//        yield next;
//
//        console.log('=======>b-end');
//    },
//    function *(next) {
//        console.log('=======>c-begin');
//
//        console.log('=======>c-end');
//    }
//];
//
//function *noop(){}
//
////将中间件数组合并起来，实现数组的层层调用
//function compose(middleware){
//    return function *(next){
//        if (!next) next = noop();
//
//        var i = middleware.length;
//
//        while (i--) {
//            next = middleware[i].call(this, next); //通过倒序的方式将gen函数方法中的 next 指向下一个gen函数，实现中间件数组的洋葱模式的执行顺序
//        }
//
//        return yield *next; //返回合并后中间件数组的第一个迭代器
//    }
//}
//
//var fn = co.wrap(compose(genList));
//fn().catch(function(err) {
//    console.error('=========> error call back: '+ err);
//});



/***************************** Koa app ****************************/
var koa = require('koa');
var app = koa();

// logger
app.use(function *(next){
    console.log('===> log-begin');
    var start = Date.now();

    yield next;

    var ms = Date.now() - start;
    this.set('X-Response-Time', ms + 'ms');
    console.log('===> log-end');
});


app.use(function *(next) {
    if(this.url === '/favicon.ico') {
        this.body = '';
    } else {
        console.log('===> body-begin');
        try {
            //通过yield拿到请求的结果，在请求返回结果前下面的代码不会执行
            var result = yield api({url: 'http://nyantai.uodoo.com/channel/hot?uc_param_str=dnfr'});

            //对第一个接口返回的数据进行判断再决定是否发送请求，由于是拿到上面请求的结果才会执行到这里，这样就解决了异步请求的层层回调问题
            if(result.length) {
                var dataList = yield Promise.all([
                    api({url: 'http://hao.uc.cn'}),
                    api({url: 'http://uccricket.ucweb.com/?uc_param_str=dnfr'})
                ]);

                this.body = dataList[0];

            } else {
                this.throw(new Error('no data'))
            }

        } catch (e) { //这里可以捕获到上面业务逻辑中任何地方产生的错误，包括异步请求产生的错误
            console.log('========> 统一处理错误: ',e);
            console.log(e.stack);

            this.body = '<h1 style="color: red; text-align: center; margin-top: 50px;">' +
                'Sorry, There is something wrong! </h1>';
        }
        console.log('===> body-end');
    }

});

app.listen(9999, function() {
    console.log('========> koa web app run of port [9999]!');
});

