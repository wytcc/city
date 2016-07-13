/**
 * Created by huwanqi on 2016/3/15.
 */
var util = require("util");
var Leafletmap = require("leafletmap");
var Sankey = require("sankey");
var coordinates = require("coordinates");
var pixelmap = require("pixelmap");

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