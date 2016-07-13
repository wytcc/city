var util = require("util");
var coordinates = require("coordinates");
var leafletmap, sankey;

var fieldsColors = ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a"];

var sortField = null;
var sortType = 0;

function render(dom, map, san) {

	var that = this;

	leafletmap = map;
	sankey = san;

    var pix_width = $(dom).width(),
        pix_height = pix_width/9*11.25;

    var pix_left = pix_width/9*4;
    pix_width = pix_width/9*5;

    var gridSize = Math.floor(pix_width / 10),
        colors = ["#FFFAF0","#FFDAB9","#FFA07A","#FF6347","#EE2C2C","#FF0000"];

    var pattern_num = 20;
    var pattern = [];
    var patternData = [];
    var patternVal = [];
    for (var i = 0; i < pattern_num; i++){
        // pattern.push("Pattern"+i);
        pattern.push(+i);
    }

    //聚类序号，平均值
    $.ajax({
        type: 'GET',
        async: false,
        url: util.urlBase + '/getClusterAvg',
        success: function(data){
		   //console.log(util.urlBase);
		   data.forEach(function(d){
		       patternData.push({
				  pat: d.clusterid,
				  dim: d.dimindex,
				  val: d.avgvalue
		       });
		   });
        },
        error: function(data){
		   console.log(data);
        }
    });
  	// 聚类
    $.ajax({
        type: 'GET',
        async: false,
        url: util.urlBase + '/getClusterPeople',
        success: function(data){
		   	//console.log(data);
		   	data.forEach(function(d){
				patternVal.push({
    				pat: d.clusterid,
    				val: d.counts
        		});
		   });
        },
        error: function(data){
		   console.log(data);
        }
    });

    // Ã¿¸öÀàÈËÊý
    // for(var i = 0; i < pattern_num; i++){
    //     patternVal.push({
    // 		pat: i,
    // 		val: Math.random() * 1000
    //     });
    // }

	$("#pixsvg").remove();
    var svg = d3.select(dom)
        .append("svg")
        .attr("id", "pixsvg")
        .attr("width", pix_width + pix_left + "px")
        .attr("height", pix_height + "px")
        .append("g")
        .attr("id", "pix")
        .attr("transform", "translate("+ (-gridSize*0.75) +"," + gridSize*2.3 + ")")
        .append("g")
        .attr("transform", "translate(" + (pix_left-gridSize) + ", 0)");

	var Dim_name = ['ETrand', 'Eunc',
					'AveSpeed', 'MoveDis',
					'Rg', 'MoveRatio',
					'AveLocX', 'AveLocY',
					'HomeLocX', 'HomeLocY'
					];
	// legend
	d3.select("#pixsvg")
		.append("g")
		.attr("transform", "translate(" + (pix_left - gridSize*2.25) + "," + gridSize*2.1 + ")")
		.append("text")
		.text("#Segments")
		.attr("x", 0)
		.attr("y", 0)
    	.style({
    		"font-family": "Arial",
    		"-webkit-text-size-adjust": "none",
    		"font-size": "5px",
    		// "fill": "gray",
    		// "opacity": 0.5,
    		"text-anchor": "end"
    	});
    d3.select("#pixsvg")
		.append("g")
		.attr("transform", "translate(" + (pix_left - gridSize*5.5) + "," + gridSize*2.1 + ")")
		.append("text")
		.text("PatternID")
		.attr("x", 0)
		.attr("y", 0)
    	.style({
    		"font-family": "Arial",
    		"-webkit-text-size-adjust": "none",
    		"font-size": "5px",
    		// "fill": "gray",
    		// "opacity": 0.5,
    		"text-anchor": "end"
    	});
    for (var i = 0; i < Dim_name.length; i++)
    {
    	d3.select("#pixsvg")
    		.append("g")
    		.attr("transform", "translate(" + (pix_left + gridSize*(i-1.25)) + "," + gridSize*2.3 + ")")
    		.append("text")
    		.text(Dim_name[i])
    		.attr("class", "features")
    		.attr("x", 0)
    		.attr("sort", 0)
    		.attr("index", i)
    		.attr("y", 0)
        	.style({
        		transform: "rotate(-39deg)",
        		"font-family": "Arial",
        		"-webkit-text-size-adjust": "none",
        		"font-size": "5px",
        		"cursor": "pointer",
        		// "fill": "gray",
        		// "opacity": 0.5,
        		"text-anchor": "begin"
        	}).on("click", function(){
				d3.selectAll(".features").attr("sort", 0);
				var sort = parseInt(d3.select(this).attr("sort"));
				var index = parseInt(d3.select(this).attr("index"));
				sortField = index;
				if(sort === 0){
					d3.select(this).attr("sort", 1);
					sortType = 1;
				}
				else if(sort === 1){
					d3.select(this).attr("sort", 2);
					sortType = 2;
				}else if(sort === 2){
					d3.select(this).attr("sort", 1);
					sortType = 1;
				}
				sortPattern();
			});
    }
    svg.selectAll(".pixLabel")
        .data(pattern)
        .enter().append("text")
        .text(function (d) { return d; })
        .attr("x", -gridSize*1.15)
        .attr("y", function (d, i) { return i * gridSize; })
        .style("text-anchor", "end")
        .attr("transform", "translate(" + (-4*gridSize+5) + "," + gridSize/1.5 + ")")
        .attr("class", "pixLabel")
		.attr("data", function (d) { return d; })
        .style("fill","black");

    var pixChart = function(dd) {

		//console.log(patternData);
        var colorScale = d3.scale.quantile()
		   .domain([0, 1, d3.max(patternData, function (d) { return d.val; })])
		   .range(colors);

        svg.selectAll(".dim.pixel")
		   .data(patternData)
		   .enter().append("rect")
		   .attr("x", function(d) {
			   return d.dim * gridSize;
		   })
		   .attr("y", function(d) {
			   return d.pat * gridSize;
		   })
		   .attr("data", function(d){
			   return d.pat;
			})
		   .attr("rx", 4)
		   .attr("ry", 4)
		   .attr("class", "dim bordered pixel")
		   .attr("width", gridSize)
		   .attr("height", gridSize)
		   //.style("fill", function(d) {
			//   return colorScale(d.val);
		   //})
			//.style("fill", function(d) {
			//	return fieldsColors[d.dim];
			//})
			.style("fill", "#e31a1c")
			.style("opacity", function(d) {
				return d.val;
			})
		   .append("title").text(function(d){
		       return d.val;
		   });

        colorScale.domain([0, 1, d3.max(patternVal, function (d) { return d.val; })])
        d3.select("#pix")
		   .append("g")
		   .attr("transform", "translate(" + (pix_left/2-gridSize*0.4) + ", 0)")
		   .selectAll(".dim.total")
		   .data(patternVal)
		   .enter().append("rect")
		   .attr("x", 0)
		   .attr("y", function(d) { return d.pat * gridSize; })
		   .attr("data", function(d) { return d.pat; })
		   .attr("rx", 4)
		   .attr("ry", 4)
		   .attr("class", "dim bordered total")
		   .attr("width", gridSize*3.2)
		   .attr("height", gridSize)
		   //.style("fill", function(d) { return colorScale(d.val);} )
		   .style("fill", "white" )
		   .style("cursor", "pointer")
		   .on("click", function (d) {
				if(leafletmap.getBrushMode()){
					d3.selectAll(".pixRectFrame")
						.style("fill", "none");
					d3.select("#RectFrame"+d.pat)
						.style("fill", "#D3D3D3");
					sankey.drawClusterStream(d.pat);
					coordinates("#index-pcoordinates", d.pat);
					return false;
				}
				if(!sankey.locked){
					d3.selectAll(".pixRectFrame")
						.style("fill", "none");
					d3.select("#RectFrame"+d.pat)
						.style("fill", "#D3D3D3");
					coordinates("#index-pcoordinates", d.pat);
					leafletmap.findTrajectory(d.pat);
					sankey.highlightCluster(d.pat);
				}
		   	})
		   	.on("mouseover", function (d){
		       d3.select("#Frame"+d.pat)
				  .style("opacity", "0.8");
		   	})
		   	.on("mouseout", function (d){
		       d3.select("#Frame"+d.pat)
				  .style("opacity", "0");
		   	})
		   	.append("text")
		   	.text(function(d) { return d.val;})
		   	.style("pointer-events", "none");

		d3.select("#pix")
		   .append("g")
		   .attr("transform", "translate(" + (pix_left/2-gridSize*0.4) + ", 0)")
		   .selectAll(".pixFrame")
		   .data(pattern)
		   .enter().append("rect")
		   .attr("id", function (d, i) { return "Frame"+i; })
		   .attr("x", 0)
		   .attr("y", function (d, i) { return i * gridSize; })
		   .attr("rx", 4)
           .attr("ry", 4)
		   .attr("width", 13.4*gridSize)
		   .attr("height", gridSize)
		   .attr("class", "pixFrame")
		   .attr("data", function (d, i) {
				return d;
			})
		   .style("fill", "none")
		   .style("stroke", "gray")
		   .style("opacity", "0");

        d3.select("#pix")
           .append("g")
           .attr("transform", "translate(" + (pix_left/2-gridSize*0.4) + ", 0)")
           .selectAll(".pixRectFrame")
           .data(pattern)
           .enter().append("rect")
           .attr("id", function (d, i) { return "RectFrame"+i; })
           .attr("x", 0)
           .attr("y", function (d, i) { return i * gridSize; })
           .attr("rx", 4)
           .attr("ry", 4)
           .attr("width", 13.4*gridSize)
           .attr("height", gridSize)
           .attr("class", "pixRectFrame")
           .attr("data", function (d, i) {
				return d;
			})
           .style("fill", "none")
           .style("opacity", "0.6")
           .style("pointer-events", "none");

		d3.select("#pix")
		   .append("g")
		   .attr("transform", "translate(" + (pix_left/2-gridSize*0.6) + ", 0)")
		   .selectAll(".pixTotal")
		   .data(patternVal)
		   .enter().append("text")
		   .text(function (d) { return parseInt(d.val); })
		   .style("pointer-events", "none")
		   .attr("data", function (d) { return parseInt(d.pat); })
		   .attr("x", 0)
		   .attr("y", function (d, i) { return i * gridSize; })
		   .attr("transform", "translate(" + 20 + "," + gridSize/1.5 + ")")
		   .attr("class", "pixTotal");
    };

	var sortPattern = function(){
		pattern; //Pattern ID
		patternData; //cluster people number
		patternVal; //cluster-features data
		sortField;
		sortType;
		//console.log(patternData);
		//console.log(patternVal);

		if(sortField === undefined || sortType === 0){
			return false;
		}
		var sortArray = [];
		patternData.forEach(function(d){
			if(d.dim === sortField){
				sortArray.push(d);
			}
		});
		sortArray.sort(function(a, b){
			if(sortType === 2){
				return a.val - b.val;
			}else{
				return b.val - a.val;
			}
		});
		console.log(sortArray);
		sortArray.forEach(function(d, i){
			d3.select(".pixLabel[data='" + d.pat + "']")
				.attr("y", i * gridSize);
			d3.select(".dim.total[data='" + d.pat + "']")
				.attr("y", i * gridSize);
			d3.selectAll(".dim.pixel[data='" + d.pat + "']")
				.attr("y", i * gridSize);
			d3.selectAll(".pixTotal[data='" + d.pat + "']")
				.attr("y", i * gridSize);
			d3.select(".pixFrame[data='" + d.pat + "']")
				.attr("y", i * gridSize);
			d3.select(".pixRectFrame[data='" + d.pat + "']")
				.attr("y", i * gridSize);

		});

	};

    pixChart();
	sortPattern();

}

// render("bpdy");

module.exports = render;
