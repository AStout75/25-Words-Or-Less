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
const BID_TIME = 20000; //ms
const PRE_BID_TIME = 10000; //ms
const GUESS_TIME = 45000;

var rooms = {};
var IdToRoom = {};
var wordBank = 
    {
        "easy" : 
            [
                "baby", "door", "banana", "finger", "fence", "big", "swimming", "pool", "sun", "church", "yo-yo", "boy", "bag", "alligator", "mouse", "birthday", "winter", "beach", "tree", "teacher", "king", "telephone", "eye", "water", "jelly", "balloon", "toothbrush", "pants", "mom", "body", "bike", "toilet", "paper", "baseball", "pig", "lawn", "mower", "fire", "school", "belt", "pajamas", "mud", "ice", "cream", "cone", "arm", "drums", "spider", "shark", "seashell", "computer", "grandma", "pillow", "kite", "homework", "ladybug", "bed", "bird", "gum", "book", "dress", "queen", "puppy", "happy", "doctor", "frog", "blanket", "popsicle", "pen", "sandwich", "boat", "dad", "lunchbox", "ice", "bottle", "elbow", "penny", "broom", "dog", "rose", "picnic", "chair", "duck", "hair", "zoo", "party", "piano", "key", "apple", "chalk", "park", "clock", "pencil", "hill", "flag", "lollipop", "candle", "flower", "basketball", "hug", "clown", "paper", "mountain", "nose", "cow", "grown-up", "grass", "rainbow", "hide-and-seek", "pocket", "grape", "cowboy", "doll", "forehead", "football", "crayon", "desk", "TV", "bedtime", "hopscotch", "dump", "truck", "cold", "paint", "ear", "moon",
            ],
        "medium" :
            [
                "taxi", "cab", "standing", "ovation", "alarm", "clock", "tool", "banana", "peel", "flagpole", "money", "wallet", "ballpoint", "pen", "sunburn", "wedding", "ring", "spy", "baby-sitter", "aunt", "acne", "bib", "puzzle", "piece", "pawn", "astronaut", "tennis", "shoes", "blue", "jeans", "twig", "outer", "space", "banister", "batteries", "doghouse", "campsite", "plumber", "bedbug", "throne", "tiptoe", "log", "mute", "pogo", "stick", "stoplight", "ceiling", "fan", "bedspread", "bite", "stove", "windmill", "nightmare", "stripe", "spring", "wristwatch", "eat", "matchstick", "gumball", "bobsled", "bonnet", "flock", "sprinkler", "living", "room", "laugh", "snuggle", "sneeze", "bud", "elf", "headache", "slam", "dunk", "Internet", "Catchphrase", "Words:", "Medium", "Copyright", "©", "2012", "The", "Game", "Gal", "|", "www.thegamegal.com", "saddle", "ironing", "board", "bathroom", "scale", "kiss", "shopping", "cart", "shipwreck", "funny", "glide", "lamp", "candlestick", "grandfather", "rocket", "home", "movies", "seesaw", "rollerblades", "smog", "grill", "goblin", "coach", "claw", "cloud", "shelf", "recycle", "glue", "stick", "Christmas", "carolers", "front", "porch", "earache", "robot", "foil", "rib", "robe", "crumb", "paperback", "hurdle", "rattle", "fetch", "date", "iPod", "dance", "cello", "flute", "dock", "prize", "dollar", "puppet", "brass", "firefighter", "huddle", "easel", "pigpen", "bunk", "bed", "bowtie", "fiddle", "dentist", "baseboards", "letter", "opener", "photographer", "magic", "Old", "Spice", "monster"
            ],
        "hard" :
            [
                "whatever", "buddy", "sip", "chicken", "coop", "blur", "chime", "bleach", "clay", "blossom", "cog", "twitterpated", "wish", "through", "feudalism", "whiplash", "cot", "blueprint", "beanstalk", "think", "cardboard", "darts", "inn", "Zen", "crow's", "nest", "BFF", "sheriff", "tiptop", "dot", "bob", "garden", "hose", "blimp", "dress", "shirt", "reimbursement", "capitalism", "step-daughter", "applause", "jig", "jade", "blunt", "application", "rag", "squint", "intern", "sow's", "ear", "brainstorm", "sling", "half", "pinch", "leak", "skating", "rink", "jog", "jammin'", "shrink", "ray", "dent", "scoundrel", "escalator", "cell", "phone", "charger", "kitchen", "knife", "set", "sequins", "ladder", "rung", "Catchphrase", "Words:", "Hard", "Copyright", "©", "2012", "The", "Game", "Gal", "|", "www.thegamegal.com", "flu", "scuff", "mark", "mast", "sash", "modern", "ginger", "clockwork", "mess", "mascot", "runt", "chain", "scar", "tissue", "suntan", "pomp", "scramble", "sentence", "first", "mate", "cuff", "cuticle", "fortnight", "riddle", "spool", "full", "moon", "forever", "rut", "hem", "new", "freight", "train", "diver", "fringe", "humidifier", "handwriting", "dawn", "dimple", "gray", "hairs", "hedge", "plank", "race", "publisher", "fizz", "gem", "ditch", "wool", "plaid", "fancy", "ebony", "and", "ivory", "feast", "Murphy's", "Law", "billboard", "flush", "inconceivable", "tide", "midsummer", "population", "my", "elm", "organ", "flannel", "hatch", "booth"
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
        if (rooms[key] != null) {
            rooms[key]["playerCount"] -= 1;
            removePlayerFromAnyTeam(key, socket.id);
            socket.disconnect;
            if (rooms[key]["playerCount"] == 0) {
                garbageCollectRoom(key);
            }
            else {
                io.in(key).emit('room-data', rooms[key]);
            }
        }
        else {
            console.log('rooms key was null');
        }
        
        
    });

    socket.on('start-game', key => {

        var ready = false;
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
        //validate bid
        const playerHasCurrentBid = (rooms[key]["game"]["currentBidOwner"] == socket.id) ? true : false;
        if (bid < rooms[key]["game"]["currentBid"] && bid > 0 && !playerHasCurrentBid) {
            rooms[key]["game"]["currentBid"] = bid;
            rooms[key]["game"]["currentBidOwner"] = socket.id;
            rooms[key]["game"]["update"]["playerName"] = getPlayerNameFromId(key, socket.id);
            rooms[key]["game"]["update"]["action"] = "bids";
            rooms[key]["game"]["update"]["value"] = bid;
            io.in(key).emit('game-update', rooms[key]["game"]);
            //If the game timer runs out, move past bidding phase
            if (gameTimer != null) {
                clearTimeout(gameTimer);
            }
            gameTimer = setTimeout(function() {
                startGuessPhase(key);
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
    startPreBidPhase(key);
    /*
    gameTimer = setTimeout(function() {
        rooms[key]["game"]["mode"] = "bid";
        rooms[key]["game"]["update"]["playerName"] = "[Game]";
        rooms[key]["game"]["update"]["action"] = "has initiated the bidding phase at a bid of:";
        rooms[key]["game"]["update"]["value"] = rooms[key]["game"]["currentBid"];
        io.in(key).emit('game-update', rooms[key]["game"]);
        gameTimer = setTimeout(function() {
            console.log("game has moved to guess mode");
            rooms[key]["game"]["mode"] = "guess";
            rooms[key]["game"]["update"]["playerName"] = "[Game]";
            rooms[key]["game"]["update"]["action"] = "has closed bidding at bid:";
            rooms[key]["game"]["update"]["value"] = rooms[key]["game"]["currentBid"];
            io.in(key).emit('game-update', rooms[key]["game"]);
        }, BID_TIME);
    }, PRE_BID_TIME); */
}

function startPreBidPhase(key) {
    rooms[key]["game"]["mode"] = "pre-bid";
    rooms[key]["game"]["update"]["playerName"] = "[Game]";
    rooms[key]["game"]["update"]["action"] = "has initiated a pre-bid phase of";
    rooms[key]["game"]["update"]["value"] = (PRE_BID_TIME / 1000).toString().concat(" seconds");
    io.in(key).emit('game-update', rooms[key]["game"]);
    //Add clue givers and clue receivers to separate rooms
    var clients = io.sockets.adapter.rooms[key];
    console.log(clients);
    Object.keys(clients["sockets"]).forEach(person => {
        var tempSocket = io.sockets.connected[person];
        if(isPlayerClueGiver(key, person)) {
            tempSocket.join(key.concat("clue-givers"), function() {
                io.in(key.concat("clue-givers")).emit('words', selectGameWords());
               // io.in(key.concat("clue-receivers")).emit('game-input-panel-mode', rooms[key]["game"]);
            });
        }
        else {
            tempSocket.join(key.concat("clue-receivers"), function() {
                //io.in(key.concat("clue-receivers")).emit('game-input-panel-mode', rooms[key]["game"]);
            });
        }
    });

    
    if (gameTimer != null) {
        clearTimeout(gameTimer);
    }
    gameTimer = setTimeout(function() {
        startBidPhase(key);
    }, PRE_BID_TIME);
}

function startBidPhase(key) {
    rooms[key]["game"]["mode"] = "bid";
    rooms[key]["game"]["update"]["playerName"] = "[Game]";
    rooms[key]["game"]["update"]["action"] = "has initiated the bidding phase at a bid of:";
    rooms[key]["game"]["update"]["value"] = rooms[key]["game"]["currentBid"];
    io.in(key.concat("clue-givers")).emit('game-input-panel-mode', rooms[key]["game"]);
    io.in(key.concat("clue-receivers")).emit('game-input-panel-mode', rooms[key]["game"]);
    io.in(key).emit('game-update', rooms[key]["game"]);
    if (gameTimer != null) {
        clearTimeout(gameTimer);
    }
    gameTimer = setTimeout(function() {
        startGuessPhase(key);
    }, BID_TIME);
}

function startGuessPhase(key) {
    console.log("game has moved to guess mode");
    rooms[key]["game"]["mode"] = "guess";
    rooms[key]["game"]["update"]["playerName"] = "[Game]";
    rooms[key]["game"]["update"]["action"] = "has closed bidding at bid:";
    rooms[key]["game"]["update"]["value"] = rooms[key]["game"]["currentBid"];
    io.in(key).emit('game-update', rooms[key]["game"]);
    if (gameTimer != null) {
        clearTimeout(gameTimer);
    }
    gameTimer = setTimeout(function() {
        startPostGamePhase(key);
    }, GUESS_TIME);
}

function startPostGamePhase(key) {
    console.log("game has ended");
    rooms[key]["game"]["mode"] = "post-game";
    rooms[key]["game"]["update"]["playerName"] = "[Game]";
    rooms[key]["game"]["update"]["action"] = "has ended. The guessing team";
    rooms[key]["game"]["update"]["value"] = "lost";
    io.in(key).emit('game-update', rooms[key]["game"]);
}

function selectGameWords() {

    var words = []
    //choose 1 easy, 2 medium, and 2 hard words
    const word1index = Math.floor((Math.random() * wordBank["easy"].length));
    const word1 = wordBank["easy"][word1index];
    const word2index = Math.floor((Math.random() * wordBank["medium"].length));
    const word2 = wordBank["medium"][word2index];
    const word3index = Math.floor((Math.random() * wordBank["medium"].length));
    const word3 = wordBank["medium"][word3index];
    while (word3 == word2) {
        const word3index = Math.floor((Math.random() * wordBank["medium"].length));
        const word3 = wordBank["medium"][word3index];
    }
    const word4index = Math.floor((Math.random() * wordBank["hard"].length));
    const word4 = wordBank["hard"][word4index];

    const word5index = Math.floor((Math.random() * wordBank["hard"].length));
    const word5 = wordBank["hard"][word5index];
    while (word5 == word4) {
        const word5index = Math.floor((Math.random() * wordBank["hard"].length));
        const word5 = wordBank["hard"][word5index];
    }
    words.push(word1);
    words.push(word2);
    words.push(word3);
    words.push(word4);
    words.push(word5);
    return words;
}

function garbageCollectRoom(key) {
    //rooms[key] = null;
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

function isPlayerClueGiver(key, playerId) {
    var team1 = rooms[key]["team1"];
    var team2 = rooms[key]["team2"];
    var team1ClueGiver = team1[rooms[key]["team1ClueGiverIndex"]];
    var team2ClueGiver = team2[rooms[key]["team2ClueGiverIndex"]];
    console.log(team1ClueGiver, team2ClueGiver);
    
    if (Object.keys(team1ClueGiver)[0] == playerId) {
        return true;
    }

    //not in team 1...
    if (team2ClueGiver == null || Object.keys(team2ClueGiver)[0] == playerId) {
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
    rooms[key]["team1ClueGiverIndex"] = 0;
    rooms[key]["team2ClueGiverIndex"] = 0;
    rooms[key]["gameStarted"] = false;
    rooms[key]["game"] = {};
    rooms[key]["game"]["currentBid"] = 25;
    rooms[key]["game"]["update"] = {};
}