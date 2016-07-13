/**
 * Created by huwanqi on 2016/3/15.
 */
var util = require("util");
var nodeData = require("nodesProducer");
var clustersNum = 20;
var timePoints = 84;

var matrixes = [];

$.ajax({
    url: "/static/data/transition4.csv",
    async: false,
    type: 'GET',
    success: function(data){
        var rawData = util.CSVToArray(data);
        for(var i = 0; i < timePoints; i++){
            matrixes[i] = [];
            for(var j = 0; j < rawData.length; j++){
                var row = rawData[j];
                var temp = [];
                for(var k = i * clustersNum; k < (i+1) * clustersNum; k++){
                    temp.push(parseFloat(row[k]));
                }
                matrixes[i].push(temp);
            }
        }
    },
    error: function(data){
        console.log(data);
    }
});

module.exports = matrixes;
