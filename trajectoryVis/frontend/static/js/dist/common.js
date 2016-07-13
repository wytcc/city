/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	var parentJsonpFunction = window["webpackJsonp"];
/******/ 	window["webpackJsonp"] = function webpackJsonpCallback(chunkIds, moreModules) {
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, callbacks = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(installedChunks[chunkId])
/******/ 				callbacks.push.apply(callbacks, installedChunks[chunkId]);
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			modules[moduleId] = moreModules[moduleId];
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(chunkIds, moreModules);
/******/ 		while(callbacks.length)
/******/ 			callbacks.shift().call(null, __webpack_require__);
/******/ 		if(moreModules[0]) {
/******/ 			installedModules[0] = 0;
/******/ 			return __webpack_require__(0);
/******/ 		}
/******/ 	};
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading chunks
/******/ 	// "0" means "already loaded"
/******/ 	// Array means "loading", array contains callbacks
/******/ 	var installedChunks = {
/******/ 		3:0
/******/ 	};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/ 	// This file contains only the entry chunk.
/******/ 	// The chunk loading function for additional chunks
/******/ 	__webpack_require__.e = function requireEnsure(chunkId, callback) {
/******/ 		// "0" is the signal for "already loaded"
/******/ 		if(installedChunks[chunkId] === 0)
/******/ 			return callback.call(null, __webpack_require__);
/******/
/******/ 		// an array means "currently loading".
/******/ 		if(installedChunks[chunkId] !== undefined) {
/******/ 			installedChunks[chunkId].push(callback);
/******/ 		} else {
/******/ 			// start chunk loading
/******/ 			installedChunks[chunkId] = [callback];
/******/ 			var head = document.getElementsByTagName('head')[0];
/******/ 			var script = document.createElement('script');
/******/ 			script.type = 'text/javascript';
/******/ 			script.charset = 'utf-8';
/******/ 			script.async = true;
/******/
/******/ 			script.src = __webpack_require__.p + "" + chunkId + "." + ({"0":"earthquake","1":"index","2":"timeline"}[chunkId]||chunkId) + ".js";
/******/ 			head.appendChild(script);
/******/ 		}
/******/ 	};
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "./dist/";
/******/ })
/************************************************************************/
/******/ ([
/* 0 */,
/* 1 */
/***/ function(module, exports) {

	/**
	 * Created by huwanqi on 2015/11/25.
	 */
	'use strict';
	
	var util = {};
	
	util.transitionColor = "#a8cadd";
	util.ptransitionColorHighlight = '#FFB000';
	
	//产生唯一表标记
	util.generateUUID=function(){
	
	    // http://www.broofa.com/Tools/Math.uuid.htm
	
	    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
	    var uuid = new Array(36);
	    var rnd = 0, r;
	
	    return function () {
	
	        for ( var i = 0; i < 36; i ++ ) {
	
	            if ( i == 8 || i == 13 || i == 18 || i == 23 ) {
	
	                uuid[ i ] = '-';
	
	            } else if ( i == 14 ) {
	
	                uuid[ i ] = '4';
	
	            } else {
	
	                if (rnd <= 0x02) rnd = 0x2000000 + (Math.random()*0x1000000)|0;
	                r = rnd & 0xf;
	                rnd = rnd >> 4;
	                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
	
	            }
	        }
	
	        return 'u'+uuid.join('');
	
	    };
	
	}();
	
	
	//分割csv文件
	util.CSVToArray = function( strData, strDelimiter ){
	    // Check to see if the delimiter is defined. If not,
	    // then default to comma.
	    strDelimiter = (strDelimiter || ",");
	
	    // Create a regular expression to parse the CSV values.
	    var objPattern = new RegExp(
	        (
	            // Delimiters.
	            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
	
	                // Quoted fields.
	            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
	
	                // Standard fields.
	            "([^\"\\" + strDelimiter + "\\r\\n]*))"
	        ),
	        "gi"
	    );
	
	
	    // Create an array to hold our data. Give the array
	    // a default empty first row.
	    var arrData = [[]];
	
	    // Create an array to hold our individual pattern
	    // matching groups.
	    var arrMatches = null;
	
	
	    // Keep looping over the regular expression matches
	    // until we can no longer find a match.
	    while (arrMatches = objPattern.exec( strData )){
	
	        // Get the delimiter that was found.
	        var strMatchedDelimiter = arrMatches[ 1 ];
	
	        // Check to see if the given delimiter has a length
	        // (is not the start of string) and if it matches
	        // field delimiter. If id does not, then we know
	        // that this delimiter is a row delimiter.
	        if (
	            strMatchedDelimiter.length &&
	            strMatchedDelimiter !== strDelimiter
	        ){
	
	            // Since we have reached a new row of data,
	            // add an empty row to our data array.
	            arrData.push( [] );
	
	        }
	
	        var strMatchedValue;
	
	        // Now that we have our delimiter out of the way,
	        // let's check to see which kind of value we
	        // captured (quoted or unquoted).
	        if (arrMatches[ 2 ]){
	
	            // We found a quoted value. When we capture
	            // this value, unescape any double quotes.
	            strMatchedValue = arrMatches[ 2 ].replace(
	                new RegExp( "\"\"", "g" ),
	                "\""
	            );
	
	        } else {
	
	            // We found a non-quoted value.
	            strMatchedValue = arrMatches[ 3 ];
	
	        }
	
	
	        // Now that we have our value string, let's add
	        // it to the data array.
	        arrData[ arrData.length - 1 ].push( strMatchedValue );
	    }
	
	    // Return the parsed data.
	    return( arrData );
	};
	
	//时间转换
	util.formatTime = function(date){
	    var dataCN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	    var hours = date.getHours();
	    hours = hours.toString().length > 1 ? hours : ("0" + hours);
	    var minutes = date.getMinutes();
	    minutes = minutes.toString().length > 1 ? minutes : ("0" + minutes);
	    return {
	        a: dataCN[date.getDay()] + ' ' + date.getDate(),
	        b: hours + ":" + minutes
	    };
	};
	
	util.computeControlPoints = function(p1, p2){
	
	};
	
	util.opacityScale = d3.scale.linear().range([0.2, 1]).domain([0, 1]);
	
	//这个网址是?
	util.urlBase = "http://10.76.0.182:3000"; //node??????????????????
	
	module.exports = util;

/***/ }
/******/ ]);
//# sourceMappingURL=common.js.map