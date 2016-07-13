/**
 * Created by huwanqi on 2016/3/21.
 */
var util = require("util");

var map;
var trajectoryGroup;
var container;
var distanceThreshold = 100;
var mapSvgDom = '#mapSvg';
var cList = [];
var cList1 = [];
var now = 0;
var pList = [];
var vertices = [];
var vertices2 = [];
var homeLoc;
var homeLocs;

var brushMode = false;

var pTrac = null;

//加载更多按钮所用变量
var getPeopleHomeResults;
var getPeopleHomeIndex;

var corner1, corner2, boundRect;

var leafletmap = function(dom) {
	container = dom;
	this.render();
};

var prototype = leafletmap.prototype;

prototype.render = function() {
	var that = this;
	var id = $(container).attr("id");
	//initialize map
	//	在div中创造map,设置地图中心和缩放级别
	map = L.map(id, {
		zoomControl: false,
		minZoom: 10,
		maxZoom: 16
			//	浙江台州市温岭附近
	}).setView([28.38, 121.21], 16);
	$(".leaflet-bottom.leaflet-right").remove()
		//	添加一个街道的图层
	L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png').addTo(map);
	map.fitBounds([
		[27.846675, 120.53695],
		[28.162664, 120.900696]
	]);
	map.doubleClickZoom.disable();
	/*
	 添加刷选按钮
	 */
	//var ourCustomControl = L.Control.extend({
	//    options: {
	//        position: 'topleft'
	//    },
	//    onAdd: function (map) {
	//        var container = L.DomUtil.create('div', 'leaflet-brush leaflet-bar leaflet-control');
	//        $(container).attr("title", "brush");
	//        $(container).html('<img src="./static/images/rect1.png">');
	//
	//        container.onclick = function(){
	//            $(container).addClass("clicked");
	//            brushMode = true;
	//            map.dragging.disable();
	//        };
	//        return container;
	//    }
	//});
	//map.addControl(new ourCustomControl());

	//选择地图区域																																																																																																																																																																																																																																																																																																																																		
	$(".regionBrush").on("click", function() {
		if($(this).hasClass("clicked")) {
			$(this).removeClass("clicked");
			brushMode = false;
			map.dragging.enable();
		} else {
			$(this).addClass("clicked");
			brushMode = true;
			map.dragging.disable();
		}
	});

	//显示地图使用帮助
	$(".showTips").on("click", function() {
		$(".mapTips").show();
		setTimeout(function() {
			$(".mapTips").fadeOut();
		}, 5000);
	});

	map.on("movestart", function() {
		$("#mapSvg").hide();
	});
	map.on("moveend", function() {
		that.updateSvg();
		$("#mapSvg").show();
	});
	//缩放
	map.on("zoomstart", function() {
		$("#mapSvg").hide();
	});
	map.on("zoomend", function() {
		that.updateSvg();
		$("#mapSvg").show();
	});
	//鼠标移到元素上并按下键
	map.on("mousedown", function(ev) {
		ev.originalEvent.preventDefault();
		if(brushMode) {
			resetBrush();
			resetSvg();
			corner1 = ev.latlng;
			//鼠标移动的位置
			map.on("mousemove", function(ev2) {
				corner2 = ev2.latlng;
				var bounds = [corner1, corner2];
				if(boundRect) {
					boundRect.setBounds(bounds);
				} else {
					boundRect = L.rectangle(bounds, {
						fillOpacity: 0.1,
						color: "#ff7800",
						weight: 1
					}).addTo(map);
				}
			});
			//鼠标移动结束后点的位置
			map.on("mouseup", function(ev3) {
				map.off("mousemove");
				map.off("mouseup");

				corner2 = ev3.latlng;
				var bounds = [corner1, corner2];
				if(boundRect) {
					var lat_max = bounds[0].lat > bounds[1].lat ? bounds[0].lat : bounds[1].lat;
					var lat_min = bounds[0].lat < bounds[1].lat ? bounds[0].lat : bounds[1].lat;
					var lng_max = bounds[0].lng > bounds[1].lng ? bounds[0].lng : bounds[1].lng;
					var lng_min = bounds[0].lng < bounds[1].lng ? bounds[0].lng : bounds[1].lng;

					$.ajax({
						type: 'get',
						url: util.urlBase + '/getPeopleHome',
						data: {
							longitude1: lng_min,
							longitude2: lng_max,
							latitude1: lat_min,
							latitude2: lat_max,
						},
						success: function(data) {
							$("#index-sidebar .tips").hide();
							$("#index-sidebar .result").show();
							$(".timeBrush.btn").hide();
							getPeopleHomeResults = data;
							getPeopleHomeIndex = 1;
							//右侧查询面板增加元素
							that.appendResults();
							$(".btn.showMore").unbind("click");
							$(".btn.showMore").on("click", function() {
								getPeopleHomeIndex++;
								if(getPeopleHomeResults.length <= getPeopleHomeIndex * 20) {
									$(".btn.showMore").hide();
								}
								that.appendResults();
							});
						},
						error: function() {},
					});

					$(".regionBrush").removeClass("clicked");
					brushMode = false;
					map.dragging.enable();
					//brushMode = false;
					//map.dragging.enable();
				}
			});
		}
	});
};

prototype.appendResults = function() {
	var that = this;
	var html = '';
	var useridlist = [];
	var homes = [];
	if(getPeopleHomeResults.length > getPeopleHomeIndex * 20) {
		$(".btn.showMore").show();
	} else {
		$(".btn.showMore").hide();
	}
	getPeopleHomeResults.forEach(function(d, i) {
		if(i >= getPeopleHomeIndex * 20) {
			return false;
		}
		//右边查询面板显示列表
		html += '<tr class="item"> <td>' + (i + 1) + '</td> <td class="userid">' + d.userid + '</td> <td>[' + d.homelocx.toFixed(2) + ', ' + d.homelocy.toFixed(2) + ']</td> </tr>';
		useridlist.push(d.userid);
		homes.push([d.homelocy, d.homelocx]);
	});
	var useridliststr = useridlist.join('-');
	$.ajax({
		type: 'get',
		url: util.urlBase + '/getPeopleByIDs',
		data: {
			useridlist: useridliststr
		},
		success: function(data2) {
			//console.log(data2);
			data2.forEach(function(d) {
				var path = JSON.parse(JSON.parse(d.clusters));
				//画桑葚图
				that.sankey.drawPeoplePath(path, d.userid);
			});
		},
		error: function() {},
	});
	homeLocs = homes;
	//在地图上面标记家的位置
	this.drawHomes();
	$("#index-sidebar .result table tbody").html(html);
};

prototype.findTrajectory = function(type, time) {
	var that = this;
	if(type && time) {
		$.ajax({
			type: "GET",
			url: util.urlBase + '/getTrajectoryByNode',
			data: {
				type: type,
				time: time
			},
			success: function(data) {
				that.drawTrajectory(data);
			}
		});
	} else if(type != undefined && !time) {
		$.ajax({
			type: "GET",
			url: util.urlBase + '/getTrajectoryByType',
			data: {
				type: type
			},
			success: function(data) {
				that.drawTrajectory(data);
			}
		});
	} else {
		that.drawTrajectory([]);
	}

};

prototype.drawTrajectory = function(tList, start, end) {
	resetSvg();
	//	搜索指定区域
	map.fitBounds([
		[27.846675, 120.53695],
		[28.162664, 120.900696]
	]);
	if(tList.length == 0) {
		console.warn("没有轨迹！");
		return false;
	}
	homeLoc = null;
	cList = [];
	pList = [];
	vertices = [];
	vertices2 = [];

	tList.forEach(function(t, tindex) {
		if(tindex > 50) {
			return false;
		}
		//轨迹条数限制
		if(t.distanceid > distanceThreshold) {
			return false;
		}
		var coordinates = (t.trajectory && JSON.parse(JSON.parse(t.trajectory)));
		//静止状态
		if(t.state === 0) {
			//画点
			var temp = [];
			coordinates.forEach(function(p, i) {
				var lat = p[1];
				var lng = p[0];
				//var time = p[2];
				//if(start && end && (time < start || time > end)){
				//    return false;
				//}
				cList.push({
					lat: lat,
					lng: lng
				});
				temp.push(L.latLng(lat, lng));

			});
			vertices2.push(temp);
		} else {
			//画轨迹
			var path = [];
			coordinates.forEach(function(p, i) {
				var lat = p[1];
				var lng = p[0];
				//var time = p[2];
				//if(start && end && (time < start || time > end)){
				//    return false;
				//}
				path.push(L.latLng(lat, lng));
				vertices.push(L.latLng(lat, lng));
			});
			pList.push(path);
		}
	});
	this.updateSvg();
};

//画单个人的轨迹，每个人的位置信息，开始，结束时间
prototype.drawPTrajectory = function(data, start, end) {
	console.log("drawPTrajectory");
	pTrac = data;
	resetSvg();
	//设置地图的缩放和比例
	map.fitBounds([
		//浙江省温州市瑞安市前河县
		[27.846675, 120.53695],
		//浙江省温州市乐清市双贤路
		[28.162664, 120.900696]
	]);
	var that = this;
	if(!data || data.length == 0) {
		console.warn("轨迹为空");
		return false;
	}
	homeLoc = null;
	cList = [];
	pList = [];
	vertices = [];
	vertices2 = [];
	data.forEach(function(d, tindex) {

		//add data into CList and path
		that.drawAllPTrajectory(d, tindex, start, end);
		//point into cList1
		//that.addPointToList1(d, tindex, start, end);

	});

	homeLoc = [data[0].HomeLocY, data[0].HomeLocX];

	//draw clcle and paths
	that.updateSvg();

	//draw move path
	that.drawMoveProjectory();

};

prototype.drawPointTragectory = function(circle) {
	console.log("drawPointTragectory");
	var p = map.latLngToContainerPoint([circle.lat, circle.lng]);
	var zoom = map.getZoom();
	var canvas = d3.select(mapSvgDom).select(".primitives");
	canvas.append("circle")
		.attr("class", "primitive")
		.style("pointer-events", "visiblePainted")
		.attr("r", Math.sqrt(zoom) * zoom * 0.1)
		.attr("fill", "#000")
		//.attr("stroke-width", 1)
		//.attr("stroke", "white")
		//.attr("fill-opacity", 0.6)
		.attr("transform", function() {
			return "translate(" + p.x + "," + p.y + ")";
		});
};

//prototype.addPointToList1 = function(d, tindex, start, end) {
//	//对每个轨迹数据设置停留时间；
//	var coordinates = d.records;
//	coordinates.forEach(function(p, i) {
//		var lat = p[1];
//		var lng = p[0];
//		var time = p[2];
//		//console.log(new Date(time));
//		if(start && end && (time < start || time > end)) {
//			return false;
//		}
//		//point to cList1
//		cList1.push({
//			lat: lat,
//			lng: lng
//		});
//
//	});
//
//};

prototype.drawAllPTrajectory = function(d, tindex, start, end) {

	//对每个轨迹数据设置停留时间；
	if(d.movestate == 1) {
		//画线
		var coordinates = d.records;
		var path = [];
		var preX = null;
		var preY = null;
		var startIndex = null;
		var endIndex = null;
		coordinates.forEach(function(p, i) {
			var lat = p[1];
			var lng = p[0];
			var time = p[2];
			//console.log(new Date(time));
			if(start && end && (time < start || time > end)) {
				return false;
			}
			if(startIndex != null) {
				endIndex = i;
			} else {
				startIndex = i;
			}
			//画路径,以精度和纬度表示地理坐标
			path.push(L.latLng(lat, lng));
			//
			vertices.push(L.latLng(lat, lng));
		});

		if(startIndex != null && startIndex > 0) {
			//first
			var p1 = coordinates[startIndex - 1];
			//second
			var p2 = coordinates[startIndex];
			var lng1 = p1[0];
			var lng2 = p2[0];
			var lat1 = p1[1];
			var lat2 = p2[1];
			var time1 = p1[2];
			var time2 = p2[2];
			var scale = d3.scale.linear().range([lat1, lat2]).domain([time1, time2]);
			var lat = scale(start);
			scale = d3.scale.linear().range([lng1, lng2]).domain([time1, time2]);
			var lng = scale(start);
			//向数组中添加第一个元素
			path.unshift(L.latLng(lat, lng));
			vertices.push(L.latLng(lat, lng));
		}
		if(endIndex != null && endIndex < coordinates.length - 1) {
			//before last
			var p1 = coordinates[endIndex];
			//last
			var p2 = coordinates[endIndex + 1];
			var lng1 = p1[0];
			var lng2 = p2[0];
			var lat1 = p1[1];
			var lat2 = p2[1];
			var time1 = p1[2];
			var time2 = p2[2];
			var scale = d3.scale.linear().range([lat1, lat2]).domain([time1, time2]);
			var lat = scale(end);
			scale = d3.scale.linear().range([lng1, lng2]).domain([time1, time2]);
			var lng = scale(end);
			//移动的线集
			vertices.push(L.latLng(lat, lng));
		}
		pList.push(path);

	} else {
		//画点
		var coordinates = d.records;
		var temp = [];
		coordinates.forEach(function(p, i) {
			var lat = p[1];
			var lng = p[0];
			var time = p[2];
			if(start && end && (time < start || time > end)) {
				return false;
			}
			//point
			cList.push({
				lat: lat,
				lng: lng
			});
			temp.push(L.latLng(lat, lng));
		});
		//停留的点集
		vertices2.push(temp);
	}

}

//画单个人的轨迹，每个人的位置信息，开始，结束时间
prototype.drawPTrajectory_origin = function(data, start, end) {
	console.log("drawPTrajectory");
	pTrac = data;
	resetSvg();
	//设置地图的缩放和比例
	map.fitBounds([
		[27.846675, 120.53695],
		[28.162664, 120.900696]
	]);
	var that = this;
	if(!data || data.length == 0) {
		console.warn("轨迹为空");
		return false;
	}
	homeLoc = null;
	cList = [];
	pList = [];
	vertices = [];
	vertices2 = [];
	data.forEach(function(d, tindex) {
		//if(tindex > 10){
		//    return false;
		//}
		$(this).delay(500);
		console.log("delay");
		if(d.movestate == 1) {
			//画线
			var coordinates = d.records;
			var path = [];
			var preX = null;
			var preY = null;
			var startIndex = null;
			var endIndex = null;
			coordinates.forEach(function(p, i) {
				var lat = p[1];
				var lng = p[0];
				var time = p[2];
				//console.log(new Date(time));
				if(start && end && (time < start || time > end)) {
					return false;
				}
				if(startIndex != null) {
					endIndex = i;
				} else {
					startIndex = i;
				}
				//画路径
				path.push(L.latLng(lat, lng));
				//
				//vertices.push(L.latLng(lat, lng));
			});

			if(startIndex != null && startIndex > 0) {
				var p1 = coordinates[startIndex - 1];
				var p2 = coordinates[startIndex];
				var lng1 = p1[0];
				var lng2 = p2[0];
				var lat1 = p1[1];
				var lat2 = p2[1];
				var time1 = p1[2];
				var time2 = p2[2];
				var scale = d3.scale.linear().range([lat1, lat2]).domain([time1, time2]);
				var lat = scale(start);
				scale = d3.scale.linear().range([lng1, lng2]).domain([time1, time2]);
				var lng = scale(start);
				path.unshift(L.latLng(lat, lng));
				vertices.push(L.latLng(lat, lng));
			}
			if(endIndex != null && endIndex < coordinates.length - 1) {
				var p1 = coordinates[endIndex];
				var p2 = coordinates[endIndex + 1];
				var lng1 = p1[0];
				var lng2 = p2[0];
				var lat1 = p1[1];
				var lat2 = p2[1];
				var time1 = p1[2];
				var time2 = p2[2];
				var scale = d3.scale.linear().range([lat1, lat2]).domain([time1, time2]);
				var lat = scale(end);
				scale = d3.scale.linear().range([lng1, lng2]).domain([time1, time2]);
				var lng = scale(end);
				//移动的线集
				vertices.push(L.latLng(lat, lng));
			}
			pList.push(path);
		} else {
			//画点
			var coordinates = d.records;
			var temp = [];
			coordinates.forEach(function(p, i) {
				var lat = p[1];
				var lng = p[0];
				var time = p[2];
				if(start && end && (time < start || time > end)) {
					return false;
				}
				cList.push({
					lat: lat,
					lng: lng
				});
				temp.push(L.latLng(lat, lng));
			});
			//停留的点集
			vertices2.push(temp);
		}
	});

	homeLoc = [data[0].HomeLocY, data[0].HomeLocX];

	that.updateSvg();

};

prototype.drawMoveProjectory = function() {

	var zoom = map.getZoom();
	var that = this;

	pList.forEach(function(path) {

		cList1 = [];

		if(path.length != 0) {

			path.forEach(function(p) {
				var point = map.latLngToContainerPoint(p);

				cList1.push({
					x: point.x,
					y: point.y
				});

			});

			//			var q = Math.sqrt(zoom) * zoom * 0.5;
			//			var firstPoint = cList1[0];
			//			var lastPoint = cList1[cList1.length - 1];
			//			var k = Math.atan((lastPoint.y - firstPoint.y) / (lastPoint.x - firstPoint.x));
			//			var offsetX = q * Math.sin(k);
			//			var offsetY = -q * Math.cos(k);

			cList1.forEach(function(c1, cIndex) {

				setTimeout(function() {

					//					if(cIndex == 0) {
					//						console.log("q:" + q);
					//						console.log("firstPoint:" + firstPoint);
					//						console.log("lastPoint:" + lastPoint);
					//						console.log("k:" + k);
					//						console.log("offsetY:" + offsetY);
					//						console.log("offsetX:" + offsetX);
					//					}
					//delete pre and add new circle
					//					that.drawCircle1(c1, cIndex, cList1.length, offsetX, offsetY);
					that.drawCircle1(c1, cIndex, cList1.length);
				}, (cIndex * 3000));

			})

		}

	})

};

prototype.getPTrac = function() {
	return pTrac;
};

prototype.clearTrajectory = function() {
	resetSvg();
};

var resetSvg = function() {
	d3.selectAll("#mapSvg .primitives").selectAll("*").remove();
	d3.selectAll("#mapSvg .hull").selectAll("*").remove();
	cList = [];
	pList = [];
	vertices = [];
	vertices2 = [];
};

prototype.updateSvg = function() {
	//delete all cicle
	d3.selectAll("#mapSvg .primitives").selectAll("*").remove();
	//delete all hull
	d3.selectAll("#mapSvg .hull").selectAll("*").remove();
	var that = this;
	that.drawHulls();

	//redraw path
	pList.forEach(function(p, i) {
		that.drawPath(p)
	});
	//redraw cicle
	cList.forEach(function(c) {
		that.drawCircle(c)
	});

	//redraw homes
	this.drawHome();
	this.drawHomes();
};

prototype.drawHome = function() {
	if(!homeLoc) {
		return false;
	}
	//lat loc to map canvas
	var coor = converCoor(homeLoc);
	d3.selectAll(".homeLoc").remove();
	var canvas = d3.select(mapSvgDom).select(".primitives");
	canvas.append("svg:image")
		.attr("xlink:href", "./static/images/home.png")
		.attr("class", "homeLoc")
		.attr("width", 10)
		.attr("height", 10)
		.attr("transform", function() {
			return "translate(" + (coor.x - 5) + "," + (coor.y - 5) + ")";
		})
		.append("title")
		.text("home");
};

prototype.drawHomes = function() {
	if(!homeLocs) {
		return false;
	}
	d3.selectAll(".homeLoc").remove();
	var canvas = d3.select(mapSvgDom).select(".primitives");
	homeLocs.forEach(function(d) {
		var coor = converCoor(d);
		canvas.append("svg:image")
			.attr("xlink:href", "./static/images/home.png")
			.attr("class", "homeLoc")
			.attr("width", 10)
			.attr("height", 10)
			.attr("transform", function() {
				return "translate(" + (coor.x - 5) + "," + (coor.y - 5) + ")";
			})
			.append("title")
			.text("home");
	});
};

//画单个人的外面包围线
prototype.drawHulls2 = function() {
	var getAlpha = function(zoom) {
		return zoom * zoom * 10;
	};
	var zoom = map.getZoom();
	var alpha = getAlpha(zoom);
	var temp = [];
	for(var i = 0; i < vertices.length; i++) {
		var coor = converCoor(vertices[i]);
		//canvas x and y
		temp.push([coor.x, coor.y]);
	}
	var offset = function(a, dx, dy) {
			return a.map(function(d) {
				return [d[0] + dx, d[1] + dy];
			});
		},

		dsq = function(a, b) {
			var dx = a[0] - b[0],
				dy = a[1] - b[1];
			return dx * dx + dy * dy;
		},

		asq = alpha * alpha,

		//网状条
		mesh = d3.geom.delaunay(offset(temp, 0, 0)).filter(function(t) {
			return dsq(t[0], t[1]) < asq && dsq(t[0], t[2]) < asq && dsq(t[1], t[2]) < asq;
		});

	var canvas = d3.select(mapSvgDom).select(".hull");
	canvas.selectAll(".alphaHull")
		.data(mesh)
		.enter().append("path")
		.attr("class", "alphaHull")
		.attr("d", function(d) {
			return "M" + d.join("L") + "Z";
		});
	//hull.datum(d3.geom.hull(temp)).attr("d", function(d) { return "M" + d.join("L") + "Z"; });
	//this.drawHulls2();
};

//画画全部的外面的包围线，在整条路径的每个点的经纬度增加随机单位大小的距离
prototype.drawHulls = function() {
	var temp = [];
	for(var i = 0; i < vertices.length; i++) {
		var coor = converCoor(vertices[i]);
		temp.push([coor.x + 1 * Math.random(), coor.y + 1 * Math.random()]);
		temp.push([coor.x + 1 * Math.random(), coor.y + 1 * Math.random()]);
	}
	if(temp.length > 2) {
		var canvas = d3.select(mapSvgDom).select("g.hull");
		var hull = canvas.append("path")
			.attr("class", "hull");
		hull.datum(d3.geom.hull(temp)).attr("d", function(d) {
			//d.push(d[0]);
			//var lineFunction = d3.svg.line()
			//    .x(function(d) { return d[0]; })
			//    .y(function(d) { return d[1]; })
			//    .interpolate("basic");
			//return lineFunction(d);
			return "M" + d.join("L") + "Z";
		});
	}

	//	需要画点的人物轨迹
	vertices2.forEach(function(group) {
		var temp = [];
		for(var i = 0; i < group.length; i++) {
			var coor = converCoor(group[i]);
			if(i == 0) {
				temp.push([coor.x + 1 * Math.random(), coor.y + 1 * Math.random()]);
				temp.push([coor.x - 1 * Math.random(), coor.y - 1 * Math.random()]);
			}
			temp.push([coor.x + 1 * Math.random(), coor.y + 1 * Math.random()]);
		}
		if(temp.length == 0) {
			return false;
		}
		var canvas = d3.select(mapSvgDom).select("g.hull");
		var hull = canvas.append("path")
			.attr("class", "hull2");
		hull.datum(d3.geom.hull(temp)).attr("d", function(d) {
			//d.push(d[0]);
			//var lineFunction = d3.svg.line()
			//    .x(function(d) { return d[0]; })
			//    .y(function(d) { return d[1]; })
			//    .interpolate("basic");
			//return lineFunction(d);
			return "M" + d.join("L") + "Z";
		});
	});
};

prototype.drawCircle1 = function(c1, cIndex, length) {
	//prototype.drawCircle1 = function(c1, cIndex, length, offsetX, offsetY) {
	var p = c1;
	var zoom = map.getZoom();
	var canvas = d3.select(mapSvgDom).select(".primitives");

	var colors = ["green", "blue", "#EE00EE"];
	var color;
	//start
	if(cIndex == 0) {
		color = colors[0];
	} else if(cIndex == length - 1) {
		//end
		color = colors[2];
	} else {
		//midlle
		color = colors[1];
	}

	//destroy pre circle	
	d3.select(mapSvgDom).select(".primitives .primitive-move").remove();

	//	point = (p.x + offsetX) + "," + (p.y + offsetY) + " " + (p.x - offsetX) + "," + (p.y - offsetY) + " " + (p.x - offsetY) + "," + (p.y - offsetX);

	//	console.log("point:" + point);

	//	if(point.length <= 0) {
	//		console.error("point is null");
	//		return;
	//	}
	//	canvas.append('polygon')
	//		.attr({
	//			points: point
	//		})
	//		.attr("class", "primitive-move")
	//		.style("pointer-events", "visiblePainted")
	//		.attr("fill", color);

	canvas.append("circle")
		.attr("class", "primitive-move")
		.style("pointer-events", "visiblePainted")
		.attr("r", Math.sqrt(zoom) * (zoom) * 0.1)
		.attr("fill", color)
		.attr("transform", function() {
			console.log("p.x:" + p.x + "\tp.y:" + p.y);
			return "translate(" + p.x + "," + p.y + ")";
		});

};

//画点
prototype.drawCircle = function(circle) {
	//	console.log("drawCircle");
	var p = map.latLngToContainerPoint([circle.lat, circle.lng]);
	var zoom = map.getZoom();
	var canvas = d3.select(mapSvgDom).select(".primitives");
	canvas.append("circle")
		.attr("class", "primitive")
		.style("pointer-events", "visiblePainted")
		.attr("r", Math.sqrt(zoom) * zoom * 0.1)
		.attr("fill", "#FF5D15")
		//.attr("stroke-width", 1)
		//.attr("stroke", "white")
		//.attr("fill-opacity", 0.6)
		.attr("transform", function() {
			return "translate(" + p.x + "," + p.y + ")";
		});
};

//画路径
prototype.drawPath = function(path) {
	if(path.length == 0) {
		return false;
	}
	var canvas = d3.select(mapSvgDom).select(".primitives");
	//lat to container
	var sp = map.latLngToContainerPoint(path[0]);
	var dd = 'M ' + sp.x + ' ' + sp.y;
	var points = [];
	path.forEach(function(p) {
		var point = map.latLngToContainerPoint(p);
		dd += "L " + point.x + ' ' + point.y;
		points.push([point.x, point.y]);
	});
	var lineFunction = d3.svg.line()
		.x(function(d) {
			return d[0];
		})
		.y(function(d) {
			return d[1];
		})
		.interpolate("cardinal");
	//draw a line of points on path 
	canvas.append("path")
		.attr("class", "primitive")
		.style("pointer-events", "visiblePainted")
		.attr("fill", "none")
		.attr("opacity", 1)
		.attr("d", function() {
			return lineFunction(points);
		})
		.attr("stroke-width", 2)
		.attr("stroke", "#EAFF15");

	//var zoom = map.getZoom();
	//if(zoom > 12){
	//    path.forEach(function(p){
	//        var point = map.latLngToContainerPoint(p);
	//        canvas.append("circle")
	//            .attr("class", "primitive")
	//            .style("pointer-events", "visiblePainted")
	//            .attr("r", 2)
	//            .attr("fill", "#FF7300")
	//            //.attr("stroke-width", 1)
	//            //.attr("stroke", "white")
	//            //.attr("fill-opacity", 0.6)
	//            .attr("transform", function(){
	//                return "translate(" + point.x + "," + point.y + ")";
	//            });
	//    });
	//}
};

prototype.getBrushMode = function() {
	return brushMode;
};

prototype.clearBrush = function() {
	brushMode = false;
	homeLocs = null;
	map.dragging.enable();
	$("#leaflet-brush").removeClass("clicked");
	boundRect && map.removeLayer(boundRect);
	boundRect = null;
};

prototype.setHomeLocs = function(locs) {
	homeLocs = locs;
};

var resetBrush = function() {
	$(".track").remove();
};

var converCoor = function(latlng) {
	return map.latLngToContainerPoint(latlng);
};

module.exports = leafletmap;