'use strict';

var express = require('express');
var api = require('./api');
//import express from 'express';

var app = express();

app.use((req, res, next) => {
    console.log('========> time-begin');
    var start = new Date;
    next();
    var ms = new Date - start;
    console.log('=======> req time: ', ms);
    console.log('==========> time-end');
});

app.get('/',(req, res)=> {
    console.log('========> page-begin');
    api({
        url: 'http://nyantai.uodoo.com/channel/hot?uc_param_str=dnfr'
    }).then(function(result) {
        if(result.length) {
            Promise.all([
                api({url: 'http://hao.uc.cn'}),
                api({url: 'http://uccricket.ucweb.com/?uc_param_str=dnfr'})
            ]).then((results) => {
                console.log('======> html return');
                res.send(results[0]);
            }).catch(function(e) {
                throw(e);
            })
        } else {
            res.send(500, 'error');
        }
    }).catch(function(e) {
        res.send(500, 'error');
    })
    console.log('========> page-end');
});


app.listen(9998, function(){
    console.log('Express app has run with port [9998]');
});