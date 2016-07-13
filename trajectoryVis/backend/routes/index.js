var express = require('express');
var router = express.Router();
require("../public/javascripts/db.js");
var person = require('../public/javascripts/person.js');
var trajectory = require('../public/javascripts/trajectory.js');
var stay = require('../public/javascripts/stay.js');
var mysql = require("mysql");

var conn = mysql.createConnection({
  host: '10.76.0.182',
  // host: '127.0.0.1',
  user: 'root',
  password: '123456789',
  // password:'wxs123456789',
  database: 'mobiledata',
  port: 3306
});
conn.connect();

var conn2 = mysql.createConnection({
  host: '10.76.0.182',
  user: 'root',
  password: '123456789',
  database: 'mobiledata',
  port: 3306
});
conn2.connect();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/search',function(req,res){
  //console.log("Enter router.post'/search'");
  var name=req.param("name");
  // person.personlist(name,function(err, personlist){
  //   //  console.log(personlist);
  //   res.json(personlist);
  // });
  trajectory.searchByID(name,function(err, trajectorylist){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(trajectorylist);
  });
});

router.get('/search3',function(req,res){
  var type = req.param("type");
  stay.getData(type, function(err, data){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(data);
  });
});

router.get('/getTrajectoryByNode',function(req,res){
  var type = req.param("type");
  var time = req.param("time");
  var sql = "SELECT * FROM clustertrajectory WHERE timeid=" + time + " AND clusterid=" + type + ' limit 0,100';
  conn.query(sql, function(err, nodes, fields) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(nodes);
  });
  //var type = req.param("type");
  //stay.getData(type, function(err, data){
  //  res.setHeader('Access-Control-Allow-Origin', '*');
  //  res.json(data);
  //});
});

router.get('/getTrajectoryByType',function(req,res){
  var type = req.param("type");
  var sql = "SELECT * FROM clustertrajwithouttime WHERE clusterid=" + type + ' limit 0,100';
  conn.query(sql, function(err, nodes, fields) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(nodes);
  });
});

router.get('/getClusterRange',function(req,res){
  var sql = "SELECT * FROM clusterrange";
  conn.query(sql, function(err, nodes, fields) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(nodes);
  });
});

router.get('/statistics',function(req,res){
  var type = req.param("type");
  var time = req.param("time");
  var sql = "SELECT * FROM clusterstatistics WHERE timeindex=" + time + " AND clusterindex=" + type;
  conn.query(sql, function(err, nodes, fields) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(nodes);
  });
});

router.get('/statisticsWithoutTime',function(req,res){
  var type = req.param("type");
  var sql = "SELECT * FROM clusterstatisticswithoutt WHERE clusterid=" + type;
  conn.query(sql, function(err, nodes, fields) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(nodes);
  });
});

router.get('/statisticsTotal',function(req,res){
  var sql = "SELECT * FROM clustertotal";
  conn.query(sql, function(err, nodes, fields) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(nodes);
  });
});

router.get('/getClusterAvg',function(req,res){
  var sql = "SELECT * FROM clusteravg";
  conn.query(sql, function(err, nodes, fields) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(nodes);
  });
});

router.get('/getNodes',function(req,res){
  var sql = "SELECT * FROM statecount";
  conn.query(sql, function(err, nodes, fields) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(nodes);
  });
});

router.get('/getClusterPeople',function(req,res){
  var sql = "SELECT * FROM nodesize";
  conn.query(sql, function(err, nodes, fields) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(nodes);
  });
});

router.get('/getPeopleFeature',function(req,res){
  var userid = req.param("id");
  var sql = "SELECT * FROM usercountdata WHERE userid=" + userid;
  conn2.query(sql, function(err, nodes, fields) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(nodes);
  });
});

router.get('/getPersonPath',function(req,res){
  var id = req.param("id");
  var sql = "SELECT * FROM usercountdata where userid=" + id;
  conn.query(sql, function(err, nodes, fields) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(nodes);
  });
});

router.get('/getPersonTrac',function(req,res){
  var id = req.param("id");
  trajectory.searchByID(id, function(trajectorylist){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(trajectorylist);
  })
});

router.get('/test', function(req, res, next) {
  res.json("{}");
});

router.get('/getPeopleHome',function(req,res){
  var longitude1=req.param("longitude1");
  var longitude2=req.param("longitude2");
  var latitude1=req.param("latitude1");
  var latitude2=req.param("latitude2");
  var sql = "SELECT userid,homelocx,homelocy FROM usercountdata where homelocx >= " + longitude1 + " and homelocx <=" + longitude2 + 
            " and homelocy >= " + latitude1 + " and homelocy <="+ latitude2 + ' limit 0,100';
  conn.query(sql, function(err, nodes, fields) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.json(nodes);
  });
  
});

router.get('/getPeopleclu',function(req,res){
    var nodelist=Array();
    var sqlpart="";
    var nodelistarray=req.param("nodelist");
    // if(!nodelistarray){
    //   nodelistarray="10,19-12,10-23,12";
    // }
    nodelist=nodelistarray.split('-');

    sqlpart="time"+nodelist[0].split(",")[0]+"="+nodelist[0].split(",")[1];
    for (var i=1;i<nodelist.length;i++){
        sqlpart=sqlpart+" and time"+nodelist[i].split(",")[0]+"="+nodelist[i].split(",")[1];
    }
    var sql = "SELECT userid,homelocx,homelocy FROM usercountdata where " + sqlpart;
    //console.log(sql);
    conn.query(sql, function(err, nodes, fields) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.json(nodes);
  });
});


router.get('/getPeopleByIDs',function(req,res){
    var userArray=new Array();
    var useridlist=req.param("useridlist");
    //if(!useridlist)
    //  useridlist="460028254340071-460023748852971-460008763548271";
    userArray=useridlist.split('-');
    var sqlpart=userArray[0];
    for(var i=1; i<userArray.length;i++){
        sqlpart=sqlpart+','+userArray[i];
    }
    var sql = "SELECT * FROM usercountdata where userid in (" + sqlpart+")";
    conn.query(sql, function(err, nodes, fields) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.json(nodes);
  });
});

router.get('/getTrajByIDs',function(req,res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  var ids = req.param("useridlist");
  if(!ids){
   ids="460028254340071,460023748852971,460008763548271";
  }
  trajectory.searchTrajByIDs(ids, function(trajectorylist){
    res.json(trajectorylist);
  })
});

router.get('/getFeatureByIdTime',function(req,res){
  var id=Number(req.param("id"));
  var stime=Number(req.param("stime"));
  var etime=Number(req.param("etime"));
  // if(!id){
  //       id=460005876051371;
  //       stime=1390236778723;
  //       etime=1390468428191;
  // }
  trajectory.searchFeatureByID(id,stime,etime,function(trajectorylist){
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.json(trajectorylist);
  })
});


module.exports = router;
