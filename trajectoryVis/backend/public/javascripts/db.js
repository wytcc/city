/**
 * Created by huwanqi on 2016/3/11.
 */
var mongoose = require('mongoose');
mongoose.connect('mongodb://10.76.0.182:27017/db');


//mongoose.connect('mongodb://127.0.0.1:27017/mydb');
var db = mongoose.connection;

//日期格式化
var moment = require('moment');
var now = moment();

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
    console.log('Time:'+moment().format('YYYY-MM-DD HH:mm:ss') + ' ' + 'Event:Connected to mongodb');
});
