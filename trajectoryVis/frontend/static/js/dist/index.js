webpackJsonp([1],[
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Created by huwanqi on 2016/3/15.
	 */
	var util = __webpack_require__(1);
	var Leafletmap = __webpack_require__(2);
	var Sankey = __webpack_require__(3);
	var coordinates = __webpack_require__(6);
	var pixelmap = __webpack_require__(7);
	
	$(document).ready(function() {
		//	set pixelmap graph legend
		$("#pixelmap-legend .item").each(function(d, dom) {
			var move = $(dom).attr("data");
			$(dom).css({
				background: "rgb(227, 26, 28)",
				opacity: move
			});
		});
		//	set sankey graph legend
		$("#sankey-legend1 .item").each(function(d, dom) {
			var move = $(dom).attr("data");
			$(dom).css({
				background: "#75DAB3",
				opacity: util.opacityScale(move)
			});
		});
		//$("#sankey-legend2 .item").each(function(d, dom){
		//    var headcount = $(dom).attr("data");
		//    $(dom).css({
		//        background: "#75DAB3",
		//        height: headcount
		//    });
		//});
		//初始化地图
		var leafletmap = new Leafletmap("#index-map");
		//初始化sankey图
		var sankey = new Sankey("#index-sankey");
	
	//	set interaction
		sankey.leafletmap = leafletmap;
		leafletmap.sankey = sankey;
	
		//初始化平行坐标
		coordinates("#index-pcoordinates");
		//初始化像素图
		pixelmap("#index-pixelmap", leafletmap, sankey);
	
		$("body").on("dblclick", "#index-sankey svg, #pixdiv, " +
			"#index-pcoordinates svg",
			function() {
				if (!sankey.locked) {
					resetWithoutLock();
				}
			});
	
		document.onselectstart = function() {
			return false;
		};
	
		//	桑葚图的时间刷点击
		$(".timeBrush span").on("click", function() {
			//var brushSwitch = $(this).find(".glyphicon");
			//if(brushSwitch.hasClass("glyphicon-remove")){
			//    $(this).removeClass("btn-danger");
			//    $(this).addClass("btn-success");
			//    brushSwitch.removeClass("glyphicon-remove");
			//    brushSwitch.addClass("glyphicon-ok");
			//    sankey.addBrush();
			//}else{
			//    $(this).addClass("btn-danger");
			//    $(this).removeClass("btn-success");
			//    brushSwitch.removeClass("glyphicon-ok");
			//    brushSwitch.addClass("glyphicon-remove");
			//    sankey.clearBrush();
			//    var pTrac = leafletmap.getPTrac();
			//    leafletmap.drawPTrajectory(pTrac);
			//}
			if ($(".timeBrush").hasClass("selected")) {
				$(".timeBrush").removeClass("selected");
				sankey.clearBrush();
				var pTrac = leafletmap.getPTrac();
				leafletmap.drawPTrajectory(pTrac);
				return false;
			}
			if (!$(this).find("span").hasClass("disable")) {
				sankey.addBrush();
				$(".timeBrush").addClass("selected");
				return false;
			}
		});
	
		$(".btn.clear").on("click", function() {
			resetWithLock();
			$(".multiChoose").removeClass("clicked");
			$(".regionBrush").removeClass("clicked");
			sankey.setMultiChooseMode(false);
			$("#index-sidebar .tips").hide();
			$("#index-sidebar .result").hide();
			leafletmap.clearBrush();
		});
	
		$(".btn.search").on("click", function() {
			resetWithoutLock();
			var id = $("input.peopleID").val();
			//var testID = "460005876051371";
			sankey.locked = 1;
			$.ajax({
				type: 'GET',
				url: util.urlBase + '/getPersonPath',
				data: {
					id: id
				},
				success: function(data) {
					if (data.length == 0) {
						return false;
					}
					var userid = JSON.parse(JSON.parse(data[0].userid));
					var path = JSON.parse(JSON.parse(data[0].clusters));
					sankey.drawPeoplePath(path, userid);
				},
				error: function(data) {
					console.log(data);
				}
			});
			coordinates("#index-pcoordinates", 0, 0, id);
			$.ajax({
				type: 'GET',
				url: util.urlBase + '/getPersonTrac',
				data: {
					id: id
				},
				success: function(data) {
					if (data.length == 0) {
						$("#index-sidebar .tips").show();
						$("#index-sidebar .result").hide();
						return false;
					}
					leafletmap.drawPTrajectory(data);
					$("#index-sidebar .tips").hide();
					$("#index-sidebar .result").show();
					var html = '<tr class="item"> <td>1</td> <td class="userid">' + data[0].userid + '</td> <td>[' + data[0].HomeLocX.toFixed(2) + ', ' + data[0].HomeLocY.toFixed(2) + ']</td> </tr>';
					$("#index-sidebar .result table tbody").html(html);
					$(".btn.showMore").hide();
				},
				error: function(data) {
					console.log(data);
				}
			});
			$(".timeBrush span").removeClass("disable");
		});
	
		$("body").on("click", ".result table .item", function() {
			d3.selectAll(".track").attr("stroke-width", 2).attr("stroke", util.transitionColor);
			if ($(this).hasClass("success")) {
				$(this).removeClass("success");
				//$(".timeBrush.btn").hide();
				$(".timeBrush span").addClass("disable");
				//TODO
			} else {
				$(".timeBrush span").removeClass("disable"); //enable time brush
				$(".result table .item").removeClass("success");
				$(this).addClass("success");
				var userid = $(this).find(".userid").html();
				d3.selectAll(".track[userid='" + userid + "']").attr("stroke-width", 6).attr("stroke", util.ptransitionColorHighlight);
				d3.selectAll(".track[userid='" + userid + "']").each(function() {
					this.parentNode.appendChild(this);
				});
				leafletmap.setHomeLocs(null);
				//draw this person's trajectory
				$.ajax({
					type: 'GET',
					url: util.urlBase + '/getPersonTrac',
					data: {
						id: userid
					},
					success: function(data) {
						leafletmap.drawPTrajectory(data);
					},
					error: function(data) {
						console.log(data);
					}
				});
				coordinates("#index-pcoordinates", 0, 0, userid);
			}
		});
	
		function resetWithoutLock() {
			d3.selectAll(".nodeGroup rect").attr("stroke", "white");
			d3.selectAll(".linkGroup .link").attr("opacity", 0.8);
			leafletmap.clearTrajectory();
			d3.selectAll(".nodeGroup rect").each(function() {
				var move = d3.select(this).attr("move");
				d3.select(this).attr("opacity", util.opacityScale(move)).classed("selected", false).classed("selected2th", false);
			});
			//初始化平行坐标
			d3.selectAll("g.nodeGroup polygon").remove();
			d3.selectAll("g.flowGroup polygon").attr("visibility", "hidden");
			coordinates("#index-pcoordinates");
			pixelmap("#index-pixelmap", leafletmap, sankey);
		}
	
		function resetWithLock() {
			$("input.peopleID").val("");
			sankey.locked = 0;
			//清空一个人的转移轨迹
			$(".timeBrush").removeClass("selected")
			$(".timeBrush span").addClass("disable");
			$(".track").remove();
			sankey.clearBrush();
			d3.selectAll(".nodeGroup rect").attr("stroke", "white");
			d3.selectAll(".linkGroup .link").attr("opacity", 0.8);
			leafletmap.clearTrajectory();
			//d3.selectAll(".nodeGroup rect").attr("opacity", 1).classed("selected", false).classed("selected2th", false);
			d3.selectAll(".nodeGroup rect").each(function() {
				var move = d3.select(this).attr("move");
				d3.select(this).attr("opacity", util.opacityScale(move)).classed("selected", false).classed("selected2th", false);
			});
			//初始化平行坐标
			d3.selectAll("g.nodeGroup polygon").remove();
			d3.selectAll("g.flowGroup polygon").attr("visibility", "hidden");
			coordinates("#index-pcoordinates");
			pixelmap("#index-pixelmap", leafletmap, sankey);
		}
	
	});

/***/ },
/* 1 */,
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Created by huwanqi on 2016/3/21.
	 */
	var util = __webpack_require__(1);
	
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

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var util = __webpack_require__(1);
	var nodeData = __webpack_require__(4);
	var matrixes = __webpack_require__(5);
	var coordinates = __webpack_require__(6);
	var clusters = nodeData.clusters;
	var columns = [];
	var timePoints = 84;
	var clustersNum = 20;
	var barPadding = 5;
	var groupPadding = 40;
	var barWidth = 10;
	var padding = 80;
	
	var threshold = 0.3;
	var thresholdMin = 0.4;
	var thresholdMax = 0.6;
	var tranformMax = 0;
	var svgPadding = [20, 10];
	
	var ySum = [];
	var startDate = new Date("2014-01-21 00:00:00");
	var endDate = new Date("2014-01-28 00:00:00");
	var timeGap = 1000 * 60 * 60 * 2;
	var container;
	
	var multiChooseMode = false;
	var selectedNode = {};
	
	var sankey = function(dom) {
		container = dom;
		this.render();
	};
	
	var getPeopleHomeResults;
	var getPeopleHomeIndex;
	
	var globalColors = [];
	var flowColors = ["#dddddd", "#bbbbbb", "#999999"];
	//var stateColors = ["#2ca25f", "#99d8c9", "#e5f5f9"];
	var stateColors = ["#75DAB3", "#99d8c9", "#e5f5f9"];
	var stateVals = [0.1, 0.9];
	
	var prototype = sankey.prototype;
	
	prototype.render = function() {
		var that = this;
		var width = barWidth * timePoints + padding * (timePoints - 1) + 40;
		var containerWidth = $(container).width();
		var svg = $(container).find("svg");
		if (width > containerWidth) {
			svg.width(width);
			$(container).find("hr").width(width);
		} else {
			svg.width(containerWidth);
			$(container).find("hr").width(width);
			barWidth = 3 * (containerWidth / 1082);
			padding = 10 * (containerWidth / 1082);
		}
	
		$.ajax({
			type: "GET",
			url: util.urlBase + '/getNodes',
			async: false,
			success: function(data) {
				data.forEach(function(d) {
					var temp = {
						cluster: d.clusterid,
						col: d.timeindex,
						val: parseFloat(d.peoplecount),
						move: parseFloat(d.percentage)
					};
					if (!columns[d.timeindex]) {
						columns[d.timeindex] = [];
					}
					columns[d.timeindex][d.clusterid] = temp;
				});
			},
			error: function(data) {
				console.log(data);
			}
		});
	
		columns.forEach(function(d, i) {
			d.sort(function(a, b) {
				return b.move - a.move;
			});
			that.drawColumn(d, i);
		});
	
		var level2 = [];
		for (var i = 0; i < columns.length; i++) {
			var col = columns[i];
			for (var j = 0; j < col.length; j++) {
				if (col[j].move <= stateVals[1]) {
					level2.push(j);
					break;
				}
			}
		}
	
		var level3 = [];
		for (var i = 0; i < columns.length; i++) {
			var col = columns[i];
			for (var j = 0; j < col.length; j++) {
				if (col[j].move <= stateVals[0]) {
					level3.push(j);
					break;
				}
			}
		}
	
		var top1 = [];
		for (var i = 0; i < 84; i++) {
			top1.push(0);
		}
		drawStateStream(top1, level2, 0);
	
		var top2 = [];
		for (var i = 0; i < 84; i++) {
			top2.push((level2[i] + 1 > 19 ? 19 : level2[i] + 1));
		}
		drawStateStream(top2, level3, 1);
	
		var top3 = [];
		for (var i = 0; i < 84; i++) {
			top3.push((level3[i] + 1 > 19 ? 19 : level3[i] + 1));
		}
		var bottom3 = [];
		for (var i = 0; i < 84; i++) {
			bottom3.push(19);
		}
		drawStateStream(top3, bottom3, 2);
	
		computeLinks(matrixes);
		$("#slider-range-max").slider({
			range: true,
			min: 0,
			max: 1000,
			values: [thresholdMin * 1000, thresholdMax * 1000],
			slide: function(event, ui) {
				//$( "#amount" ).val( ui.value );
				$("#amount_min").val((ui.values[0] / 1000).toFixed(2));
				$("#amount_max").val((ui.values[1] / 1000).toFixed(2));
			},
			stop: function(event, ui) {
				thresholdMin = ui.values[0] / 1000;
				thresholdMax = ui.values[1] / 1000;
				computeLinks(matrixes);
			}
		});
		$("#amount_min").val(($("#slider-range-max").slider("values", 0) / 1000).toFixed(2));
		$("#amount_max").val(($("#slider-range-max").slider("values", 1) / 1000).toFixed(2));
	
		$(".multiChoose").on("click", function() {
			multiChooseMode = true;
			$("#index-sankey svg").dblclick();
			$(this).addClass("clicked");
			//hide all transition link
			d3.selectAll(".linkGroup .link").attr("opacity", 0);
		});
	};
	
	prototype.drawColumn = function(column, index) {
		var that = this;
		var svg = $(container).find("svg");
		var height = svg.height();
		var canvas = d3.select(svg[0])
			.select("g.nodeGroup")
			.attr("transform", "translate(" + svgPadding[0] + ", " + svgPadding[1] + ")");
		var left = index * (barWidth + padding);
		var sum = 0;
		column.forEach(function(d) {
			sum += d.val;
		});
		ySum.push(sum);
		var y = d3.scale.linear().domain([0, sum]).range([5, height - groupPadding * 2 - clustersNum * 6 - (clustersNum - 1) * barPadding - 50]);
		var flag1th = true;
		var flag2th = true;
		var counter = 0;
		var colors = d3.scale.category20();
		globalColors = [];
		var moveColor = d3.scale.linear()
			.domain([1, 0.5, 0])
			.range(stateColors);
		column.forEach(function(d, i) {
			canvas.append("rect")
				.attr("cluster", d.cluster)
				.attr("row", i)
				.attr("col", d.col)
				.attr("size", d.val)
				.attr("move", d.move)
				.attr("x", left)
				.attr("y", counter)
				.attr("width", barWidth)
				.attr("height", y(d.val))
				.attr("stroke", "none")
				//.attr("stroke-width", 3)
				.attr("fill", function() {
					globalColors.push(colors(i));
					//return moveColor(d.move);
					return stateColors[0];
				})
				.attr("opacity", function() {
					return util.opacityScale(d.move);
				})
				.on("click", function() {
					d3.event.stopPropagation();
	
					if (!multiChooseMode) {
						var cluster = d3.select(this).attr("cluster");
						var col = d3.select(this).attr("col");
						d3.selectAll(".nodeGroup rect").classed("selected2th", false);
						d3.select(this).classed("selected2th", true);
						that.leafletmap.findTrajectory(cluster, col);
						coordinates("#index-pcoordinates", cluster, col);
					} else {
						var cluster = d3.select(this).attr("cluster");
						var col = d3.select(this).attr("col");
						var key = col + ',' + cluster;
						selectedNode[key] = !selectedNode[key];
						d3.select(this).classed("selected2th", selectedNode[key]);
						var all = [];
						for (var k in selectedNode) {
							if (selectedNode[k]) {
								all.push(k);
							}
						}
						if (all.length < 2) {
							return false;
						}
						var nodelist = all.join('-');
						//$(".track").remove();
						$.ajax({
							type: 'GET',
							url: util.urlBase + '/getPeopleclu',
							data: {
								nodelist: nodelist
							},
							success: function(data) {
								$("#index-sidebar .tips").hide();
								$("#index-sidebar .result").show();
								getPeopleHomeResults = data;
								getPeopleHomeIndex = 1;
								that.appendResults();
								$(".btn.showMore").unbind("click");
								$(".btn.showMore").on("click", function() {
									getPeopleHomeIndex++;
									if (getPeopleHomeResults.length <= getPeopleHomeIndex * 20) {
										$(".btn.showMore").hide();
									}
									that.appendResults();
								});
							},
							error: function(data) {
								console.log(data);
							}
						});
					}
				})
				.on("dblclick", function() {
					d3.event.stopPropagation();
					if (!multiChooseMode) {
						//reset
						d3.selectAll(".nodeGroup rect").attr("opacity", 0.1);
						d3.selectAll(".linkGroup .link").attr("opacity", 0);
						d3.selectAll(".nodeGroup rect").attr("stroke", "white");
						d3.selectAll(".nodeGroup rect").classed("selected", false);
						var cluster = d3.select(this).attr("cluster");
						var col = d3.select(this).attr("col");
						d3.selectAll(".nodeGroup rect[cluster='" + cluster + "']").attr("stroke", "black").attr("opacity", 1);
						d3.select(this).attr("stroke", "red");
						d3.select(this).classed("selected", true);
						findParent(cluster, col);
						findChild(cluster, col);
						that.leafletmap.findTrajectory(cluster, col);
						coordinates("#index-pcoordinates", cluster, col);
						d3.selectAll("g.nodeGroup polygon").remove();
						that.drawClusterStream(cluster, that);
						d3.selectAll("g.flowGroup polygon").attr("visibility", "visible");
						d3.selectAll(".pixRectFrame")
							.style("fill", "none");
						d3.select("#RectFrame" + cluster)
							.style("fill", "#D3D3D3");
					}
				})
				.append("title").text("PatternID: " + d.cluster + ', People: ' + d.val);
			counter += y(d.val) + barPadding;
			if (d.move <= stateVals[1] && flag1th) {
				counter += groupPadding;
				flag1th = false;
			}
			if (d.move <= stateVals[0] && flag2th) {
				counter += groupPadding;
				flag2th = false;
			}
		});
		var time = new Date(startDate.valueOf() + index * timeGap);
		var timeStr = util.formatTime(time);
		var textG = canvas.append("text")
			.attr("text-anchor", "middle")
			.attr("transform", "translate(" + (left + barWidth / 2) + ", " + (height - 30) + ")");
		textG.append("tspan").text(timeStr["a"]).attr('x', 0).attr('dy', 0);
		textG.append("tspan").text(timeStr["b"]).attr('x', 0).attr('dy', 20);
	};
	
	prototype.appendResults = function() {
		var that = this;
		var html = '';
		var useridlist = [];
		if (getPeopleHomeResults.length > getPeopleHomeIndex * 20) {
			$(".btn.showMore").show();
		} else {
			$(".btn.showMore").hide();
		}
		getPeopleHomeResults.forEach(function(d, i) {
			if (i >= getPeopleHomeIndex * 20) {
				return false;
			}
			html += '<tr class="item"> <td>' + (i + 1) + '</td> <td class="userid">' + d.userid + '</td> <td>[' + d.homelocx.toFixed(2) + ', ' + d.homelocy.toFixed(2) + ']</td> </tr>';
			useridlist.push(d.userid);
		});
		var useridliststr = useridlist.join('-');
		$.ajax({
			type: 'get',
			url: util.urlBase + '/getPeopleByIDs',
			data: {
				useridlist: useridliststr
			},
			success: function(data2) {
				console.log(data2);
				$(".track").remove();
				data2.forEach(function(d) {
					var path = JSON.parse(JSON.parse(d.clusters));
					that.drawPeoplePath(path, d.userid);
				});
			},
			error: function() {},
		});
		$("#index-sidebar .result table tbody").html(html);
	};
	
	prototype.highlightCluster = function(cluster) {
		//reset
		d3.selectAll(".nodeGroup rect").attr("opacity", 0.1);
		d3.selectAll(".linkGroup .link").attr("opacity", 0);
		d3.selectAll(".nodeGroup rect").attr("stroke", "white");
		d3.selectAll(".nodeGroup rect").classed("selected", false);
	
		d3.selectAll(".nodeGroup rect[cluster='" + cluster + "']").each(function(d) {
			d3.select(this).attr("stroke", "black").attr("opacity", 1);
			var cluster = d3.select(this).attr("cluster");
			var col = d3.select(this).attr("col");
			findParent(cluster, col);
			findChild(cluster, col);
		});
	
		d3.select("g.nodeGroup polygon").remove();
		this.drawClusterStream(cluster, this);
	
		d3.selectAll("g.flowGroup polygon").attr("visibility", "visible");
	};
	
	prototype.drawPeoplePath = function(path, userid) {
		var that = this;
		d3.selectAll(".linkGroup .link").attr("opacity", 0);
		var canvas = d3.select(container).select("svg")
			.select("g.trackGroup")
			.attr("transform", "translate(" + svgPadding[0] + ", " + svgPadding[1] + ")");
		var flowGenerator = function(d) {
			var cx1 = d.sx + 50;
			var cy1 = d.sy;
			var cx2 = d.ex - 50;
			var cy2 = d.ey;
			var path = ["M " + (d.sx) + " " + d.sy];
			path.push("C " + cx1 + ' ' + cy1 + ' ' + cx2 + ' ' + cy2 + ' ' + d.ex + ' ' + d.ey);
	
			return path.join(" ");
		};
		var hash = {};
		var clusterArray = [];
	
		for (var j = 0; j < path.length; j++) {
			var index = path[j][0];
			var cluster = path[j][1];
			if (!hash[cluster]) {
				clusterArray.push(cluster);
				hash[cluster] = true;
			}
			if (!path[j + 1]) {
				break;
			}
			var temp = {};
			var cluster_next = path[j + 1][1];
			var sourceDom = d3.select("g.nodeGroup rect[col='" + index + "'][cluster='" + cluster + "']");
			var targetDom = d3.select("g.nodeGroup rect[col='" + (index + 1) + "'][cluster='" + cluster_next + "']");
			var sH = parseFloat(sourceDom.attr("height"));
			var eH = parseFloat(targetDom.attr("height"));
			var sx = parseFloat(sourceDom.attr("x")) + barWidth;
			var sy = parseFloat(sourceDom.attr("y")) + sH / 2;
			var ex = parseFloat(targetDom.attr("x")) - 6;
			var ey = parseFloat(targetDom.attr("y")) + eH / 2;
			temp.sx = sx;
			temp.sy = sy;
			temp.ex = ex;
			temp.ey = ey;
			canvas.append("path")
				.attr("class", "track")
				.attr("userid", userid)
				.attr("d", flowGenerator(temp))
				.attr("fill", "none")
				.attr("stroke", util.transitionColor)
				.attr("stroke-width", 2)
				.attr("opacity", 1)
				.attr("marker-end", 'url(#arrow)')
				.attr("pointer-events", 'none')
				.on("click", function(d) {
					//console.log(d);
				});
		}
	
		//clusterArray.forEach(function(d){
		//    drawClusterStream(d, that);
		//});
	};
	
	prototype.addBrush = function() {
		var that = this;
		var width = $(container).find("svg").width();
		var height = $(container).find("svg").height();
		var points = [];
		for (var i = 0; i < 84; i++) {
			var temp = {
				index: i,
				time: new Date(startDate.valueOf() + i * timeGap)
			};
			points.push(temp);
		}
		var timeExtent = d3.extent(points, function(d) {
			return new Date(d.time);
		});
		var x = d3.time.scale()
			.range([0, width])
			.domain(timeExtent);
		var brush = d3.svg.brush()
			.x(x)
			.on('brushend', brushend);
		d3.select("g.nodeGroup")
			.append('g')
			.attr('class', 'x brush')
			.call(brush).selectAll('rect')
			.attr('y', -6)
			.attr('height', height);
	
		function brushend() {
			var l = brush.extent()[0];
			var r = brush.extent()[1];
			if (brush.empty()) {
	
			} else {
				var startDate = new Date(l);
				var start = startDate.valueOf();
				var endDate = new Date(r);
				var end = endDate.valueOf();
				var pTrac = that.leafletmap.getPTrac();
				that.leafletmap.drawPTrajectory(pTrac, start, end);
				pTrac && coordinates("#index-pcoordinates", 0, 0, pTrac[0].userid, start, end);
			}
		}
	};
	
	prototype.clearBrush = function() {
		$(".nodeGroup g.brush").remove();
	};
	
	var findParent = function(cluster, col) {
		var key = col + '-' + cluster;
		var links = d3.selectAll(".link[target='" + key + "']");
		if (links[0].length == 0) {
			return false;
		} else {
			links.each(function() {
				d3.select(this).attr("opacity", 0.8);
				var source = d3.select(this).attr("source");
				var col1 = source.split("-")[0];
				var cluster1 = source.split("-")[1];
				d3.select("rect[cluster='" + cluster1 + "'][col='" + col1 + "']").attr("stroke", "black").attr("opacity", 1);
				findParent(cluster1, col1);
			});
		}
	};
	
	var findChild = function(cluster, col) {
		var key = col + '-' + cluster;
		var links = d3.selectAll(".link[source='" + key + "']");
		if (links[0].length == 0) {
			return false;
		} else {
			links.each(function() {
				d3.select(this).attr("opacity", 0.8);
				var target = d3.select(this).attr("target");
				var col1 = target.split("-")[0];
				var cluster1 = target.split("-")[1];
				d3.select("rect[cluster='" + cluster1 + "'][col='" + col1 + "']").attr("stroke", "black").attr("opacity", 1);
				findChild(cluster1, col1);
			});
		}
	};
	
	var computeLinks = function(matrixes) {
		var svg = $(container).find("svg");
		var height = svg.height();
	
		function getScale(timeIndex) {
			return d3.scale.linear().domain([0, ySum[timeIndex]]).range([10, height - groupPadding * 2 - (clustersNum - 1) * barPadding - 50]);
		}
		var links = [];
		matrixes.forEach(function(matrix, index) {
			if (index == 0) {
				return;
			}
			for (var i = 0; i < matrix.length; i++) {
				var cluster = matrix[i];
				for (var j = 0; j < cluster.length; j++) {
					var n1 = d3.select(".nodeGroup rect[col='" + (index - 1) + "'][cluster='" + j + "']");
					var n2 = d3.select(".nodeGroup rect[col='" + (index) + "'][cluster='" + i + "']");
					//var size = parseFloat(n1.attr("size"));
					//var val = size * matrix[i][j];
					//if(val > tranformMax){
					//    tranformMax = val;
					//}
					if (matrix[i][j] > thresholdMin && matrix[i][j] < thresholdMax && i != j) {
						//drawLink(i, j, index, matrix[i][j]);
						var link = {
							source: {
								dom: n1,
								col: index - 1,
								cluster: j
							},
							target: {
								dom: n2,
								col: index,
								cluster: i
							},
							value: matrix[i][j]
						};
						links.push(link);
					}
				}
			}
		});
		var incomes = {};
		var outcomes = {};
		var linksToDraw = [];
		links.forEach(function(link) {
			var temp = {
				sx: null,
				sy: null,
				sy0: null,
				sy1: null,
				ex: null,
				ey: null,
				ey0: null,
				ey1: null,
				source: null,
				target: null,
				val: null
					//size: null
			};
			temp.val = link.value;
	
			var source = link.source;
			var target = link.target;
			var sourceDom = source.dom;
			var sourceSize = parseFloat(sourceDom.attr("size"));
			var targetDom = target.dom;
			var scol = sourceDom.attr("col");
			var ecol = targetDom.attr("col");
			var sH = parseFloat(sourceDom.attr("height"));
			var eH = parseFloat(targetDom.attr("height"));
			temp.sx = parseFloat(sourceDom.attr("x")) + barWidth;
			temp.ex = parseFloat(targetDom.attr("x")) - 6;
			var stransform = getScale(scol)(link.value * sourceSize);
			var etransform = getScale(ecol)(link.value * sourceSize);
	
			var key = source.col + '-' + source.cluster;
			temp.source = key;
			temp.sy0 = parseFloat(sourceDom.attr("y"));
			temp.sy1 = temp.sy0 + sH;
			temp.sy = (temp.sy0 + temp.sy1) / 2;
			//if(!outcomes[key]){
			//    temp.sy0 = parseFloat(sourceDom.attr("y")) + 3;
			//    temp.sy1 = temp.sy0 + stransform;
			//    outcomes[key] = stransform + 3;
			//}else{
			//    temp.sy0 = parseFloat(sourceDom.attr("y")) + outcomes[key];
			//    temp.sy1 = temp.sy0 + stransform;
			//    outcomes[key] += stransform
			//}
	
			var key2 = target.col + '-' + target.cluster;
			temp.target = key2;
			temp.ey0 = parseFloat(targetDom.attr("y"));
			temp.ey1 = temp.ey0 + eH;
			temp.ey = (temp.ey0 + temp.ey1) / 2;
			//if(!incomes[key2]){
			//    temp.ey0 = parseFloat(targetDom.attr("y")) + 3;
			//    temp.ey1 = temp.ey0 + etransform;
			//    incomes[key2] = etransform + 3;
			//}else{
			//    temp.ey0 = parseFloat(targetDom.attr("y")) + incomes[key2];
			//    temp.ey1 = temp.ey0 + etransform;
			//    incomes[key2] += etransform;
			//}
			linksToDraw.push(temp);
		});
		drawLinks(linksToDraw);
	};
	
	var drawLinks = function(links) {
		d3.selectAll(".linkGroup").remove();
		var flowGenerator = function(d) {
			//sankey flow
			//var path = ["M " + (d.sx) + "," + d.sy0];
			//var cpx = padding / 2;
			//path.push("C " + (d.sx + cpx) + "," + d.sy0 +
			//    " " + (d.ex - cpx) + "," + d.ey0 +
			//    " " + (d.ex) + "," + d.ey0);
			//path.push("L " + (d.ex) + "," + d.ey0 +
			//    " " + (d.ex) + "," + d.ey1);
			//path.push("C " + (d.ex- cpx) + "," + d.ey1 +
			//    " " + (d.sx + cpx) + "," + d.sy1 +
			//    " " + (d.sx) + "," + d.sy1);
			//
			//path.push("L " + d.sx + "," + d.sy1+
			//    " " + d.sx + "," + d.sy0);
			//return path.join(" ");
	
			//bezier curve
			var cx1 = d.sx + 50;
			var cy1 = d.sy;
			var cx2 = d.ex - 50;
			var cy2 = d.ey;
			var path = ["M " + (d.sx) + " " + d.sy];
			path.push("C " + cx1 + ' ' + cy1 + ' ' + cx2 + ' ' + cy2 + ' ' + d.ex + ' ' + d.ey);
	
			return path.join(" ");
		};
	
		var canvas = d3.select(container).select("svg")
			.append("g")
			.attr("class", "linkGroup")
			.attr("transform", "translate(" + svgPadding[0] + ", " + svgPadding[1] + ")");
		//var colorScale = d3.scale.linear()
		//    .domain([thresholdMin, thresholdMax])
		//    .range(["#f0f0f0", "#636363"]);
	
		var widthScale = d3.scale.linear()
			.domain([thresholdMin, thresholdMax])
			.range([1, 6]);
	
		var links = canvas.selectAll(".link")
			.data(links)
			.enter()
			.append("path")
			.attr("class", "link")
			.attr("d", flowGenerator)
			.attr("source", function(d) {
				return d.source;
			})
			.attr("target", function(d) {
				return d.target;
			})
			.attr("fill", "none")
			.attr("stroke", util.transitionColor)
			.attr("stroke-width", function(d) {
				return widthScale(d.val);
			})
			.attr("opacity", 0.8)
			.attr("marker-end", 'url(#arrow)')
			.on("click", function(d) {
				//console.log(d);
			});
	};
	
	prototype.drawClusterStream = function(cluterIndex) {
		d3.selectAll(".clusterStream").remove();
		if ($("polygon[cluster='" + cluterIndex + "']").length > 0) {
			return false;
		}
		var vertices = [];
		var nodes = [];
		d3.selectAll(".nodeGroup rect[cluster='" + cluterIndex + "']").each(function(d) {
			nodes.push(d3.select(this));
		});
		for (var i = 0; i < nodes.length; i++) {
			var node = nodes[i];
			var x = parseFloat(node.attr("x"));
			var y = parseFloat(node.attr("y"));
			var p1 = [x, y - 3];
			var p2 = [x + barWidth, y - 3];
			vertices.push(p1);
			vertices.push(p2);
		}
		for (var i = nodes.length - 1; i > -1; i--) {
			var node = nodes[i];
			var x = parseFloat(node.attr("x"));
			var y = parseFloat(node.attr("y"));
			var h = parseFloat(node.attr("height"));
			var p1 = [x + barWidth, y + h + 3];
			var p2 = [x, y + h + 3];
			vertices.push(p1);
			vertices.push(p2);
		}
		var stream = d3.select("g.nodeGroup").append('polygon')
			.attr("class", "clusterStream")
			.attr("cluster", cluterIndex)
			.style({
				//fill: globalColors[cluterIndex],
				//fill: "#FFB000",
				fill: "grey",
				opacity: 0.5
			})
			.attr('points', vertices);
		if (!this.locked) {
			stream.style("pointer-events", "none");
		} else {
			stream.on("mouseover", function() {
				var cluster = d3.select(this).attr("cluster");
				d3.select(this).style("opacity", 0.5);
				d3.selectAll(".pixRectFrame")
					.style("fill", "none");
				d3.select("#RectFrame" + cluster)
					.style("fill", "#D3D3D3");
			}).on("mouseleave", function() {
				d3.select(this).style("opacity", 0.1);
				d3.selectAll(".pixRectFrame")
					.style("fill", "none");
			});
		}
	
	};
	
	prototype.setMultiChooseMode = function(mode) {
		multiChooseMode = mode;
		selectedNode = {};
	};
	
	var drawStateStream = function(top, bottom, state) {
		var vertices = [];
		top.forEach(function(d, i) {
			try {
				var node = d3.select(".nodeGroup rect[row='" + d + "'][col='" + i + "']");
				var x = parseFloat(node.attr("x"));
				var y = parseFloat(node.attr("y"));
				var p1 = [x, y - 8];
				var p2 = [x + barWidth, y - 8];
				vertices.push(p1);
				vertices.push(p2);
			} catch (e) {
				console.log(d, i);
			}
	
		});
		for (var i = bottom.length - 1; i > -1; i--) {
			var node = d3.select(".nodeGroup rect[row='" + bottom[i] + "'][col='" + i + "']");
			var x = parseFloat(node.attr("x"));
			var y = parseFloat(node.attr("y"));
			var h = parseFloat(node.attr("height"));
			var p1 = [x + barWidth, y + h + 8];
			var p2 = [x, y + h + 8];
			vertices.push(p1);
			vertices.push(p2);
		}
		d3.select("g.flowGroup")
			.attr("transform", "translate(" + svgPadding[0] + ", " + svgPadding[1] + ")")
			.append('polygon')
			.style({
				fill: stateColors[state],
				opacity: 0.2
			})
			.attr('points', vertices)
			.attr("visibility", "hidden")
			.style("pointer-events", "none");
	};
	
	module.exports = sankey;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Created by huwanqi on 2016/3/15.
	 */
	var util = __webpack_require__(1);
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


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Created by huwanqi on 2016/3/15.
	 */
	var util = __webpack_require__(1);
	var nodeData = __webpack_require__(4);
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


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	//热力图
	var util = __webpack_require__(1);
	
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

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var util = __webpack_require__(1);
	var coordinates = __webpack_require__(6);
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


/***/ }
]);
//# sourceMappingURL=index.js.map