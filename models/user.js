var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var userSchema = mongoose.Schema({
    _id: {type: Number, required: true},
    name: {type: String, required: true},
    tracks: [{type: Schema.Types.ObjectId, ref: 'Track' }]
});

userSchema.methods.showUser = function () {
    console.log('Id: ', this.id);
    console.log('Name: ', this.name);
    console.log('Project name: ', this.projectName);
};

module.exports = mongoose.model('User', userSchema);
