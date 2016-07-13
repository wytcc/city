var mongoose = require('mongoose');

var schema = new mongoose.Schema({cindex: Number});
var stay = mongoose.model('stay', schema,"stay");

exports.getData = function(type, callback){
    var obj = {};
    if(type){
        obj = {
            cindex: type
        };
    }
    stay.find(obj,function(err,trajectorylist){
        if (err) {return console.error(err);}
        else{
            callback("", trajectorylist);
        }
    });
};

