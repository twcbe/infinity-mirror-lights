const express = require('express');
const app =  express();
const mqtt = require('mqtt');

var mqttUrl = process.env.MQTT_URL || 'mqtt://user:pass@localhost:1883';
var topic = process.env.MQTT_TOPIC || 'led_ring_server';

var options = {
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
    keepalive: 60,
    reconnectPeriod: 1000,
    protocolId: 'MQIsdp',
    protocolVersion: 3,
    clean: true,
    encoding: 'utf8'
};

var client = mqtt.connect(mqttUrl, options);

var userColorMap = {}; // {userId: [userId, userChosenColor, timestamp]}
var repeatFlag = false;
var cycleSpeed = 120;
var needsPublish = false;

function publishColors() {
    var colors = Object.values(userColorMap)
        .map(userData => [userData.userChosenColor.r, userData.userChosenColor.g, userData.userChosenColor.b]);
    colors = [].concat.apply([], colors);
    var payload = [+repeatFlag, cycleSpeed].concat(colors);

    var uintArray = Uint8Array.from(payload);
    var bufferPayload = Buffer.from(uintArray);

    console.log("payload : ");
    console.log(payload);
    console.log(typeof(payload[0]));
    console.log(typeof(payload[1]));
    console.log(typeof(payload[2]));

    console.log("uintArray : ");
    console.log(uintArray);
    
    console.log("bufferPayload : ");
    console.log(bufferPayload);

    client.publish(topic, bufferPayload);
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