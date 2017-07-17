require('./polyfills');
var request = require('request');

var async = require('async');
var moment = require('moment');
var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;

var TOKEN = '20943l41446568988056f4e79e6c01aa47aaa0';
var API_UPL = 'https://screenshotmonitor.com/api/v1/report?token=' + TOKEN +'&from=' + moment().format('L');

var Track = require('./models/track');
var User = require('./models/user');

function insertArray(array) {
    var usersInsert = [];

    array.rows.map(function(usr) {
        var index = usersInsert.findIndex(function(item){return ((item.employee_id === usr.employee_id) && (item.project_id === usr.project_id))});

        if (index < 0) {
            usersInsert.push(usr);
        }
        else
        {
            usersInsert[index].duration_minutes =  parseInt(usersInsert[index].duration_minutes) + parseInt(usr.duration_minutes)
        }

    });

    return usersInsert;
}

var requestParams = {
    method: 'POST',
    preambleCRLF: true,
    postambleCRLF: true,
    uri: API_UPL
};
request(requestParams, function (error, response, body) {
    if (error) {
        return console.error('Connect failed:', error);
    }
    console.log('Connect successful!');
    mongoose.connect("mongodb://127.0.0.1:27017/test");
    var db = mongoose.connection;

    db.on('error', console.error.bind(console, 'connection error:'));

    db.once('open', function() {
        console.log('Connected');

        var insertUsers = insertArray(JSON.parse(body));

        var updateUser = function (usr, callback) {
            var user = {
                _id: usr.employee_id,
                name: usr.employee,
                date: moment(usr.from).format('L'),
                duration: usr.duration_minutes,
                projectId: usr.project_id,
                projectName: usr.project_name
            };

            console.log('User', user);

            User.findById(user._id, function (err, updatedUser) {
                if (!updatedUser) {
                    console.log('No users found');
                    updatedUser = new User(user);
                } else {

                }

                updatedUser.save(function (err, newUser) {
                    if (err) return console.error(err);
                    var updatedTrack = new Track({
                                                    date: user.date,
                                                    _user: parseInt(newUser._id),
                                                    duration: user.duration,
                                                    project_id: user.projectId,
                                                    project_name: user.projectName
                                                 });



                    updatedTrack.save(function (err) {
                        if (err) return console.error(err);
                    });
                    newUser.showUser();
                    callback(err, updatedUser);
                });
            });
        };

        async.each(insertUsers, updateUser, function () {
            db.close();
        });
    });
});
