/*

Updates to complete for version 1.0.0:

Dev log - DONE
Game clock
Guessed word icon - DONE
Game updates basic style UI - DONE(almost)
Front page modal - DONE
Enter sends guess / clue - DONE
Words cycle upon failure to bid
Multiple words
Attempt to decide winner / give that info
Play again button
Instructions, FAQ, etc. on front page

To-do list:

In no particular order...

- Game clock UI, functionality
- Show more game data (teams list?) on larger views
- Guessed word has icon
- Big style updates for game updates panel:
    - color code updates
    - scrollability
    - clues stay at top? (probably not)
- dev log / update log on front page
- add modal for name, room # on front page join and create room buttons
- make X player cluegiver in lobby / hover over eye to see what it means
- modify game settings in lobby
- enter / return sends clue / guess
- parse multiple words as multiple clues
- track and display clue-words remaining
- attempt to decide a winner or loser after game timer runs out
- play again / return to lobby after game ends
- words cycle if no bid is made
- make words better
- fix security flaws:
    - check for null / handle errors appropriately, server can't crash randomly!
    - verify that user is in the room they claim to be in: overall,
    - verify all user messages that could possibly be faked
- probably make better styling for the entire site, not that important though (change color scheme)
- and, probably define an actual style and feel for the site, not just a font and 1-2 primary colors.
- I'm thinking more than that.
- footer, attribution, contact, donate button, details like that (and: report bug feature)
- animations for important react state changes
- upgrade heroku plan, get a proper domain name
- spread on social media :)
- create a testing / prod server split
*/

'use strict';

const express = require('express');
const socketIO = require('socket.io');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

console.log(PORT);

const httpOptions = { 
    root: __dirname,
};

const server = express()
    .use((req, res) => 
    res.sendFile(INDEX, httpOptions))
    .use(express.static('static'))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));


const io = socketIO(server);

var gameTimer;
const BID_TIME = 3000; //ms
const PRE_BID_TIME = 100; //ms
const PRE_GUESS_TIME = 100;
const GUESS_TIME = 300000;

var rooms = {}; //track room data
var words = {}; //track words for rooms in a (key - words list) dictionary
var IdToRoom = {};
var wordBank = 
    {
        "easy" : 
            [
                "baby", "door", "banana", "finger", "fence", "big", "swimming", "pool", "sun", "church", "yo-yo", "boy", "bag", "alligator", "mouse", "birthday", "winter", "beach", "tree", "teacher", "king", "telephone", "eye", "water", "jelly", "balloon", "toothbrush", "pants", "mom", "body", "bike", "toilet", "paper", "baseball", "pig", "lawn", "mower", "fire", "school", "belt", "pajamas", "mud", "ice", "cream", "cone", "arm", "drums", "spider", "shark", "seashell", "computer", "grandma", "pillow", "kite", "homework", "ladybug", "bed", "bird", "gum", "book", "dress", "queen", "puppy", "happy", "doctor", "frog", "blanket", "popsicle", "pen", "sandwich", "boat", "dad", "lunchbox", "ice", "bottle", "elbow", "penny", "broom", "dog", "rose", "picnic", "chair", "duck", "hair", "zoo", "party", "piano", "key", "apple", "chalk", "park", "clock", "pencil", "hill", "flag", "lollipop", "candle", "flower", "basketball", "hug", "clown", "paper", "mountain", "nose", "cow", "grown-up", "grass", "rainbow", "hide-and-seek", "pocket", "grape", "cowboy", "doll", "forehead", "football", "crayon", "desk", "TV", "bedtime", "hopscotch", "dump", "truck", "cold", "paint", "ear", "moon",
            ],
        "medium" :
            [
                "taxi", "cab", "standing", "ovation", "alarm", "clock", "tool", "banana", "peel", "flagpole", "money", "wallet", "ballpoint", "pen", "sunburn", "wedding", "ring", "spy", "baby-sitter", "aunt", "acne", "bib", "puzzle", "piece", "pawn", "astronaut", "tennis", "shoes", "blue", "jeans", "twig", "outer", "space", "banister", "batteries", "doghouse", "campsite", "plumber", "bedbug", "throne", "tiptoe", "log", "mute", "pogo", "stick", "stoplight", "ceiling", "fan", "bedspread", "bite", "stove", "windmill", "nightmare", "stripe", "spring", "wristwatch", "eat", "matchstick", "gumball", "bobsled", "bonnet", "flock", "sprinkler", "living", "room", "laugh", "snuggle", "sneeze", "bud", "elf", "headache", "slam", "dunk", "Internet", "saddle", "ironing", "board", "bathroom", "scale", "kiss", "shopping", "cart", "shipwreck", "funny", "glide", "lamp", "candlestick", "grandfather", "rocket", "home", "movies", "seesaw", "rollerblades", "smog", "grill", "goblin", "coach", "claw", "cloud", "shelf", "recycle", "glue", "stick", "Christmas", "carolers", "front", "porch", "earache", "robot", "foil", "rib", "robe", "crumb", "paperback", "hurdle", "rattle", "fetch", "date", "iPod", "dance", "cello", "flute", "dock", "prize", "dollar", "puppet", "brass", "firefighter", "huddle", "easel", "pigpen", "bunk", "bed", "bowtie", "fiddle", "dentist", "baseboards", "letter", "opener", "photographer", "magic", "Old", "Spice", "monster"
            ],
        "hard" :
            [
                "whatever", "buddy", "sip", "chicken", "coop", "blur", "chime", "bleach", "clay", "blossom", "cog", "twitterpated", "wish", "through", "feudalism", "whiplash", "cot", "blueprint", "beanstalk", "think", "cardboard", "darts", "inn", "Zen", "crow's", "nest", "BFF", "sheriff", "tiptop", "dot", "bob", "garden", "hose", "blimp", "dress", "shirt", "reimbursement", "capitalism", "step-daughter", "applause", "jig", "jade", "blunt", "application", "rag", "squint", "intern", "sow's", "ear", "brainstorm", "sling", "half", "pinch", "leak", "skating", "rink", "jog", "jammin'", "shrink", "ray", "dent", "scoundrel", "escalator", "cell", "phone", "charger", "kitchen", "knife", "set", "sequins", "ladder", "rung", "flu", "scuff", "mark", "mast", "sash", "modern", "ginger", "clockwork", "mess", "mascot", "runt", "chain", "scar", "tissue", "suntan", "pomp", "scramble", "sentence", "first", "mate", "cuff", "cuticle", "fortnight", "riddle", "spool", "full", "moon", "forever", "rut", "hem", "new", "freight", "train", "diver", "fringe", "humidifier", "handwriting", "dawn", "dimple", "gray", "hairs", "hedge", "plank", "race", "publisher", "fizz", "gem", "ditch", "wool", "plaid", "fancy", "ebony", "and", "ivory", "feast", "Murphy's", "Law", "billboard", "flush", "inconceivable", "tide", "midsummer", "population", "my", "elm", "organ", "flannel", "hatch", "booth"
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
        console.log(name);
        var socketId = socket.id;
        socket.join(key, function() {
            IdToRoom[socketId] = key;
            socket.emit('create-room-success', key);
            io.in(key).emit('room-data', rooms[key]);
        });
        
    });

    
    socket.on('join-team', (key, name, teamNumber) => {
        console.log("server received join-team, attempting to remove that player");
        console.log(rooms[key]);
        removePlayerFromAnyTeam(key, socket.id);
        if (!addToDesiredTeam(key, name, socket.id, teamNumber)) {
            //This shouldn't happen unless someone is calling their own code
            console.log("this shouldnt happen (desired not available)");
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
            console.log("recieved leave-room, key not null, attempting to remove");
            console.log(rooms[key]);
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
        console.log("got player bid");
        //validate bid
        const playerHasCurrentBid = (rooms[key]["game"]["currentBidOwner"] == socket.id) ? true : false;
        console.log(bid, rooms[key]["game"]["currentBid"], playerHasCurrentBid, isPlayerClueGiver(key, socket.id));
        if (bid < rooms[key]["game"]["currentBid"] && bid > 0 && !playerHasCurrentBid  && isPlayerClueGiver(key, socket.id)) {
            console.log("validated");
            rooms[key]["game"]["currentBid"] = bid;
            rooms[key]["game"]["currentBidOwner"] = socket.id;
            rooms[key]["game"]["update"]["playerName"] = getPlayerNameFromId(key, socket.id);
            rooms[key]["game"]["update"]["action"] = "bids";
            rooms[key]["game"]["update"]["value"] = bid;
            rooms[key]["game"]["update"]["className"] = "game-update-bid";
            
            io.in(key.concat("clue-givers")).emit('game-update', rooms[key]["game"]);
            rooms[key]["game"]["mode"] = "bid-sidelines";
            io.in(key.concat("clue-receivers")).emit('game-update', rooms[key]["game"]);
            rooms[key]["game"]["mode"] = "bid";
            //If the game timer runs out, move past bidding phase
            if (gameTimer != null) {
                clearTimeout(gameTimer);
            }
            gameTimer = setTimeout(function() {
                startPreGuessPhase(key);
            }, BID_TIME);
        }
        
    });

    socket.on('give-clue', (key, clue) => {
        //validate this person as a cluegiver
        if (isPlayerActiveClueGiver(key, socket.id)) {
            rooms[key]["game"]["update"]["playerName"] = getPlayerNameFromId(key, socket.id);
            rooms[key]["game"]["update"]["action"] = "gives clue";
            rooms[key]["game"]["update"]["value"] = clue;
            rooms[key]["game"]["update"]["className"] = "game-update-clue";
            console.log("emitting a game update to", io.sockets.adapter.rooms[key]);
            sendUpdateDuringGuessPhase(key);
        }
    });

    socket.on('give-guess', (key, guess) => {
        if (isPlayerActiveGuesser(key, socket.id)) {
            rooms[key]["game"]["update"]["playerName"] = getPlayerNameFromId(key, socket.id);
            if (words[key].includes(guess)) {
                rooms[key]["game"]["update"]["action"] = "CORRECTLY guesses";
                rooms[key]["game"]["update"]["className"] = "game-update-guess-correct";
                io.in(key).emit('word-guessed', guess, words[key].indexOf(guess));
                //emit a word update
            }
            else {
                rooms[key]["game"]["update"]["action"] = "incorrectly guesses";
                rooms[key]["game"]["update"]["className"] = "game-update-guess-incorrect";
            }
            rooms[key]["game"]["update"]["value"] = guess;
            sendUpdateDuringGuessPhase(key);
        }
    });

    socket.on('clock-test-event', key => {
        io.in(key).emit('reset-clock', 10);
    });

    socket.on('disconnect', function() {
        //Find out which room they were in
        var socketId = socket.id;
        var key = IdToRoom[socketId];
        if (key != null) {
            rooms[key]["playerCount"] -= 1;
            console.log("received disconnect, attempting to remove");
            console.log(rooms[key]);
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
    words[key] = selectGameWords();
    startPreBidPhase(key);
}

function startPreBidPhase(key) {
    rooms[key]["game"]["mode"] = "pre-bid";
    rooms[key]["game"]["update"]["playerName"] = "[Game]";
    rooms[key]["game"]["update"]["action"] = "has initiated a pre-bid phase of";
    rooms[key]["game"]["update"]["value"] = (PRE_BID_TIME / 1000).toString().concat(" seconds");
    rooms[key]["game"]["update"]["className"] = "game-update-phase-change";
    io.in(key).emit('game-update', rooms[key]["game"]);
    //Add clue givers and clue receivers to separate rooms
    var clients = io.sockets.adapter.rooms[key];
    console.log(clients);
    Object.keys(clients["sockets"]).forEach(person => {
        var tempSocket = io.sockets.connected[person];
        if(isPlayerClueGiver(key, person)) {
            tempSocket.join(key.concat("clue-givers"), function() {
                io.in(key.concat("clue-givers")).emit('words', words[key]);
               // io.in(key.concat("clue-receivers")).emit('game-input-panel-mode', rooms[key]["game"]);
            });
        }
        else {
            console.log("player is not a clue giver. wtf?");
            tempSocket.join(key.concat("clue-receivers"), function() {
                console.log("here's rooms in the cb function \n,", io.sockets.adapter.rooms)
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
    console.log("started bid phase");
    rooms[key]["game"]["mode"] = "bid";
    rooms[key]["game"]["update"]["playerName"] = "[Game]";
    rooms[key]["game"]["update"]["action"] = "has initiated the bidding phase at a bid of:";
    rooms[key]["game"]["update"]["value"] = rooms[key]["game"]["currentBid"];
    rooms[key]["game"]["update"]["className"] = "game-update-phase-change";
    io.in(key.concat("clue-givers")).emit('game-update', rooms[key]["game"]);
    rooms[key]["game"]["mode"] = "bid-sidelines";
    io.in(key.concat("clue-receivers")).emit('game-update', rooms[key]["game"]);
    rooms[key]["game"]["mode"] = "bid";
    if (gameTimer != null) {
        clearTimeout(gameTimer);
    }
    gameTimer = setTimeout(function() {
        startPreGuessPhase(key);
    }, BID_TIME);
}

function startPreGuessPhase(key) {

    console.log("game has moved to pre guess phase");
    rooms[key]["game"]["update"]["playerName"] = "[Game]";
    rooms[key]["game"]["update"]["action"] = "has closed bidding. Player ".concat(getPlayerNameFromId(key, rooms[key]["game"]["currentBidOwner"])).concat(" wins the bidding at ".concat(rooms[key]["game"]["currentBid"])).concat(" words");
    rooms[key]["game"]["update"]["value"] = "";
    rooms[key]["game"]["update"]["className"] = "game-update-phase-change";
    io.in(key).emit('game-update', rooms[key]["game"]);

    rooms[key]["game"]["update"]["playerName"] = "[Game]";
    rooms[key]["game"]["update"]["action"] = "will initiate guessing phase in";
    rooms[key]["game"]["update"]["value"] = (PRE_GUESS_TIME / 1000).toString().concat(" seconds");
    rooms[key]["game"]["update"]["className"] = "game-update-phase-change";

    //Once bidding is done we can split the players into 4 groups:
    //Playing team cluegiver key|clue-givers-playing
    //Playing team clueguessers key|clue-receivers-playing
    //Non playing team clue giver key|clue-givers-resting
    //Non playing team extras key|clue-receivers-resting

    var clueGivers = io.sockets.adapter.rooms[key.concat("clue-givers")];
    console.log(key.concat("clue-receivers"), io.sockets.adapter.rooms);
    var clueReceivers = io.sockets.adapter.rooms[key.concat("clue-receivers")];
    console.log(clueReceivers, "is clue receierfs...");
    var playingTeam = returnTeamNumber(key, rooms[key]["game"]["currentBidOwner"]);
    Object.keys(clueGivers["sockets"]).forEach(person => {
        var tempSocket = io.sockets.connected[person];
        if(returnTeamNumber(key, tempSocket.id) == playingTeam) {
            //This is the clue giver on the playing team
            tempSocket.join(key.concat("clue-givers-playing"), function() {
                rooms[key]["game"]["mode"] = "pre-guess-giver";
                io.in(key.concat("clue-givers-playing")).emit('game-update', rooms[key]["game"]);
            });
        }
        else {
            //This is the clue giver on the NOT playing team
            tempSocket.join(key.concat("clue-givers-resting"), function() {
                rooms[key]["game"]["mode"] = "pre-guess-sidelines";
                io.in(key.concat("clue-givers-resting")).emit('game-update', rooms[key]["game"]);
            });
        }
    });
    if (clueReceivers != null) {
        Object.keys(clueReceivers["sockets"]).forEach(person => {
            var tempSocket = io.sockets.connected[person];
            if(returnTeamNumber(key, tempSocket.id) == playingTeam) {
                //This is the clue giver on the playing team
                tempSocket.join(key.concat("clue-receivers-playing"), function() {
                    rooms[key]["game"]["mode"] = "pre-guess-guesser";
                    io.in(key.concat("clue-receivers-playing")).emit('game-update', rooms[key]["game"]);
                });
            }
            else {
                //This is the clue giver on the NOT playing team
                tempSocket.join(key.concat("clue-receivers-resting"), function() {
                    rooms[key]["game"]["mode"] = "pre-guess-sidelines";
                    io.in(key.concat("clue-receivers-resting")).emit('game-update', rooms[key]["game"]);
                });
            }
        });
    }
    else {
        console.log("need more people, test message");
    }

    //Once a team has been decided, we can show the words to the resting team
    io.in(key.concat("clue-receivers-resting")).emit('words', words[key]);
    

    if (gameTimer != null) {
        clearTimeout(gameTimer);
    }
    gameTimer = setTimeout(function() {
        startGuessPhase(key);
    }, PRE_GUESS_TIME);
}

function startGuessPhase(key) {
    console.log("game has moved to guess mode");
    rooms[key]["game"]["update"]["playerName"] = "[Game]";
    rooms[key]["game"]["update"]["action"] = "has initiated the guessing phase for ";
    rooms[key]["game"]["update"]["value"] = (GUESS_TIME / 1000).toString().concat(" seconds");
    rooms[key]["game"]["update"]["className"] = "game-update-phase-change";
    console.log(io.sockets.adapter.rooms);
    sendUpdateDuringGuessPhase(key);

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
    rooms[key]["game"]["update"]["action"] = "has ended.";
    rooms[key]["game"]["update"]["value"] = "";
    rooms[key]["game"]["update"]["className"] = "game-update-phase-change";
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

function sendUpdateDuringGuessPhase(key) {
    //send the right modes to the right players

    rooms[key]["game"]["mode"] = "guess-sidelines";
    io.in(key.concat("clue-receivers-resting")).emit('game-update', rooms[key]["game"]);
    io.in(key.concat("clue-givers-resting")).emit('game-update', rooms[key]["game"]);

    rooms[key]["game"]["mode"] = "guess-giver";
    io.in(key.concat("clue-givers-playing")).emit('game-update', rooms[key]["game"]);

    rooms[key]["game"]["mode"] = "guess-receiver";
    io.in(key.concat("clue-receivers-playing")).emit('game-update', rooms[key]["game"]);
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
    console.log("now, adding", playerId, name, "to desired team", number);
    if (rooms[key]["team".concat(number)].length < 4) {
        var newMember = {};
        newMember[playerId] = name;
        rooms[key]["team".concat(number)].push(newMember);
        console.log("adding to desired succeeded");
        return true;
    }
    console.log("adding to desired failed");
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

function isPlayerActiveClueGiver(key, playerId) {
    var clients = io.sockets.adapter.rooms[key.concat("clue-givers-playing")];
    console.log(clients);
    var result = false;
    Object.keys(clients["sockets"]).forEach(person => {
        console.log(person);
        //should only be one, but re-using this code
        if (person == playerId) {
            console.log("player IS active clue giver");
            result = true;
        }
    });
    return result;
    
}

function isPlayerActiveGuesser(key, playerId) {
    var clients = io.sockets.adapter.rooms[key.concat("clue-receivers-playing")];
    console.log(clients);
    var result = false;
    Object.keys(clients["sockets"]).forEach(person => {
        //should only be one, but re-using this code
        if (person == playerId) {
            console.log("player IS active guiesser");
            result = true;
        }
    });
    return result;
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
    console.log("calling remove player from any team");
    var team1 = rooms[key]["team1"];
    var team2 = rooms[key]["team2"];
    for (var i = 0; i < team1.length; i++) {
        if (Object.keys(team1[i])[0] == playerId) {
            team1.splice(i, 1);
            console.log("removed ", playerId, "from team 1");
            console.log("AFTER REMOVING: \n", rooms[key]);
            return;
        }
    }

    //not in team 1...
    for (var i = 0; i < team2.length; i++) {
        if (Object.keys(team2[i])[0] == playerId) {
            team2.splice(i, 1);
            console.log("removed ", playerId, "from team 2");
            console.log("AFTER REMOVING: \n", rooms[key]);
            return;
        }
    }

    console.log("failed to remove a player");
    
    
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