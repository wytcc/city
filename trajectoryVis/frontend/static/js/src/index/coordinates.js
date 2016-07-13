//热力图
var util = require("util");

var fields = {
	AveLocX: 6,
	AveLocY: 7,
	AveSpeed: 2,
	ETrand: 0,
	Eunc: 1,
	HomeLocX: 8,
	HomeLocY: 9,
	MoveDis: 3,
	MoveRatio: 5,
	Rg: 4
};

var fieldsColor = ["#a6cee3", "#1f78b4", "#b2df8a", "#33a02c", "#fb9a99", "#e31a1c", "#fdbf6f", "#ff7f00", "#cab2d6", "#6a3d9a"];

var fields2 = [
	"AveLocX",
	"AveLocY",
	"AveSpeed",
	"ETrand",
	"Eunc",
	"HomeLocX",
	"HomeLocY",
	"MoveDis",
	"MoveRatio",
	"Rg"
];

function render(dom, type, time, userid, start, end) {
	var coord_width = $(dom).width(),
		coord_height = $(dom).height();

	d3.select(dom).select("svg").remove();
	d3.select(dom)
		.append("svg")
		.attr("id", "coord")
		.style("width", coord_width + "px")
		.style("height", coord_height + "px");

	var Bar_margin = {top: coord_height/5, right: coord_width/60, bottom: coord_height/8, left: coord_width/60},
		Bar_width = coord_width/10-Bar_margin.right-Bar_margin.left,
		Bar_height = coord_height/7*4;
	var Bar_len = Bar_margin.left+Bar_margin.right+Bar_width;

	var Bar_x = d3.scale.linear()
		.range([0, Bar_width]);
	var Bar_y = d3.scale.linear()
		.range([Bar_height, 0]);

	var Bar_xdomain;
	var Bar_ydomain;
	Bar_y.domain([0, 10]);

	var Bar_xAxis = d3.svg.axis()
		.scale(Bar_x)
		.orient("bottom");
	var Bar_yAxis = d3.svg.axis()
		.scale(Bar_y)
		// .ticks(10)
		.tickValues(0,0)
		// .tickPadding(0)
		// .tickValues(0,0)
		.orient("left");

	var Bar_name = [['Temporal correlated','Entropy'],['Temporal uncorrelated','Entropy'],
					['Average',' Speed'], ['Activity','  Mileage'],
					['Radius','of Gyration'],['Activity','  Radius'],
					['Centroid','Longtitude'],[' Centroid','Latitude'],
					['  Residence','Longtitude'],[' Residence','Latitude']
					];

	var Coord_num = 10, Bar_num = 10;
	//var Bar_max = 100;
	var Bar_max = [];
	var statistics = null;
	var path = '/statistics';
	if (!time && time!=0)
	{
		if (!type && type!=0) path = '/statisticsTotal';
		else path = '/statisticsWithoutTime';
	} 
	if (userid || userid == 0) path = '/statisticsTotal';
	//console.log(path);
	$.ajax({
		type: "GET",
		async: false,
		url: util.urlBase + path,
		data: {
			time: time,
			type: type
		},
		async: false,
		success: function(data){
			// console.log(data);
			statistics = data;
		},
		error: function(data){
			console.log(data);
		}
	});
	var i = -1;
	var Bar_data = [];
	for(var i = 0; i < Coord_num; i++) {
		Bar_data[i] = [];
		Bar_max[i] = 0;
		for (var j = 0; j < Bar_num; j++){
			var count = statistics[i * Coord_num + j].pointscounts;
			if(count > Bar_max[i]){
				Bar_max[i] = count;
			}
			Bar_data[i][j] = count;
		}
	}

	var fieldRanges = null;
	$.ajax({
		type: "GET",
		url: util.urlBase + '/getClusterRange',
		async: false,
		success: function(data){
			fieldRanges = data[0];
		},
		error: function(data){
			console.log(data);
		}
	});

	// 信息标题栏
	var coord_text = d3.select("#coord")
		.append("g")
		.attr("transform", "translate(" + (Bar_margin.left) + "," + Bar_margin.top/2 + ")");

	var time_text, type_text;
	if (time || time == 0) time_text = "Time range: "+time;
	else time_text = "Time range: full";
	if (type || type == 0) type_text = "Mobility pattern: "+type;
	else type_text = "Mobility pattern: all";

	var vectors_single;
	// 单个人特征值
	if (userid || userid == 0) {
		time_text = "Time range: full";
		type_text = "Mobility pattern: all";
		var Person_vertices = [];
		var coord_trun = [6,7,2,0,1,8,9,3,5,4];
		if(start && end){
			$.ajax({
				type: 'GET',
				url: util.urlBase + '/getFeatureByIdTime',
				async: false,
				data: {
					id: userid,
					stime: start,
					etime: end
				},
				success: function(data){
					vectors_single = data;
				},
				error: function(data){
					console.log(data);
				}
			});
		}else{
			$.ajax({
				type: "GET",
				url: util.urlBase + '/getPeopleFeature',
				async: false,
				data: {
					id: userid
				},
				success: function(data){
					try{
						vectors_single = data[0].featureavg.split(",");
					}catch(e){
						vectors_single = [0,0,0,0,0,0,0,0,0,0];
					}
				},
				error: function(data){
					console.log(data);
				}
			});
		}
		try{
			//vectors_single.forEach(function(d){
			//	var str = d.featureavg;
			//	for (var i = 0; i < 9; i++) {
			//		var pos = str.indexOf(",");
			//		var j = str.substring(0, pos);
			//		str = str.substring(pos+1, str.length);
			//		j = parseInt(j * 10);
			//		Person_vertices[coord_trun[i]] = [Bar_len*coord_trun[i], Bar_y(j) - Bar_height/20];
			//	}
			//	Person_vertices[coord_trun[i]] = [Bar_len*coord_trun[i], Bar_y(parseInt(str * 10)) - Bar_height/20];
			//});

            if(vectors_single.length !== 0){
                for (var i = 0; i < 10; i++) {
                    var val = vectors_single[i];
                    Person_vertices[coord_trun[i]] = [Bar_len*coord_trun[i], Bar_y(val*10) - Bar_height/20];
                }

                var line = d3.select("#coord")
                    .append("g")
                    .attr("transform", "translate(" + Bar_margin.left + "," + Bar_margin.top + ")");
                for (var i = 1; i < 10; i++)
                {
                    line.append("line")
                        .style({
                            stroke: 'grey',
                            "stroke-width": 2,
                            opacity: 0.5
                        })
                        .attr("x1", Person_vertices[i-1][0])
                        .attr("y1", Person_vertices[i-1][1])
                        .attr("x2", Person_vertices[i][0])
                        .attr("y2", Person_vertices[i][1]);
                }
            }
		}catch(e){
			console.log(e);
		}
	}

	coord_text.append("text")
		.text(time_text);
	coord_text.append("text")
		.attr("x", 200)
		.text(type_text);

	// var Person_vertices = [];
	//for (i = 0; i < Coord_num; i++) {}
	for (var field in fields) {
		var i = fields[field];
		var barName = Bar_name[i];
		var Bar_svg = d3.select("#coord")
			.append("g")
			.attr("transform", "translate(" + (Bar_margin.left + Bar_len * i) + "," + Bar_margin.top + ")");

		var fieldRange = fieldRanges[field] && JSON.parse(fieldRanges[field]);
		var ymin = fieldRange[0].toFixed(3), ymax = fieldRange[1].toFixed(3);
		Bar_xdomain = [0, Bar_max[i]];
		Bar_x.domain(Bar_xdomain);


		// 随机数
		// var j = parseInt(Math.random()*10);
		// while (Bar_data[i][j] == 0) j = parseInt(Math.random()*10);
		// Person_vertices[i] = [Bar_len*i, Bar_y(j) - Bar_height/20];

		//Bar X 轴
		Bar_svg.append("g")
			.attr("class", "x Bar_axis")
			.attr("transform", "translate(0," + Bar_height + ")")
			.style("opacity",0)
			.call(Bar_xAxis)
		.append("text")
			.attr("class", "label")
			.attr("x", Bar_width)
			.attr("y", -6)
			.style("text-anchor", "end")
			.text("");
		//Bar Y 轴
		// Bar_y.domain([ymin, ymax]);
		// var Bar_yAxis2 = Bar_yAxis;
		// Bar_yAxis2.scale(Bar_y2).ticks(3);
		// Bar_yAxis.tickValues([ymin,ymin/2.0+ymax/2.0,ymax]);
		Bar_svg.append("g")
			.attr("id", "y_g"+i)
			.attr("class", "y Bar_axis")
			.call(Bar_yAxis)
		.append("text")
			.attr("transform", "translate(" + 30 + "," + (Bar_height + 7) + ")")
			.attr("y", 8)
			.style("text-anchor", "end")
			.text(ymin);
		// Bar_y.domain([0, 10]);
		d3.select("#y_g"+i)
		.append("text")
			.attr("transform", "translate(" + 30 + "," + (-7) + ")")
			.style("text-anchor", "end")
			.text(ymax);
		d3.select("#y_g"+i)
		.append("line")
			.attr("x1", 0)
			.attr("y1", 0)
			.attr("x2", 0)
			.attr("y2", Bar_height)
			.style("stroke","grey")
			.style("shape-rendering","crispEdges")
			.style("opacity",0.3);
		for (j = 0; j < 10; j++)
		{
			d3.select("#y_g"+i)
		.append("line")
			.attr("x1", -4)
			.attr("y1", Bar_y(j))
			.attr("x2", 0)
			.attr("y2", Bar_y(j))
			.style("stroke","grey")
			.style("shape-rendering","crispEdges")
			.style("opacity",0.3);
		}
		for (j = 0; j < barName.length; j++)
			d3.select("#y_g"+i)
			.append("text")
				.attr("transform", "translate(" + (6 + (8-barName[j].length)*2) + "," + (Bar_height + 35 + 14*j) + ")")
				.text(barName[j]);

		var Rec_height = Bar_height/10;
		//Bar
		for (j = 0; j < Bar_num; j++)
		{
			Bar_svg.append("rect")
				.attr("id", "Bar_rect")
				.attr("class", "Bar_bar")
				//.attr("fill", fieldsColor[i])
				.attr("fill", "grey")
				.attr("opacity", util.opacityScale(0.1 * (j+1)))
				.attr("x", 0)
				.attr("width", Bar_x(Bar_data[i][j]) )
				.attr("y", Bar_y(j) - Rec_height )
				.attr("height", Rec_height);
		}
	}

	// 单个人轨迹
	// var line = d3.select("#coord")
	// 	.append("g")
	// 	.attr("transform", "translate(" + Bar_margin.left + "," + Bar_margin.top + ")");
	// for (var i = 1; i < 10; i++)
	// {
	// 	line.append("line")
	// 	.style({
	// 		stroke: 'red',
	// 		"stroke-width": 2,
	// 		opacity: 0.5
	// 	})
	// 	.attr("x1", Person_vertices[i-1][0])
	// 	.attr("y1", Person_vertices[i-1][1])
	// 	.attr("x2", Person_vertices[i][0])
	// 	.attr("y2", Person_vertices[i][1]);
	// }

	// 彩带
	var Bar_vertices = [];
	for (i = 0; i < Coord_num; i++)
	{
		var j = 0;
		while (Bar_data[i][j]==0 && j < Bar_num-1) j++;
		Bar_vertices.push([Bar_len*i, Bar_y(j)]);
		if (i == Coord_num-1) Bar_vertices.push([Bar_len*i+Bar_width, Bar_y(j)]);
	}
	for (i = Coord_num-1; i >= 0; i--)
	{
		var j = Bar_num - 1;
		while (Bar_data[i][j]==0 && j > 0) j--;
		if (i == Coord_num-1) Bar_vertices.push([Bar_len*i+Bar_width, Bar_y(j) - Rec_height]);
		Bar_vertices.push([Bar_len*i, Bar_y(j) - Rec_height]);
	}
	// console.log(Bar_vertices);
	//d3.select("#coord")
	//	.append("g")
	//	.attr("transform", "translate(" + Bar_margin.left + "," + Bar_margin.top + ")")
	//	.append('polygon')
	//	.style({
	//		fill: '#D3D3D3',
	//		opacity: 0.5
	//	})
	//	.attr('points',Bar_vertices);

	// head
	var Bar_top_margin = {top: 0, right: 50, bottom: 0, left: 10},
		Bar_top_width = coord_width,
		Bar_top_height = coord_height/8;

	var Bar_top_svg = d3.select("#coord")
			.append("g")
			.attr("transform", "translate(" + Bar_top_margin.left + "," + Bar_top_margin.top + ")");

}

// render("body");
module.exports = render;