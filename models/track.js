var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var trackSchema  = mongoose.Schema({
    _user: [{type: Number, ref: 'User' }],
    date: {type: String, required: true},
    project_name:{type: String, required: true},
    project_id: {type: String, required: true},
    duration: {type: String, required: true},
});

module.exports = mongoose.model('Track', trackSchema);