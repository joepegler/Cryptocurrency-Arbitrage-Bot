"use strict";

module.exports = {
    log: function(message){
        if( typeof message === 'object'){
            console.log(JSON.stringify(message));
        }
        else {
            console.log(message);
        }
    },
    error: function(err) {
        if (typeof err === 'object') {
            console.error();
            console.error(JSON.stringify(err));
        }
        else {
            console.error();
            console.error(err);
        }
    }
};