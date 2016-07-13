/**
 * Created by huwanqi on 2016/3/15.
 */
var util = require("util");
var timePoints = 84;
var clustersNum;

var clusters = [];
var columns = [];

$.ajax({
    url: "/static/data/nodesize.csv",
    async: false,
    type: 'GET',
    success: function(data){
        clusters = util.CSVToArray(data);
        clustersNum = clusters.length;
        columns = [];
        for(var i = 0; i < timePoints; i++){
            columns[i] = [];
            for(var j = 0; j < clustersNum; j++){
                columns[i].push(parseFloat(clusters[j][i]));
            }
        }
    },
    error: function(data){
        console.log(data);
    }
});

module.exports = {
    clusters: clusters,
    columns: columns,
    timePoints: timePoints,
    clustersNum: clustersNum
};
