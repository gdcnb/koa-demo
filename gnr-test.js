'use strict';
function *loop() {};

function compose(middleware) {
    return function *(next) {
        if(!next) next = loop;

        var i = middleware.length
        while(i--) {
            next = middleware[i].call(this, next);
        }

        yield *next;
    }
}