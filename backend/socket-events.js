const constants = require('./constants');
const wordBank = constants.wordBank;
const gameDefaults = constants.gameDefaults;

var rooms = {}; //track room data
var words = {}; //track words for rooms in a (key - words list) dictionary
var IdToRoom = {}; //player ID -> their currently inhabited room
var io; //placeholder for the io given as parameter

function setUpSocketEvents(serverIO) {
    io = serverIO;
    io.on('connect', socket => {

        /*
        Immediately upon connection, tell the client its user ID 
        for improving client side operations */

        io.to(socket.id).emit('client-id-notification', socket.id);

        /* Upon joining a room, send a new room-data emit to all room
        members */
        socket.on('join-room', (key, name) => {
            if (name.length > 32) {
                name = name.substring(0, 32);
            }
            
            if (rooms[key] != null) {
                if (rooms[key]["gameStarted"]) {
                    socket.emit('join-room-fail');
                }
                else if (rooms[key]["playerCount"] == 16) {
                    socket.emit('join-room-fail');
                }
                else {
                    rooms[key]["playerCount"] += 1;
                    var socketId = socket.id;
                    addToFirstAvailableTeam(key, name, socketId);
                    socket.join(key, function() {
                        IdToRoom[socketId] = key;
                        var scores = {1: rooms[key]["team1Score"], 2: rooms[key]["team2Score"]};
                        socket.emit('join-room-success', key, name, rooms[key], scores);
                        io.in(key).emit('room-data', rooms[key]);
                        //io.in(key).emit('score-update-main', {1: rooms[key]["team1Score"], 2: rooms[key]["team2Score"]});
                    });
                }
            }
            else {
                socket.emit('join-room-fail');
            }
        });

        socket.on('create-room', name => {
            if (name.length > 32) {
                name = name.substring(0, 32);
            }
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
            if (name.length > 32) {
                name = name.substring(0, 32);
            }
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

        socket.on('change-settings', (key, data) => {
            if (data["preBidTime"] > 30) {
                rooms[key]["preBidTime"] = 30000;
            }
            else if (data["preBidTime"] < 1) {
                rooms[key]["preBidTime"] = 1000;
            }
            else {
                rooms[key]["preBidTime"] = data["preBidTime"] * 1000;
            }

            if (data["bidTime"] > 30) {
                rooms[key]["bidTime"] = 30000;
            }
            else if (data["bidTime"] < 5) {
                rooms[key]["bidTime"] = 5000;
            }
            else {
                rooms[key]["bidTime"] = data["bidTime"] * 1000;
            }

            if (data["guessTime"] > 300) {
                rooms[key]["guessTime"] = 300000;
            }
            else if (data["guessTime"] < 15) {
                rooms[key]["guessTime"] = 15000;
            }
            else {
                rooms[key]["guessTime"] = data["guessTime"] * 1000;
            }
        
            io.in(key).emit('change-settings-server', rooms[key]);
            io.in(key).emit('change-settings-main', rooms[key]);
        });

        socket.on('start-game', key => {
            var ready = false;
            if (rooms[key]["team1"].length >= 2 && rooms[key]["team2"].length >= 2) {
                ready = true;
            }

            //ready = true; //delete

            if (ready) {
                startGame(key);
            }
            else {
                //shouldn't happen, but...
                //console.log("start game sent to server but not ready");
            }
        });

        socket.on('player-bid', (key, bid) => {
            //validate bid
            const playerHasCurrentBid = (rooms[key]["game"]["currentBidOwner"] == socket.id) ? true : false;
            if (bid < rooms[key]["game"]["currentBid"] && bid > 0 && !playerHasCurrentBid  && isPlayerClueGiver(key, socket.id) && rooms[key]["game"]["mode"] == "bid") {
                rooms[key]["game"]["currentBid"] = bid;
                rooms[key]["game"]["currentBidOwner"] = socket.id;
                rooms[key]["game"]["bidExists"] = false;
                rooms[key]["game"]["update"]["playerName"] = getPlayerNameFromId(key, socket.id);

                // X D
                if (bid < 6) {
                    rooms[key]["game"]["update"]["action"] = "very recklessly bids";
                }
                else if (bid < 7) {
                    rooms[key]["game"]["update"]["action"] = "quite recklessly bids";
                }
                else {
                    rooms[key]["game"]["update"]["action"] = "bids";
                }
                rooms[key]["game"]["update"]["value"] = bid;
                rooms[key]["game"]["update"]["className"] = "game-update-bid";
                
                io.in(key.concat("clue-givers")).emit('game-update', rooms[key]["game"]);
                rooms[key]["game"]["mode"] = "bid-sidelines";
                
                io.in(key.concat("clue-receivers")).emit('game-update', rooms[key]["game"]);
                rooms[key]["game"]["mode"] = "bid";

                //If the game timer runs out, move past bidding phase
                if (rooms[key]["timer"] != null) {
                    clearTimeout(rooms[key]["timer"]);
                }
                io.in(key).emit('reset-clock', rooms[key]["bidTime"] / 1000);
                rooms[key]["timer"] = setTimeout(function() {
                    startPreGuessPhase(key);
                }, rooms[key]["bidTime"]);
            }
            
        });

        socket.on('give-clue', (key, clue) => {
            if (rooms[key]["game"]["mode"] != "post-game") {
                //validate this person as a cluegiver
                if (isPlayerActiveClueGiver(key, socket.id)) {
                    processAndAddClues(key, clue);
                    rooms[key]["game"]["update"]["playerName"] = getPlayerNameFromId(key, socket.id);
                    rooms[key]["game"]["update"]["action"] = "gives clue: ";
                    rooms[key]["game"]["update"]["value"] = `'${clue}' (${rooms[key]["game"]["cluesGiven"].length}/${rooms[key]["game"]["currentBid"]})`;
                    rooms[key]["game"]["update"]["className"] = "game-update-clue";
                    sendUpdateDuringGuessPhase(key);
                    if (rooms[key]["game"]["cluesGiven"].length > rooms[key]["game"]["currentBid"]) {
                        if (rooms[key]["timer"] != null) {
                            clearTimeout(rooms[key]["timer"]);
                        }
                        startPostGamePhase(key);
                    }
                }
            }
            
        });

        socket.on('give-guess', (key, guess) => {
            if (rooms[key]["game"]["mode"] != "post-game") {
                if (isPlayerActiveGuesser(key, socket.id)) {
                    rooms[key]["game"]["update"]["playerName"] = getPlayerNameFromId(key, socket.id);
                    guess = guess.toLowerCase();
                    var correct = false;
                    for (var i = 0; i < words[key].length; i++) {
                        if (guess.includes(words[key][i])) { //correct guess
                            if (rooms[key]["game"]["guessedWords"].includes(words[key][i])) { //repeated guess
                                rooms[key]["game"]["update"]["action"] = "submits an already guessed word: ";
                                rooms[key]["game"]["update"]["className"] = "game-update-guess-correct-repeated";
                                rooms[key]["game"]["update"]["value"] = words[key][i];
                            }
                            else {
                                rooms[key]["game"]["update"]["action"] = "CORRECTLY guesses";
                                rooms[key]["game"]["update"]["className"] = "game-update-guess-correct";
                                rooms[key]["game"]["update"]["value"] = words[key][i];
                                rooms[key]["game"]["guessedWords"].push(words[key][i]); // guess - > words[key][i]
                                
                            }
                            io.in(key).emit('word-guessed', words[key][i], i);
                            correct = true;
                        }
                    }
                    if (!correct) {
                        rooms[key]["game"]["update"]["action"] = "incorrectly guesses";
                        rooms[key]["game"]["update"]["className"] = "game-update-guess-incorrect";
                        rooms[key]["game"]["update"]["value"] = guess;
                    }
                    
                    sendUpdateDuringGuessPhase(key);
                    if (rooms[key]["game"]["guessedWords"].length == 5) {
                        //if all words have been guessed, end the round early
                        if (rooms[key]["timer"] != null) {
                            clearTimeout(rooms[key]["timer"]);
                        }
                        startPostGamePhase(key);
                    }
                }
            }
        });

        socket.on('ready-up', key => {
            var arr = rooms[key]["readyPlayers"];
            if (arr.includes(socket.id)) {
                var index = arr.indexOf(socket.id);
                arr.splice(index, 1);
            }
            else {
                arr.push(socket.id);
            }
            io.in(key).emit('ready-up-server', rooms[key]["readyPlayers"]);
            if (arr.length == rooms[key]["playerCount"]) {
                restartGame(key);
            }
        });

        socket.on('clock-test-event', key => {
            io.in(key).emit('reset-clock', 10);
        });

        socket.on('disconnect', function() {
            //Find out which room they were in
            var socketId = socket.id;
            //ERROR: IdToRoom not defined (crash)
            try {
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
            }
            catch(err) {
                console.log("Within socket.on('disconnect'), the err", err, "occurred. Who knows what it means?");
            }
            
        });
    });
}    

/* 
----------------------------
HELPER FUNCTIONS 
----------------------------
*/

function startGame(key) {
    rooms[key]["gameStarted"] = true;
    io.in(key).emit('start-game-server', rooms[key]);
    words[key] = selectGameWords();
    startPreBidPhase(key);
}

function startPreBidPhase(key) {
    rooms[key]["game"]["mode"] = "pre-bid";
    rooms[key]["game"]["update"]["playerName"] = "[Game]";
    rooms[key]["game"]["update"]["action"] = "has initiated a pre-bid phase of";
    rooms[key]["game"]["update"]["value"] = (rooms[key]["preBidTime"] / 1000).toString().concat(" seconds");
    rooms[key]["game"]["update"]["className"] = "game-update-phase-change";
    io.in(key).emit('game-update', rooms[key]["game"]);
    io.in(key).emit('room-data', rooms[key]);
    //Add clue givers and clue receivers to separate rooms
    var clients = io.sockets.adapter.rooms[key];
    Object.keys(clients["sockets"]).forEach(person => {
        var tempSocket = io.sockets.connected[person];
        if(isPlayerClueGiver(key, person)) {
            
            tempSocket.join(key.concat("clue-givers"), function() {
                io.in(key.concat("clue-givers")).emit('words', words[key]);
            });
        }
        else {
            tempSocket.join(key.concat("clue-receivers"), function() {

            });
        }
    });

    
    if (rooms[key]["timer"] != null) {
        clearTimeout(rooms[key]["timer"]);
    }
    io.in(key).emit('reset-clock', rooms[key]["preBidTime"] / 1000);
    rooms[key]["timer"] = setTimeout(function() {
        startBidPhase(key);
    }, rooms[key]["preBidTime"]);
}

function startBidPhase(key) {
    rooms[key]["game"]["mode"] = "bid";
    rooms[key]["game"]["bidExists"] = false;
    rooms[key]["game"]["update"]["playerName"] = "[Game]";
    rooms[key]["game"]["update"]["action"] = "has initiated the bidding phase at a bid of:";
    rooms[key]["game"]["update"]["value"] = rooms[key]["game"]["currentBid"];
    rooms[key]["game"]["update"]["className"] = "game-update-phase-change";
    io.in(key.concat("clue-givers")).emit('game-update', rooms[key]["game"]);
    rooms[key]["game"]["mode"] = "bid-sidelines";
    io.in(key.concat("clue-receivers")).emit('game-update', rooms[key]["game"]);
    rooms[key]["game"]["mode"] = "bid";
    if (rooms[key]["timer"] != null) {
        clearTimeout(rooms[key]["timer"]);
    }
    io.in(key).emit('reset-clock', rooms[key]["bidTime"] / 1000);
    rooms[key]["timer"] = setTimeout(function() {
        if (rooms[key]["game"]["bidExists"]) {
            
            startPreGuessPhase(key);
        }
        else {
            //no bid exists, so cycle the words and restart the pre-bid phase
            words[key] = selectGameWords();
            rooms[key]["game"]["update"]["playerName"] = "Neither clue giver";
            rooms[key]["game"]["update"]["action"] = "made a bid in time. Sending new words...";
            rooms[key]["game"]["update"]["value"] = "";
            rooms[key]["game"]["update"]["className"] = "game-update-phase-change";
            io.in(key).emit('game-update', rooms[key]["game"]);
            startPreBidPhase(key);
        }
    }, rooms[key]["bidTime"]);
}

function startPreGuessPhase(key) {
    rooms[key]["game"]["update"]["playerName"] = "[Game]";
    rooms[key]["game"]["update"]["action"] = "has closed bidding. Player ".concat(getPlayerNameFromId(key, rooms[key]["game"]["currentBidOwner"])).concat(" wins the bidding at ".concat(rooms[key]["game"]["currentBid"])).concat(" words");
    rooms[key]["game"]["update"]["value"] = "";
    rooms[key]["game"]["update"]["className"] = "game-update-phase-change";
    io.in(key).emit('game-update', rooms[key]["game"]);

    rooms[key]["game"]["update"]["playerName"] = "[Game]";
    rooms[key]["game"]["update"]["action"] = "will initiate guessing phase in";
    rooms[key]["game"]["update"]["value"] = (gameDefaults["PRE_GUESS_TIME"] / 1000).toString().concat(" seconds");
    rooms[key]["game"]["update"]["className"] = "game-update-phase-change";

    //Once bidding is done we can split the players into 4 groups:
    //Playing team cluegiver key|clue-givers-playing
    //Playing team clueguessers key|clue-receivers-playing
    //Non playing team clue giver key|clue-givers-resting
    //Non playing team extras key|clue-receivers-resting

    var clueGivers = io.sockets.adapter.rooms[key.concat("clue-givers")];
    var clueReceivers = io.sockets.adapter.rooms[key.concat("clue-receivers")];
    var playingTeam = returnTeamNumber(key, rooms[key]["game"]["currentBidOwner"]);

    //Crashes here often when refreshing the page
    Object.keys(clueGivers["sockets"]).forEach(person => {
        var tempSocket = io.sockets.connected[person];
        if(returnTeamNumber(key, tempSocket.id) == playingTeam) {
            //This is the clue giver on the playing team
            tempSocket.join(key.concat("clue-givers-playing"), function() {
                rooms[key]["game"]["activeClueGiver"] = tempSocket.id;
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
                
                
                tempSocket.join(key.concat("clue-receivers-playing"), function() {
                    rooms[key]["game"]["mode"] = "pre-guess-guesser";
                    io.in(key.concat("clue-receivers-playing")).emit('game-update', rooms[key]["game"]);
                });
            }
            else {
                
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
    

    if (rooms[key]["timer"] != null) {
        clearTimeout(rooms[key]["timer"]);
    }
    io.in(key).emit('reset-clock', gameDefaults["PRE_GUESS_TIME"] / 1000);
    rooms[key]["timer"] = setTimeout(function() {
        startGuessPhase(key);
    }, gameDefaults["PRE_GUESS_TIME"]);
}

function startGuessPhase(key) {
    rooms[key]["game"]["update"]["playerName"] = "[Game]";
    rooms[key]["game"]["update"]["action"] = "has initiated the guessing phase for";
    rooms[key]["game"]["update"]["value"] = (rooms[key]["guessTime"] / 1000).toString().concat(" seconds");
    rooms[key]["game"]["update"]["className"] = "game-update-phase-change";
    sendUpdateDuringGuessPhase(key);

    if (rooms[key]["timer"] != null) {
        clearTimeout(rooms[key]["timer"]);
    }
    io.in(key).emit('reset-clock', rooms[key]["guessTime"] / 1000);
    rooms[key]["timer"] = setTimeout(function() {
        startPostGamePhase(key);
    }, rooms[key]["guessTime"]);
}

function startPostGamePhase(key) {
    io.in(key).emit('stop-clock');
    rooms[key]["game"]["mode"] = "post-game";
    rooms[key]["game"]["update"]["playerName"] = "[Game]";
    rooms[key]["game"]["update"]["action"] = "has ended.";
    rooms[key]["game"]["update"]["value"] = "";
    rooms[key]["game"]["update"]["className"] = "game-update-phase-change";
    io.in(key).emit('game-update', rooms[key]["game"]);
    io.in(key).emit('words', words[key]);
    rooms[key]["game"]["update"]["playerName"] = getPlayerNameFromId(key, rooms[key]["game"]["activeClueGiver"]);
    rooms[key]["game"]["update"]["action"] = "gave";
    rooms[key]["game"]["update"]["value"] = `${rooms[key]["game"]["cluesGiven"].length} out of ${rooms[key]["game"]["currentBid"]} clues allowed!`;
    rooms[key]["game"]["update"]["className"] = "game-update-phase-change";
    io.in(key).emit('game-update', rooms[key]["game"]);
    var winningTeam = determineWinnerAndUpdateScore(key);
    rooms[key]["game"]["update"]["playerName"] = "Team " + winningTeam
    rooms[key]["game"]["update"]["action"] = "wins a point";
    rooms[key]["game"]["update"]["value"] = "via automated scoring";
    rooms[key]["game"]["update"]["className"] = "game-update-phase-change";
    io.in(key).emit('game-update', rooms[key]["game"]);
    io.in(key).emit('score-update', {1: rooms[key]["team1Score"], 2: rooms[key]["team2Score"]});
    io.in(key).emit('score-update-main', {1: rooms[key]["team1Score"], 2: rooms[key]["team2Score"]});
}

function selectGameWords() {
    var words = [];
    var pack = "bonnie-new";

    const word1index = Math.floor((Math.random() * wordBank[pack].length));
    const word1 = wordBank[pack][word1index];
    const word2index = Math.floor((Math.random() * wordBank[pack].length));
    const word2 = wordBank[pack][word2index];
    while (word2 == word1) {
        const word2index = Math.floor((Math.random() * wordBank[pack].length));
        const word2 = wordBank[pack][word2index];
    }
    const word3index = Math.floor((Math.random() * wordBank[pack].length));
    const word3 = wordBank[pack][word3index];
    while (word3 == word2) {
        const word3index = Math.floor((Math.random() * wordBank[pack].length));
        const word3 = wordBank[pack][word3index];
    }
    const word4index = Math.floor((Math.random() * wordBank[pack].length));
    const word4 = wordBank[pack][word4index];
    while (word4 == word3) {
        const word4index = Math.floor((Math.random() * wordBank[pack].length));
        const word4 = wordBank[pack][word4index];
    }
    const word5index = Math.floor((Math.random() * wordBank[pack].length));
    const word5 = wordBank[pack][word5index];
    while (word5 == word4) {
        const word5index = Math.floor((Math.random() * wordBank[pack].length));
        const word5 = wordBank[pack][word5index];
    }
    words.push(word1);
    words.push(word2);
    words.push(word3);
    words.push(word4);
    words.push(word5);

    words[0] = words[0].toLowerCase();
    words[1] = words[1].toLowerCase();
    words[2] = words[2].toLowerCase();
    words[3] = words[3].toLowerCase();
    words[4] = words[4].toLowerCase();
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
    if (rooms[key]["team1"].length < 8) {
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
    if (rooms[key]["team".concat(number)].length < 8) {
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
    return (playerId == rooms[key]["game"]["activeClueGiver"]);
    /*
    var result = false;
    var clients = io.sockets.adapter.rooms[key.concat("clue-givers-playing")];
    console.log(clients);
    
    Object.keys(clients["sockets"]).forEach(person => {
        console.log(person);
        //should only be one, but re-using this code
        if (person == playerId) {
            console.log("player IS active clue giver");
            result = true;
        }
    });
    return result;
    */
}

function isPlayerActiveGuesser(key, playerId) {
    var clients = io.sockets.adapter.rooms[key.concat("clue-receivers-playing")];
    var result = false;
    Object.keys(clients["sockets"]).forEach(person => {
        //should only be one, but re-using this code
        if (person == playerId) {
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
            return Object.values(team1[i])[0];
        }
    }

    //not in team 1...
    for (var i = 0; i < team2.length; i++) {
        if (Object.keys(team2[i])[0] == playerId) {
            return Object.values(team2[i])[0];
        }
    }
}

function removePlayerFromAnyTeam(key, playerId) {
    //NULL CHECK NEEDED FOR ROOMS[KEY]
    var team1 = rooms[key]["team1"];
    var team2 = rooms[key]["team2"];
    for (var i = 0; i < team1.length; i++) {
        
        if (Object.keys(team1[i])[0] == playerId) {
            team1.splice(i, 1);
            return;
        }
    }

    //not in team 1...
    for (var i = 0; i < team2.length; i++) {
        if (Object.keys(team2[i])[0] == playerId) {
            team2.splice(i, 1);
            return;
        }
    }
    console.log("failed to remove a player");
}

function processAndAddClues(key, clue) {
    clue = clue.trim();
    var clueArray = clue.split(" ");
    clueArray.forEach(word => {
        if (!rooms[key]["game"]["cluesGiven"].includes(word)) {
            rooms[key]["game"]["cluesGiven"].push(word);
        }
    });
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
    rooms[key]["team1Score"] = 0;
    rooms[key]["team2Score"] = 0;
    rooms[key]["preBidTime"] = gameDefaults["PRE_BID_TIME"];
    rooms[key]["bidTime"] = gameDefaults["BID_TIME"];
    rooms[key]["guessTime"] = gameDefaults["GUESS_TIME"];
    rooms[key]["gameStarted"] = false;
    rooms[key]["game"] = {};
    rooms[key]["game"]["currentBid"] = 25;
    rooms[key]["game"]["cluesGiven"] = [];
    rooms[key]["game"]["guessedWords"] = [];
    rooms[key]["game"]["update"] = {};
    rooms[key]["timer"] = null;
    rooms[key]["readyPlayers"] = [];
}

function determineWinnerAndUpdateScore(key) {
    var playingTeam = returnTeamNumber(key, rooms[key]["game"]["currentBidOwner"]);
    var restingTeam = playingTeam == 1 ? 2 : 1;
    if (rooms[key]["game"]["guessedWords"].length == 5) {
        rooms[key]["team" + playingTeam + "Score"] += 1;
        return playingTeam;
    }
    else {
        rooms[key]["team" + restingTeam + "Score"] += 1;
        return restingTeam;
    }
}

function restartGame(key) {
    rooms[key]["game"] = {};
    rooms[key]["game"]["currentBid"] = 25;
    rooms[key]["game"]["cluesGiven"] = [];
    rooms[key]["game"]["guessedWords"] = [];
    rooms[key]["game"]["update"] = {};
    rooms[key]["readyPlayers"] = [];
    rooms[key]["gameStarted"] = false;
    //for every player in clue-givers, clue-receivers, clue-givers playing, clue-givers-receiving, that player leaves the room

    rooms[key]["team1"].forEach(player => {
        var tempSocket = io.sockets.connected[Object.keys(player)[0]];
        tempSocket.leaveAll();
        tempSocket.join(key);
    });
    rooms[key]["team2"].forEach(player => {
        var tempSocket = io.sockets.connected[Object.keys(player)[0]];
        tempSocket.leaveAll();
        tempSocket.join(key);
    });
    io.in(key).emit('restart-game');
    io.in(key).emit('room-data', rooms[key]);
}

exports.setUpSocketEvents = setUpSocketEvents;