/**
 * Created by huwanqi on 2016/3/13.
 */
var util = require("util");
var layerGroup;
var points = [];
var selectedPoints = [];
var map;
var types = 10;
var selectedType = [];
var time_min = null;
var time_max = null;

var colors = [];

var filterPoints = function(){
	console.log("filterPoints");
    var temps = [];
    if(time_min && time_max){
        points.forEach(function(p){
            var time = new Date(p.time);
            if(time > time_min && time < time_max && selectedType[p.type]){
                temps.push(p);
            }
        });
    }else{
        points.forEach(function(p){
            if(selectedType[p.type]){
                temps.push(p);
            }
        });
    }
    selectedPoints = temps;
};

var drawPoints = function(){
	console.log("drawPoints");
    layerGroup && layerGroup.clearLayers();
    layerGroup = L.layerGroup();
    selectedPoints.forEach(function(p){
        var circle = L.circle([p.lat, p.lng], 1000, {
            color: colors[p.type],
            fillColor: colors[p.type]
        }).addTo(layerGroup);
        circle.p = p;
    });
    layerGroup.addTo(map);
};

var drawSVGPoints = function(){
	console.log("drawSVG");
    var canvas = d3.select("#earthquake-timeline svg g");
    canvas.selectAll("*").remove();
    d3.selectAll(".axis").remove();
    var width = $("#earthquake-timeline svg").width();
    var height = $("#earthquake-timeline svg").height();
    var timeExtent = d3.extent(selectedPoints, function(d) {
        return new Date(d.time);
    });
    var x = d3.time.scale()
        .range([0, width])
        .domain(timeExtent);
    var y = d3.scale.linear()
        .range([height, 0]);
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(6);
    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");
    //X 轴
    d3.select("#earthquake-timeline svg").append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (height-30) + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("Date");
    //Y 轴
    d3.select("#earthquake-timeline svg").append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + "0)")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("v,s");

    canvas.selectAll(".point")
        .data(selectedPoints)
        .enter()
        .append("circle")
        .attr("class", 'point')
        .attr("r", 2)
        .attr("fill", function(d){
            return colors[d.type];
        })
        .attr("opacity", 0.3)
        // .attr("stroke", 'black')
        .attr("transform", function(d){
            return "translate(" + x(new Date(d.time)) + ', ' + height/2 + ')';
        });

    var brush = d3.svg.brush()
        .x(x)
        .on('brushend', brushend)
        .on('brushstart', brushstart);
    canvas.append('g')
        .attr('class', 'x brush')
        .call(brush)
        .selectAll('rect')
        .attr('y', -6)
        .attr('height', height);
    //// Moving Date
    canvas.append("text")
        .attr("class", "time_label left_label")
        .attr("x", -100)
        .attr("y", height/5)
        .text(" ");
    canvas.append("text")
        .attr("class", "time_label right_label")
        .attr("x", -100)
        .attr("y", height/5*4)
        .text(" ");

    function brushstart() {
        $(".time_label").hide();
        time_min = null;
        time_max = null;
    }
    function brushend() {
        if (brush.empty()) {
            $(".time_label").hide();
            filterPoints();
            drawPoints();
        } else {
            time_min = brush.extent()[0];
            time_max = brush.extent()[1];
            $(".time_label").show();
            d3.select(".left_label")
                .attr("x", x(time_min))
                .text(time_min);
            d3.select(".right_label")
                .attr("x", x(time_max))
                .text(time_max);
            filterPoints();
            drawPoints();
        }
    }
};

$(document).ready(function(){
	console.log("ready");
    //开始默认所有类别都勾上
    map = L.map('earthquake-map').setView([28.38, 121.21], 8);
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    $.ajax({
        type: 'GET',
        url: util.urlBase + '/search3',
        success: function(data){
            for(var i = 0; i < data.length; i++)
            {
                var coordinates = data[i].coordinates;
                var p = {
                    lat: coordinates[0],
                    lng: coordinates[1],
                    time: coordinates[2],
                    type: data[i].cindex
                };
                points.push(p);
            }
            selectedPoints = points;
            drawPoints();
            drawSVGPoints();
        },
        error: function(data){
            console.log(data);
        }
    });

    for(var i = 0; i < types; i++){
        selectedType[i] = true;
        colors[i] = '#'+('00000'+(Math.random()*0x1000000<<0).toString(16)).slice(-6);
        $(".earthquake-types").append('<div class="item" data="' + i + '" style="color: ' + colors[i] + '"> ' +
            '<input type="checkbox" name="type" id="types-' + i + '" checked/> ' +
            '<label for="types-' + i + '">第' + i + '类</label> ' +
            '</div>');
    }

    $("body").on("change", ".earthquake-types .item input", function(){
    	console.log("change");
        time_min = null;
        time_max = null;
        var checked = $(this)[0].checked;
        var type = $(this).parents(".item").attr("data");
        selectedType[type] = checked;
        filterPoints();
        drawPoints();
        drawSVGPoints();
    });

});