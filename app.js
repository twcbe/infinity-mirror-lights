const express = require('express');
const app =  express();
const mqtt = require('mqtt');

var mqttUrl = process.env.MQTT_URL || 'mqtt://localhost:1883';
var topic = process.env.MQTT_TOPIC || 'color';
// client = mqtt.createClient({encoding: 'binary'});
var client = mqtt.connect(mqttUrl);

var userColorMap = {}; // {userId: [userId, userChosenColor, timestamp]}
var repeatFlag = true;
var cycleSpeed = 1;
var needsPublish = false;

function publishColors() {
    var payload = [+repeatFlag, cycleSpeed].concat(Object.values(userColorMap)
    .map(userData => [userData.userChosenColor.r, userData.userChosenColor.g, userData.userChosenColor.b]));
    console.log(`payload : ${payload}`);
    client.publish('test_topic', 'publishing');
    client.publish(topic,new Buffer(Uint8Array.from(payload)));
}

setInterval(function() {
    if(!needsPublish) {
        return;
    }
    publishColors();
    needsPublish = false;
}, 200);

function updateData(userId, data) {
    needsPublish=true;
    userColorMap[userId] = data;
}

app.post('/pick_color', (req, res) => {
    var userId = req.headers.user_id;
    if (!userId) {
        console.log("pick_color request without user_id");
        res.sendStatus(200);
    }
    var data = {
        userId: userId,
        userChosenColor: JSON.parse(req.headers.color),
        timestamp: new Date().toISOString()
    };
    console.log(data);
    updateData(userId, data);
    
    res.sendStatus(200);
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

///////////////////////////////////////

app.use(log);
app.use('/static', express.static('public'))

function log(req, res, next) {
    console.log(`LOG:: METHOD: ${req.method}, URL: ${req.url}`);
    next();
}

client.on('connect', () => {
    console.log("Connected to mqtt broker.");
});

client.on('reconnect', () => {
    console.log("Connected to mqtt broker.");
});

function publishMessage(topic, message) {
    client.publish(topic, message, {}, function(err) {
        if(err) {
            console.log("MQTT publish failed")
        }
    });
};

module.exports = app;