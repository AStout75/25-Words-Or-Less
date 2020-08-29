'use strict';

const express = require('express');
const socketIO = require('socket.io');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

console.log(PORT);

const server = express()
  .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = socketIO(server);
var gameTimer;
const BID_TIME = 10000; //ms
const PRE_BID_TIME = 5000; //ms

var rooms = {};
var IdToRoom = {};
var wordBank = 
    {
        "easy" : 
            [
                "pen",
                "shirt",
                "cup",
            ],
        "medium" :
            [
                "Eiffel Tower",
                "whiteboard",
                "Discord",
            ],
        "hard" :
            [
                "Bleu Cheese",
                "Jamie Foxx",
                "Metallica",
            ],
    };

io.on('connect', socket => {



    /*
    Immediately upon connection, tell the client its user ID 
    for improving client side operations */

    io.to(socket.id).emit('client-id-notification', socket.id);

    /* Upon joining a room, send a new room-data emit to all room
    members */
    socket.on('join-room', (key, name) => {
        if (rooms[key] != null) {
            if (rooms[key]["gameStarted"]) {
                socket.emit('join-room-fail');
            }
            else if (rooms[key]["playerCount"] == 8) {
                socket.emit('join-room-fail');
            }
            else {
                rooms[key]["playerCount"] += 1;
                var socketId = socket.id;
                addToFirstAvailableTeam(key, name, socketId);
                socket.join(key, function() {
                    IdToRoom[socketId] = key;
                    socket.emit('join-room-success', key, name);
                    io.in(key).emit('room-data', rooms[key]);
                });
        
            }
        }
        else {
            socket.emit('join-room-fail');
        }
        
        
    });

    socket.on('create-room', name => {
        var key = createNewRoomKey();
        createNewRoom(key, name, socket);
        var socketId = socket.id;
        socket.join(key, function() {
            IdToRoom[socketId] = key;
            socket.emit('create-room-success', key);
            io.in(key).emit('room-data', rooms[key]);
        });
        
    });

    
    socket.on('join-team', (key, name, teamNumber) => {
        removePlayerFromAnyTeam(key, socket.id);
        if (!addToDesiredTeam(key, name, socket.id, teamNumber)) {
            //This shouldn't happen unless someone is calling their own code
            addToFirstAvailableTeam(key, name, socket.id);
        }
        io.in(key).emit('room-data', rooms[key]);
    }); 

    socket.on('leave-room', key => {
        var socketId = socket.id;
        IdToRoom[socketId] = null;
        socket.leave(key);
        console.log("player left");
        console.log("they were in room ", key);
        rooms[key]["playerCount"] -= 1;
        removePlayerFromAnyTeam(key, socket.id);
        socket.disconnect;
        if (rooms[key]["playerCount"] == 0) {
            garbageCollectRoom(key);
        }
        else {
            io.in(key).emit('room-data', rooms[key]);
        }
        
    });

    socket.on('start-game', key => {

        var ready = false;
        console.log(rooms[key]["team1"]);
        console.log(rooms[key]["team2"]);
        if (rooms[key]["team1"].length >= 2 && rooms[key]["team2"].length >= 2) {
            ready = true;
        }

        ready = true; //delete


        if (ready) {
            startGame(key);
        }
        else {
            //shouldn't happen, but...
            console.log("start game sent to server but not ready");
        }
        
    });

    socket.on('player-bid', (key, bid) => {
        
        
        console.log("received player bid");
        //validate bid
        const playerHasCurrentBid = (rooms[key]["game"]["currentBidOwner"] == socket.id) ? true : false;
        if (bid < rooms[key]["game"]["currentBid"] && bid > 0 && !playerHasCurrentBid) {
            rooms[key]["game"]["currentBid"] = bid;
            rooms[key]["game"]["currentBidOwner"] = socket.id;
            console.log(rooms[key]["game"]["update"]);
            rooms[key]["game"]["update"]["playerName"] = getPlayerNameFromId(key, socket.id);
            rooms[key]["game"]["update"]["action"] = "bids";
            rooms[key]["game"]["update"]["value"] = bid;
            console.log(rooms[key]["game"]["update"], "is the update being sent");
            io.in(key).emit('game-update', rooms[key]["game"]);
            //If the game timer runs out, move past bidding phase
            clearTimeout(gameTimer);
            gameTimer = setTimeout(function() {
                console.log("game has moved to guess mode");
                rooms[key]["game"]["mode"] = "guess";
                rooms[key]["game"]["update"]["playerName"] = "[Game]";
                rooms[key]["game"]["update"]["action"] = "has closed bidding at bid: ";
                rooms[key]["game"]["update"]["value"] = rooms[key]["game"]["currentBid"];
                io.in(key).emit('game-update', rooms[key]["game"]);
            }, BID_TIME);
        }
        
    });

    socket.on('clock-test-event', key => {
        io.in(key).emit('reset-clock', 10);
    });

    socket.on('disconnect', function() {
        console.log("player disconnected");
        //Find out which room they were in
        var socketId = socket.id;
        var key = IdToRoom[socketId];
        if (key != null) {
            console.log("they were in room ", key);
            rooms[key]["playerCount"] -= 1;
            removePlayerFromAnyTeam(key, socket.id);
            if (rooms[key]["playerCount"] == 0) {
                garbageCollectRoom(key);
            }
            else {
                io.in(key).emit('room-data', rooms[key]);
            }
        }
    });
});

function startGame(key) {
    rooms[key]["gameStarted"] = true;
    io.in(key).emit('start-game-server');
    rooms[key]["game"]["mode"] = "pre-bid";
    rooms[key]["game"]["update"]["playerName"] = "[Game]";
    rooms[key]["game"]["update"]["action"] = "has initiated a pre-bid phase of";
    rooms[key]["game"]["update"]["value"] = (PRE_BID_TIME / 1000).toString().concat(" seconds");
    io.in(key).emit('game-update', rooms[key]["game"]);
    gameTimer = setTimeout(function() {
        rooms[key]["game"]["mode"] = "bid";
        rooms[key]["game"]["update"]["playerName"] = "[Game]";
        rooms[key]["game"]["update"]["action"] = "has initiated the bidding phase at a bid of";
        rooms[key]["game"]["update"]["value"] = rooms[key]["game"]["currentBid"];
        io.in(key).emit('game-update', rooms[key]["game"]);
        gameTimer = setTimeout(function() {
            console.log("game has moved to guess mode");
            rooms[key]["game"]["mode"] = "guess";
            rooms[key]["game"]["update"]["playerName"] = "[Game]";
            rooms[key]["game"]["update"]["action"] = "has closed bidding at bid: ";
            rooms[key]["game"]["update"]["value"] = rooms[key]["game"]["currentBid"];
            io.in(key).emit('game-update', rooms[key]["game"]);
        }, BID_TIME);
    }, PRE_BID_TIME);

}

function garbageCollectRoom(key) {
    rooms[key] = null;
}

function addToFirstAvailableTeam(key, name, playerId) {
    if (rooms[key]["team1"].length < 4) {
        var newMember = {};
        newMember[playerId] = name;
        rooms[key]["team1"].push(newMember);
    }
    else {
        var newMember = {};
        newMember[playerId] = name;
        rooms[key]["team2"].push(newMember);
    }
}

function addToDesiredTeam(key, name, playerId, number) {
    if (rooms[key]["team".concat(number)].length < 4) {
        var newMember = {};
        newMember[playerId] = name;
        rooms[key]["team".concat(number)].push(newMember);
        return true;
    }
    return false;
}

function returnTeamNumber(key, playerId) {
    var team1 = rooms[key]["team1"];
    var team2 = rooms[key]["team2"];
    for (var i = 0; i < team1.length; i++) {
        if (Object.keys(team1[i])[0] == playerId) {
            return 1;
        }
    }

    //not in team 1...
    for (var i = 0; i < team2.length; i++) {
        if (Object.keys(team2[i])[0] == playerId) {
            return 2;
        }
    }
}

function getPlayerNameFromId(key, playerId) {
    var team1 = rooms[key]["team1"];
    var team2 = rooms[key]["team2"];
    for (var i = 0; i < team1.length; i++) {
        if (Object.keys(team1[i])[0] == playerId) {
            console.log("found player", Object.values(team1[i])[0]);
            return Object.values(team1[i])[0];
        }
    }

    //not in team 1...
    for (var i = 0; i < team2.length; i++) {
        if (Object.keys(team2[i])[0] == playerId) {
            console.log("found player", Object.values(team2[i])[0]);
            return Object.values(team2[i])[0];
        }
    }
}

function removePlayerFromAnyTeam(key, playerId) {
    var team1 = rooms[key]["team1"];
    var team2 = rooms[key]["team2"];
    for (var i = 0; i < team1.length; i++) {
        if (Object.keys(team1[i])[0] == playerId) {
            team1.splice(i, i + 1);
            return;
        }
    }

    //not in team 1...
    for (var i = 0; i < team2.length; i++) {
        if (Object.keys(team2[i])[0] == playerId) {
            team2.splice(i, i + 1);
            return;
        }
    }
    
    
}



//Generate a sequence of 4 random 0-9 numbers that doesn't
// already exist in rooms

function createNewRoomKey() {
    var key = "-1";
    while (key == -1 || key in Object.keys(rooms)) {
        var num1 = Math.floor((Math.random() * 10)).toString();
        var num2 = Math.floor((Math.random() * 10)).toString();
        var num3 = Math.floor((Math.random() * 10)).toString();
        var num4 = Math.floor((Math.random() * 10)).toString();
        key = num1 + num2 + num3 + num4;
    }
    return key;
    
}

function createNewRoom(key, hostName, socket) {
    var hostId = socket.id;
    rooms[key] = {};
    rooms[key]["playerCount"] = 1;
    rooms[key]["team1"] = [];
    var newMember = {};
    newMember[hostId] = hostName;
    rooms[key]["team1"].push(newMember);
    rooms[key]["team2"] = [];
    rooms[key]["gameStarted"] = false;
    rooms[key]["game"] = {};
    rooms[key]["game"]["currentBid"] = 25;
    rooms[key]["game"]["update"] = {};
}