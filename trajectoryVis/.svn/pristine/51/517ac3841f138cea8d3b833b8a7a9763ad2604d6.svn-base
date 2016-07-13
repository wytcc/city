var util = require("util");
var layerGroup;
var points = [];
var map;

var types = 10;

$(document).ready(function(){
	map = L.map('timeline-map').setView([28.38, 121.21], 8);
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

	$.ajax({
	    type: "GET",
	    url: util.urlBase + '/search',
	    data: {},
	    success: function(data){
	    	console.log(data);
		    var twopoint = [];
		    var len = data[0].records.coordinates.length;
	        layerGroup && layerGroup.clearLayers();
    		layerGroup = L.layerGroup();
	        for(var i = 0; i < len-1; i++)
	        {
	          twopoint[0]= L.latLng(data[0].records.coordinates[i][0],data[0].records.coordinates[i][1]);
	          twopoint[1]= L.latLng(data[0].records.coordinates[i+1][0],data[0].records.coordinates[i+1][1]);
	          if(data[0].records.coordinates[i][3] != 0 && data[0].records.coordinates[i+1][3] != 0){
	          	var temp = L.circle(twopoint[0], 200);
	          	layerGroup.addLayer(temp);
	          }else{
	          	var temp = L.polyline(twopoint,{color: 'red'});
	          	layerGroup.addLayer(temp);
	          }
	          var temp = {
	            index: i,
	            radius: 20,
	            lat: data[0].records.coordinates[i][0],
	            lng: data[0].records.coordinates[i][1],
	            time: data[0].records.coordinates[i][2]
		      };
		      points.push(temp);
	        }
	        layerGroup.addTo(map);
	        var temp = {
	            index: len,
	            radius: 2,
	            lat: data[0].records.coordinates[len-1][0],
	            lng: data[0].records.coordinates[len-1][1],
	            time: data[0].records.coordinates[len-1][2]
		      };
		    points.push(temp);

		    // Brush
		    var canvas = d3.select("#timeline-timeline svg").append("g");
		    var width = $("#timeline-timeline svg").width();
		    var height = $("#timeline-timeline svg").height();
		    var timeExtent = d3.extent(points, function(d) {
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
			d3.select("#timeline-timeline svg").append("g")
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
			d3.select("#timeline-timeline svg").append("g")
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
		        .data(points)
		        .enter()
		        .append("circle")
		        .attr("class", 'point')
		        .attr("r", function(d){
		            return d.radius;
		        })
		        .attr("fill", "red")
		        .attr("opacity", 0.3)
		        // .attr("stroke", 'black')
		        .attr("transform", function(d){
		            return "translate(" + x(new Date(d.time)) + ', ' + height/2 + ')';
		        });

		    var brush = d3.svg.brush()
		        .x(x)
		        .on('brushend', brushend);
		    canvas.append('g')
		        .attr('class', 'x brush')
		        .call(brush)
		        .selectAll('rect')
		        .attr('y', -6)
		        .attr('height', height);
		    // Moving Date
		    canvas.append("text")
		    	.attr("class", "left_label")
				.attr("x", -100)
				.attr("y", height/5)
				.text(" ");
			canvas.append("text")
		    	.attr("class", "right_label")
				.attr("x", -100)
				.attr("y", height/5*4)
				.text(" ");

		    function brushend() {
		    	layerGroup && layerGroup.clearLayers();
			    layerGroup = L.layerGroup();
		    	var l = brush.extent()[0];
		    	var r = brush.extent()[1];
		    	if (brush.empty())
		    	{
		    		d3.select(".left_label")
		    			.attr("x", -100);
		    		d3.select(".right_label")
		    			.attr("x", -100);
		    		for(i = 0; i < len-1; i++)
			        {
		          	  twopoint[0]= L.latLng(data[0].records.coordinates[i][0],data[0].records.coordinates[i][1]);
			          twopoint[1]= L.latLng(data[0].records.coordinates[i+1][0],data[0].records.coordinates[i+1][1]);
			          if(data[0].records.coordinates[i][3] != 0 && data[0].records.coordinates[i+1][3] != 0){
			          	var temp = L.circle(twopoint[0], 200);
			          	layerGroup.addLayer(temp);
			          }else{
			          	var temp = L.polyline(twopoint,{color: 'red'});
			          	layerGroup.addLayer(temp);
			          }
			        } 
		    	}
		    	else 
		    	{
		    		d3.select(".left_label")
		    			.attr("x", x(l))
		    			.text(l);
		    		d3.select(".right_label")
		    			.attr("x", x(r))
		    			.text(r);
					for(i = 0; i < len-1; i++)
			        {
			          var time = new Date(data[0].records.coordinates[i][2]);
			          if (time >= l && time <= r)
			          {
			          	  twopoint[0]= L.latLng(data[0].records.coordinates[i][0],data[0].records.coordinates[i][1]);
				          twopoint[1]= L.latLng(data[0].records.coordinates[i+1][0],data[0].records.coordinates[i+1][1]);
				          if(data[0].records.coordinates[i][3] != 0 && data[0].records.coordinates[i+1][3] != 0){
				          	var temp = L.circle(twopoint[0], 200);
				          	layerGroup.addLayer(temp);
				          }else{
				          	var temp = L.polyline(twopoint,{color: 'red'});
				          	layerGroup.addLayer(temp);
				          }
			          } 
				    }
				}

			    layerGroup.addTo(map);

			}

	    },
	    error: function(data){
	        console.log(data);
	    }
	});
    
});