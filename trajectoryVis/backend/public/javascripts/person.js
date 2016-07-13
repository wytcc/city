var mongoose = require('mongoose');
var person = mongoose.model('person', new mongoose.Schema({name:String}),"test");
exports.personlist = function personlist(name, callback) {
  var person = mongoose.model('person');
  person.find({
    'name': name
  }, function(err, persons) {
    if (err) {
      console.log(err);
    } else {
      console.log(persons);
      callback("", persons);
    }
  });
};
