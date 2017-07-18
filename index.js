require('./polyfills');
var request = require('request');

var async = require('async');
var moment = require('moment');
var mongoose = require('mongoose');


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
    var mongoClient = require("mongodb").MongoClient;
    mongoClient.connect("mongodb://127.0.0.1:27017/test", function(err, db){

        if(err){
            return console.log(err);
        }

        var collection = db.collection("users");

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


            collection.find({ "id" : user.id,  "date": user.date,  "projectId": usr.project_id }).toArray(function(err, users) {

                console.log('users', users);
                if (users.length === 0 ) {
                    console.log('users not found');

                    collection.insertOne(user, function(err, result) {
                        if (err) {
                            return console.log(err);
                        }
                        console.log(result.ops);
                    });
                } else {
                    console.log('users found');
                    collection.updateOne({ "id" : user.id,  "date": user.date,  "projectId": usr.project_id}, {
                        $set: { "duration": user.duration },
                    });
                }
            });
        };

        async.each(insertUsers, updateUser, function () {
            db.close();
        });
    });
});
