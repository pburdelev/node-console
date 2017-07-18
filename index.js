var request = require('request');
var moment = require('moment');
var async = require('async');

//var url = "https://api.hubstaff.com/v1/custom/by_date/my?start_date=2017/07/14&end_date=2017/07/14";
var url = "https://api.hubstaff.com/v1/custom/by_date/my?start_date=" + moment().format('YYYY-MM-DD') + "&end_date=" + moment().format('YYYY-MM-DD');
console.log(url);
var requestParams = {
    method: 'GET',
    uri: url,
    headers: {
        'App-Token': "kW7NwkzRyNcZqBgwgrrHjLymtHwYuEcKOF_F7g_iQ1s",
        'Auth-Token': "MbccvvBu4TWyzmsNTewsKUyy0WSdWQxC4UKKFYNL_7A",
        'Cache-Control': "no-cache",
        'Content-Type': "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW",
        'Postman-Token': "8f173b1c-6b19-9cf2-f764-0502f9bfc1d1"
    }
};


function getDataUsers(dates){
    var insertUsers = [];
    dates.forEach(function(itemDate, indexDate, dates){

        itemDate.users.forEach(function(itemUser, indexUser, users){

            itemUser.projects.forEach(function(itemProject, indexProject, projects){
                var user = {
                    date: moment(itemDate.date).format('L'),
                    userId: itemUser.id,
                    userName: itemUser.name,
                    duration: itemProject.duration,
                    projectId: itemProject.id,
                    projectName: itemProject.name
                };

                insertUsers.push(user);
            });


        });

    });

    return insertUsers
}

function insertOrUpdateMongoDB(insertUsers){
    var mongoClient = require("mongodb").MongoClient;
    mongoClient.connect("mongodb://127.0.0.1:27017/test", function(err, db){
        if(err){
            return console.log(err);
        }

        console.log('Connect to mongo successful!');

        var collection = db.collection("users");

        var updateUser = function (user, callback) {

            collection.find({ "userId" : user.userId,  "date": user.date,  "projectId": user.projectId }).toArray(function(err, users) {

                if (!users.length) {
                    console.log('users not found');

                    collection.insertOne(user, function(err, result) {
                        callback(err, result);
                    });
                } else {
                    console.log('users found');
                    collection.updateOne({ "userId" : user.userId,  "date": user.date,  "projectId": user.projectId}, {
                        $set: { "duration": user.duration }},
                        function(err, result) {
                            callback(err, result);
                        }
                    );
                }
            });
        };

        async.each(insertUsers, updateUser, function (results) {
            console.log(results);
            db.close();
        });
    });
}

request(requestParams, function (error, response, body) {
    if (error) {
        return console.error('Connect failed:', error);
    }

    console.log('Connection to hubstaff successful!');

    var insertUsers = getDataUsers(JSON.parse(body).organizations[0].dates);
    insertOrUpdateMongoDB(insertUsers);
});
