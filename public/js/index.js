class Main extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            page: "landing",
            createModal: false,
            joinModal: false,
            helpModal: false,
            roomKey: "",
        };
        var that = this;
        this.scores = {1: 0, 2: 0};
        this.settings = {"preBidTime" : 10, "bidTime" : 10, "guessTime" : 150};

        //initialize socket event listeners

        socket.on('client-id-notification', id => {
            playerId = id;
        });

        socket.on('create-room-success', key => {
            that.setState({
                page: "pregame",
                createModal: false,
                joinModal: false,
                helpModal: false,
                roomKey: key,
            });
        });

        socket.on('join-room-success', (key, name, data, scores) => {
            that.scores = scores;
            var settings = {
                ["preBidTime"] : data["preBidTime"] / 1000,
                ["bidTime"] : data["bidTime"] / 1000,
                ["guessTime"] : data["guessTime"] / 1000,
            }
            that.settings = settings;
            that.setState({
                page : "pregame",
                createModal: false,
                joinModal: false,
                helpModal: false,
                roomKey : key,
            });
        });
        
        socket.on('join-room-fail', function() {
            alert("Invalid room code");
        });

        socket.on('start-game-server', function (data) {
            that.roomData = data;
            //check if game can be started
            that.setState({
                page: "game", 
                createModal: false,
                joinModal: false,
                helpModal: false,
                roomKey: that.state.roomKey
            });
        });

        socket.on('score-update-main', data => {
            that.scores[1] = data[1];
            that.scores[2] = data[2];
        });

        socket.on('change-settings-main', data => {
            var temp = {"preBidTime" : data["preBidTime"] / 1000, "bidTime" : data["bidTime"] / 1000, "guessTime" : data["guessTime"] / 1000};
            this.settings = temp;
        })

        socket.on('restart-game', function() {
            that.setState({
                page: "pregame", 
                createModal: false,
                joinModal: false,
                helpModal: false,
                roomKey: that.state.roomKey
            });
        });


    }

    //auto focus the name field

    componentDidUpdate() {
        if (this.state.createModal) {
            document.getElementById('room-modal-create-name').focus();
        }
        if (this.state.joinModal) {
            document.getElementById('room-modal-join-name').focus();
        }
    }

    

    /* View for the very first page prompting the user to enter their 
    name, and either join or create a room. If the user leaves their room,
    this page is displayed */

    displayLandingPage() {
        const createModalClass = this.state.createModal ? "" : "d-none ";
        const joinModalClass = this.state.joinModal ? "" : "d-none ";
        const helpModalClass = this.state.helpModal ? "" : "d-none ";
        var that = this;
        return (
            <div className="full-page-size">
                <div className={createModalClass + "room-modal rounded"}>
                    <form onSubmit={function(event) {event.preventDefault(); that.createRoom()}}>
                        <div className="room-modal-content">
                            <h2 className="room-modal-title">Create a room</h2>
                            <div className="room-modal-data-box d-flex align-items-center justify-content-center">
                                <label htmlFor="room-modal-create-name" className="room-modal-label">Nickname: </label>
                                <input className="room-modal-input" id="room-modal-create-name" placeholder="Maximum 32 chars" />
                            </div>
                            <button 
                            type="submit"
                            className="action-button modal-button rounded" 
                            >Create room</button>
                        </div>
                    </form>
                </div>
                <div 
                    className={createModalClass + "room-modal-shadow"}
                    onClick={() => this.closeEitherModal()}
                    >
                </div>
                <div className={joinModalClass + " room-modal rounded"}>
                    <form onSubmit={function(event) {event.preventDefault(); that.joinRoom()}}>
                        <div className="room-modal-content">
                            <h2 className="room-modal-title">Join a room</h2>
                            <div className="room-modal-data-box d-flex align-items-center justify-content-center">
                                <label htmlFor="room-modal-join-name" className="room-modal-label">Nickname: </label>
                                <input className="room-modal-input" id="room-modal-join-name" placeholder="Maximum 32 chars" />
                            </div>
                            <div className="room-modal-data-box d-flex align-items-center justify-content-center">
                                <label htmlFor="room-modal-join-code" className="room-modal-label">Room code:</label>
                                <input className="room-modal-input" id="room-modal-join-code" />
                            </div>
                            <button 
                            type="submit"
                            className="action-button modal-button rounded" 
                            >Join room</button>
                        </div>
                    </form>
                </div>
                <div 
                    className={joinModalClass + "room-modal-shadow"}
                    onClick={() => this.closeEitherModal()}
                    >
                </div>
                <div className={helpModalClass + " help-modal rounded"}>
                    <div className="room-modal-content">
                        <h2 className="help-modal-title">How to play</h2>
                        <div className="help-modal-element">
                            <h4>Objective</h4>
                            <div className="ml-2">
                            Your goal is to get your teammates to guess the 5 hidden words (clue giver), or to guess the 5 hidden words using your clue giver's chosen hint words. Clue givers have a limited amount of hint words, and guessers have a limited amount of time before the round ends.
                            </div>
                        </div>
                        <div className="help-modal-element">
                            <h4>Game Flow</h4>
                            <h5 className="ml-3">1. Team Formation</h5>
                            <div className="ml-4">Assemble into two teams of:</div>
                            <ul className="ml-4">
                                <li>2-4 players each</li>
                                <li>One appointed clue giver per team</li>
                            </ul>
                            <h5 className="ml-3">2. Bidding Phase</h5>
                            <div className="ml-4">
                                Clue givers bid against each other for the 5 hidden words.</div>
                            <ul className="ml-4">
                                <li>Clue givers have a few seconds to review the words and quickly estimate how many hint words they need to use</li>
                                <li>Bidding begins at 25 words</li>
                                <li>If a bidder gives up or fails to bid quickly enough, the winning bidder and their team go on to play the round</li>
                                <li>The losing bidder and their team sit out the round</li>
                            </ul>
                            <div className="ml-4">
                            For example, Team 1's clue giver thinks that they can get their teammates to guess all 5 words by only using 22 hint words. They bid 22. Team 2 thinks they can do it in 20. They bid 20. Team 1 takes a stand and says they can do it in 17. They bid 17. Team 2 gives up, and prepares to sit out as the game moves on to the clue phase.
                            </div>
                            <div className="help-modal-image">
                                <img alt="Making a bid" className="img-fluid" src="images/making_a_bid.gif" />
                            </div>
                            <h5 className="ml-3">3. Clue Phase</h5>
                            <div className="ml-4">
                            The clue giver gives their clues.</div>
                            <ul className="ml-4">
                                <li>They have a few seconds after bidding ends to get ready</li>
                                <li>They cannot exceed the amount of hint words that they bid</li>
                                <li>They cannot give a hidden word as one of their hint words</li>
                                <li>Their team must guess all 5 hidden words in the time limit</li>
                                <li>Their team has unlimited guesses</li>
                            </ul>
                            <div className="ml-4">
                            For example, assume one of the hidden words is "gem". The clue giver might say "small pretty stone", costing them 3 of their hint words. Their teammates might guess "diamond" or "jewelry" at first, but they must guess "gem" exactly to obtain that word. Use your hint words wisely, they cannot be taken back and clue givers cannot communicate otherwise during the round.
                            </div>
                            <div className="help-modal-image">
                                <img alt="Giving a clue" className="img-fluid" src="images/giving_a_clue.gif" />
                            </div>
                        </div>
                        <h2 className="room-modal-title">Details / Strategy </h2>
                        <div className="help-modal-element">
                            <h4>Game Details</h4>
                            <h5 className="ml-3">Valid Clue Words</h5>
                            <div className="ml-4">
                                If a clue giver gives an invalid clue, they lose the round. Invalid clues are:
                            </div>
                            <ul className="ml-4">
                                <li>Any of the actual hidden words</li>
                                <li>Any meaningful derivation of a hidden word. (e.g. hidden word is "explosion", then "explode" is invalid)</li>
                                
                            </ul>
                            <h5 className="ml-3">Counting Clue Words</h5>
                            <div className="ml-4">
                                The software won't check for clue validity, so it's your job (probably as the opposing team) to ensure the playing team isn't cheating. The software will try to estimate how many clues have been given: Any chunk of 1 or more characters separated by a space counts as a word, and all leading and trailing whitespace is ignored. This means that <b>you have to validate sneaky clues such as</b>:
                            </div>
                            <ul className="ml-4">
                                <li>"4legged" (this is "four legged")</li>
                                <li>"tongue-wagging" (hyphens count as spaces)</li>
                                <li>"cuteanimal" (non-words aren't necessarily invalid, so typos / other languages are OK, but a clue giver can't just mash words together)</li>
                            </ul>
                        </div>
                        <div className="help-modal-element">
                            <h4>Strategy</h4>
                            <h5 className="ml-3">Bidding</h5>
                            <div className="ml-4">
                                You don't have much time to come up with a list of potential hints before bidding starts, so you should quickly assess the difficulty level of the words and then set a target of clues / word. You can set a target of 4 / word, but it's unlikely a bid like that won't be contested by the other team. ~ 3 / word is much more competitive, and ~ 2 / word (~ 10 overall) is usually as few as people ever go, but leaves little margin for error.
                            </div>
                            <h5 className="ml-3">Giving Clues</h5>
                            <div className="ml-4">
                                Oftentimes a word is pretty clearly hit or miss with your team. If the word is "butter", you could try the descriptive approach and say "fatty solid dairy", but that might be more than necessary. Saying "peanut" and expecting them to finish off "butter" for you is risky but could work well. Ideally, you'd say "margarine", which is very closely related to butter, only uses one hint, and likely to help your team as much as possible.
                                <br />
                                It seems that hints that are "isolated terms" and subcategories of the hidden words do pretty well. Margarine works because it makes almost everyone think of butter, but not much else (hence isolated).
                            </div>
                            <h5 className="ml-3">Guessing</h5>
                            <div className="ml-4">
                                The most important thing to keep in mind is that you have unlimited guesses (and that you must properly spell the word)! Keep firing off related words until you get it or another clue comes out. Read into not only the meaning of the clue, but the timing of it, and its relation to previous clues. If your clue giver gives you two hints, and your team fails to get it after some frantic guessing, that third clue is going to definitely take into account some specific detail you have missed and need to consider.
                            </div>
                        </div>
                        <h2 className="room-modal-title">FAQ </h2>
                    </div>
                </div>
                <div 
                    className={helpModalClass + "help-modal-shadow"}
                    onClick={() => this.closeEitherModal()}
                    >
                </div>
                <div className="container">
                    <div className="title">
                        25 Words
                    </div>
                    <div className="subtitle">
                        or less!
                    </div>
                    <div className="d-flex flex-wrap justify-content-around align-items-center">
                        <div className="join-button-container align-self-start">
                            <button
                                className="action-button landing-button rounded"
                                onClick={() => this.openCreateModal()}
                                >
                                    Create a room
                            </button>
                        </div>
                        <div>
                            <div className="join-button-container">
                                <button
                                    className="action-button landing-button rounded"
                                    onClick={() => this.openJoinModal()}>
                                        Join a room
                                            
                                </button>
                            </div>
                        </div>
                        <div>
                            <div className="join-button-container">
                                <button
                                    className="action-button landing-button help-button rounded"
                                    onClick={() => this.openHelpModal()}>
                                        How to play
                                            
                                </button>
                            </div>
                        </div>
                    </div>
                    <h2 className="dev-log-title text-center">Update and patch history</h2>
                    <br />
                    <div className="dev-log-container rounded">

                        <div className="dev-log">
                        <div className="dev-log-element">
                                <div className="d-flex justify-content-between">
                                    <h3>Version 0.9.1</h3>
                                    <h3>10/16/20</h3>
                                </div>
                                <h5>Game settings</h5>
                                <ul>
                                    <li>Customize your game with the new game settings panel in the game lobby</li>
                                    <li>Fixed score display issue</li>
                                </ul>
                            </div>
                            <div className="dev-log-element">
                                <div className="d-flex justify-content-between">
                                    <h3>Version 0.9.0</h3>
                                    <h3>10/11/20</h3>
                                </div>
                                <h5>Layout changes and improvements</h5>
                                <ul>
                                    <li>Improved formatting during game mode; Clock stays next to words</li>
                                    <li>Teams are displayed on corners of the game page on large enough screens (mobile view coming soon)</li>
                                    <li>Score is kept track of on a per-team basis and is displayed on the pre-game page. (Note: joining a room will incorrectly always display the score as 0-0, but this is just a temporary visual bug, the room's score is saved server-side)</li>
                                    <li>Nicknames are capped at 32 characters... sorry, had to do it!</li>
                                    <li>Minor bug fixes and improvements - clock stops when game ends, words remain "checked" once guessed</li>
                                </ul>
                            </div>
                            <div className="dev-log-element">
                                <div className="d-flex justify-content-between">
                                    <h3>Version 0.8.4</h3>
                                    <h3>10/03/20</h3>
                                </div>
                                <h5>Gameplay bug fixes and game clock adjustment</h5>
                                <ul>
                                    <li>Game clock stays right at the top, and is positioned foreground relative to game updates</li>
                                    <li>Sending a guess that contains the right word no longer contributes to ending the game early</li>
                                    <li>It also properly displays the guessed word to the clue guessers in the words panel and in the game updates panel</li>
                                </ul>
                            </div>
                            <div className="dev-log-element">
                                <div className="d-flex justify-content-between">
                                    <h3>Version 0.8.0</h3>
                                    <h3>09/22/20</h3>
                                </div>
                                <h5>Deployment, room size, game clock</h5>
                                <ul>
                                    <li>Room size increased to 16 with 8 per team</li>
                                    <li>Game clock added, still needs positioning fix</li>
                                    <li>Repeated guesses now have a background color</li>
                                    <li>Game is now available on <a href="https://25words.games">https://25words.games!</a></li>
                                    <li>Server capacities increased</li>
                                </ul>
                            </div>
                            <div className="dev-log-element">
                                <div className="d-flex justify-content-between">
                                    <h3>Version 0.7.0</h3>
                                    <h3>09/04/20</h3>
                                </div>
                                <h5>Gameplay</h5>
                                <ul>
                                    <li>Round ends when all words are guessed</li>
                                    <li>Exact same clue words can be repeated</li>
                                    <li>Upon giving a clue, remind players how many are left</li>
                                </ul>
                            </div>
                            <div className="dev-log-element">
                                <div className="d-flex justify-content-between">
                                    <h3>Version 0.6.0</h3>
                                    <h3>09/03/20</h3>
                                </div>
                                <h5>Usability, game results</h5>
                                <ul>
                                    <li>Auto-focus create room, join room, give clue, and give guess input fields upon load</li>
                                    <li>Pressing enter attempts to create or join room</li>
                                    <li>Game attempts to tally up clues given</li>
                                    <li>'Ready up' button and restarting games functionality</li>
                                </ul>
                            </div>
                            <div className="dev-log-element">
                                <div className="d-flex justify-content-between">
                                    <h3>Version 0.5.2</h3>
                                    <h3>09/01/20</h3>
                                </div>
                                <h5>Game improvements, back-end changes</h5>
                                <ul>
                                    <li>New words come if no one bids</li>
                                    <li>Back end file organization</li>
                                    <li>Pressing enter submits your clue / guess</li>
                                    <li>Color code game updates (needs improvement)</li>
                                    <li>How to play and FAQ section on homepage</li>
                                </ul>
                            </div>
                            <div className="dev-log-element">
                                <div className="d-flex justify-content-between">
                                    <h3>Version 0.5.1</h3>
                                    <h3>08/31/20</h3>
                                </div>
                                <h5>Title page changes</h5>
                                <ul>
                                    <li>Clicking Create a room or Join a room will open a modal overlay instead of relying on the join code box and a window prompt</li>
                                </ul>
                            </div>
                            <div className="dev-log-element">
                                <div className="d-flex justify-content-between">
                                    <h3>Version 0.5.0</h3>
                                    <h3>08/31/20</h3>
                                </div>
                                <h5>Preliminary, workable version of a finished game</h5>
                                <ul>
                                    <li>Title page</li>
                                    <li>Creating, joining, and leaving server 
                                    rooms</li>
                                    <li>Arranging team members</li>
                                    <li>Bidding for words</li>
                                    <li>Giving clues and sending guesses</li>
                                    <li>Sent guesses are validated by server</li>
                                    <li>Displaying words to players at appropriate times</li>
                                    <li>Game updates are shown to all players</li>
                                    <li>Server manages a time limit on different game stages</li>
                                    <li>Intermediary phases between / before bidding and guessing</li>
                                    <li>Dev log</li>
                                </ul>
                            </div>
                            <div className="dev-log-element">
                                <div className="d-flex justify-content-between">
                                    <h3>Version 0.0.0</h3>
                                    <h3>08/24/20</h3>
                                </div>
                                <h5>Development started</h5>
                                <ul>
                                    <li>Playing around with a few features</li>
                                </ul>
                            </div>
                            
                            
                        </div>
                    </div>
                </div>
                
            </div>
            
            
        );
    }

    openCreateModal() {
        this.setState({
            page: "landing",
            createModal: true,
            joinModal: false,
            helpModal: false,
            roomKey: "",
        });
    }

    openJoinModal() {
        this.setState({
            page: "landing",
            createModal: false,
            joinModal: true,
            helpModal: false,
            roomKey: "",
        });
    }

    openHelpModal() {
        this.setState({
            page: "landing",
            createModal: false,
            joinModal: false,
            helpModal: true,
            roomKey: "",
        });
    }

    closeEitherModal() {
        this.setState({
            page: "landing",
            createModal: false,
            joinModal: false,
            helpModal: false,
            roomKey: "",
        });
    }

    /* Attempt to join a game room with the value of the input element 
    with id room-code. It can either fail (nothing happens) or succeed,
    setting the state's page to pregame */

    joinRoom() {
        var key = document.getElementById('room-modal-join-code').value;
        var name = document.getElementById('room-modal-join-name').value;
        if (name == "") {
            name = "I failed to type in a name";
        }
        userName = name;
        socket.emit('join-room', key, name);
    }

    /* Create a new game room and join it. This can either fail
        (max room cap reached) or succeed. Upon success the room is 
        automatically joined and the state is changed. */

    createRoom() {
        var name = document.getElementById('room-modal-create-name').value; //prompt("Your nickname");
        if (name == "") {
            name = "I failed to type in a name";
        }
        userName = name;
        socket.emit('create-room', name);
    }

    /* Display the pre game phase. Must be in a room to view.
    Allows for:
    Team Assignment
    Team Name Change
    Name Change
    Lock in / start game
    */

    displayPregamePage() {
        return (
            <div>
                <div className="info-panel">
                    <div className="container d-flex justify-content-between align-items-center">
                        <InfoPanelTexts 
                            roomKey={this.state.roomKey}
                            playerCount={playerCount} 
                        />
                        <button
                        className="action-button leave-button rounded"
                        onClick={() => this.leaveRoom()}>
                            Leave
                        </button>
                    </div>
                </div>
                <div className="container">
                    <TeamScores scores={this.scores} />
                    <div className="teams-container d-flex flex-wrap justify-content-center">
                        <div className="team">
                            <div className="team-header d-flex justify-content-center align-items-center">
                                <div className="team-name d-inline-block">
                                    Team 1:
                                </div>
                                <JoinTeamButton
                                    roomKey = {this.state.roomKey}
                                    name = {userName}
                                    teamNumber = "1"
                                />
                            </div>
                            <TeamMembers
                                teamNumber = "1"
                            />
                        </div>
                        <div className="team">
                            <div className="team-header d-flex justify-content-center align-items-center">
                                <div className="team-name d-inline-block">
                                    Team 2
                                </div>
                                <JoinTeamButton
                                    roomKey = {this.state.roomKey}
                                    name = {userName}
                                    teamNumber = "2"
                                />
                            </div>
                            <TeamMembers
                                teamNumber = "2"
                            />
                        </div>
                    </div>
                    <div className="game-settings-container">
                        <GameSettings default={this.settings} roomKey={this.state.roomKey} />
                    </div>
                    <div className="start-game-button-container">
                        <StartGameButton 
                        onClick={() => this.startGame()}
                        />
                    </div>
                </div>
            </div>
        );
    }

    startGame() {
        socket.emit('start-game', this.state.roomKey);
    }

    /* Remove the user from the current room and disconnect them
    from the server socket */

    leaveRoom() {
        socket.emit('leave-room', this.state.roomKey);
        this.setState({
            page: "landing",
            roomKey: "",
        });
    }

    /* Display the game page. Oh boy... 

    5 word slots in the middle
    Clue givers can see it, players can not (they will fill in as they are guessed)
    Middle top: Starting bid / current bid, right underneath is player name 
    that claimed it



    */

    displayGamePage() {
        return(
            <div>
                <div className="container-fluid">
                    <div className="mx-auto d-flex justify-content-center">
                        <GameTeamPanel teamNumber="1" roomKey={this.state.roomKey} roomData={this.roomData} />
                        <div className="words-panel rounded">
                            <Word index="0" />
                            <hr/>
                            <Word index="1" />
                            <hr />
                            <Word index="2" />
                            <hr />
                            <Word index="3" />
                            <hr />
                            <Word index="4" />
                        </div>
                        <GameClock />
                        <GameTeamPanel teamNumber="2" roomKey={this.state.roomKey} roomData={this.roomData} />
                    </div>
                    <div className="mx-auto d-flex justify-content-center">
                        <div className="large-screen-margin-right">
                            <GameInputPanel 
                            roomKey={this.state.roomKey}
                            />
                        </div>
                        <div className="ghost-clock"></div>
                    </div>
                    <GameInfoPanel />
                </div>
            </div>
        );
    }

    /* Display the appropriate page as specified in the state 
    variable */

    render() {
        if (this.state.page == "landing") {
            return this.displayLandingPage();
            
        }
        else if (this.state.page == "pregame") {
            return this.displayPregamePage();

        }
        else if (this.state.page == "game") {
            return this.displayGamePage();
        }
        else {
            alert("uhhhh... this shouldn't happen. game's state did not match any of the valid options. report this and refresh the page");
            return (
                <div>
                    :(
                </div>
            );
        }
    }
}

class RoomModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hidden: true,
            mode: "create"
        };
    }

    render() {
        return(
            <div className="modal">
            </div>
        );
    }
}



class GameInputPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentBid: 25,
            mode: "pre-bid", //none, bid, or guess
        };
        var that = this;

        socket.on('game-update', data => {
            if (data["mode"] == "pre-bid") {
                //show bidding stuff
                that.setState({
                    mode: "pre-bid"
                });
            }
            else if (data["mode"] == "bid") {
                //show bidding stuff
                that.setState({
                    currentBid: data["currentBid"],
                    mode: "bid"
                });
            }
            else if (data["mode"] == "bid-sidelines") {
                //show bidding stuff
                that.setState({
                    currentBid: data["currentBid"],
                    mode: "bid-sidelines"
                });
            }
            else if (data["mode"] == "pre-guess-guesser") {
                //show bidding stuff
                that.setState({
                    currentBid: data["currentBid"],
                    mode: "pre-guess-guesser"
                });
            }
            else if (data["mode"] == "pre-guess-giver") {
                //show bidding stuff
                that.setState({
                    currentBid: data["currentBid"],
                    mode: "pre-guess-giver"
                });
            }
            else if (data["mode"] == "pre-guess-sidelines") {
                //show bidding stuff
                that.setState({
                    currentBid: data["currentBid"],
                    mode: "pre-guess-sidelines"
                });
            }
            else if (data["mode"] == "guess-giver") {
                //show guessing stuff
                that.setState({
                    currentBid: data["currentBid"],
                    mode: "guess-giver"
                });
            }
            else if (data["mode"] == "guess-receiver") {
                //show guessing stuff
                that.setState({
                    currentBid: data["currentBid"],
                    mode: "guess-receiver"
                });
            }
            else if (data["mode"] == "guess-sidelines") {
                //show guessing stuff
                that.setState({
                    currentBid: data["currentBid"],
                    mode: "guess-sidelines"
                });
            }
            else if (data["mode"] == "post-game") {
                that.setState({
                    mode: "post-game"
                })
            }
        });
    }

    componentWillUnmount() {
        socket.off('game-update');
    }

    //give focus to input bars if possible for speedier guessing and clue giving

    
    componentDidUpdate() {
        if (this.state.mode == "guess-giver" || this.state.mode == "guess-receiver") {
            document.getElementById('word-input').focus();
        }
    } 

    decreasePlayerBid() {
        var bid = document.getElementById("player-bid-text-number");
        if (bid.innerHTML == "1") {
            // do nothing
        }
        else {
            const oldBid = this.state.currentBid - 1;
            this.setState({
                currentBid: oldBid,
                mode: "bid"
            });
            bid.innerHTML = this.state.currentBid;
        }
    }

    increasePlayerBid() {
        var bid = document.getElementById("player-bid-text-number");
        if (bid.innerHTML == "25") {
            // do nothing
        }
        else {
            const oldBid = this.state.currentBid + 1;
            this.setState({
                currentBid: oldBid,
                mode: "bid"
            });
            bid.innerHTML = this.state.currentBid;
        }
    }

    sendPlayerBid() {
        socket.emit('player-bid', this.props.roomKey, this.state.currentBid);
    }

    handleKeyUp() {
        
    }

    giveClue() {
        var input = document.getElementById('word-input');
        if (input.value != "") {
            socket.emit('give-clue', this.props.roomKey, input.value);
            input.value = "";
        }
        
    }

    giveGuess() {
        var input = document.getElementById('word-input');
        if (input.value != "") {
            socket.emit('give-guess', this.props.roomKey, input.value);
            input.value = "";
        }
        
    }

    //post game screen: emit to server that player is ready to quit the game

    readyUp() {
        document.getElementById('ready-up-button').classList.toggle("ready-button-ready");
        socket.emit('ready-up', this.props.roomKey);
    }

    render() {
        var that = this;
        if (this.state.mode == "pre-bid") {
            return (
                <div className="game-input-panel">
                    <div className="text-center">
                        Bidding will start soon. If you are the clue (space) giver (you can see the words), prepare to bid.
                    </div>
                    
                </div>
            );
        }
        else if (this.state.mode == "bid-sidelines") {
            return (
                <div className="game-input-panel">
                    <div className="text-center">
                        Clue (space) givers are currently bidding.
                    </div>
                    
                </div>
            );
        }
        else if (this.state.mode == "bid") {
            return (
                <div className="game-input-panel d-flex align-items-center justify-content-between">
                    <div className="submit-bid-input-container">
                        <div className="d-flex align-items-center">
                            <div className="player-bid-text">
                                Modify your bid:&nbsp;
                                <span id="player-bid-text-number" className="player-bid-text-number rounded">
                                    {this.state.currentBid}
                                </span>
                            </div>
                            <div>
                                <div 
                                className="arrow-down"
                                onClick={function() {that.decreasePlayerBid()}}></div>
                                
                            </div>
                            <div>
                                <div 
                                className="arrow-up"
                                onClick={function() {that.increasePlayerBid()}}></div>
                            </div>
                        </div>
                    </div>
                    <div className="submit-bid-button-container">
                        <button 
                        className="submit-bid-button action-button"
                        onClick={function() {that.sendPlayerBid()}}
                        >
                            Bid
                        </button>
                    </div>
                </div>
            );
        }
        else if (this.state.mode == "pre-guess-guesser") {
            return (
                <div className="game-input-panel">
                    Get ready! Your cluegiver will start giving clues in a moment.
                </div>
            );
        }
        else if (this.state.mode == "pre-guess-giver") {
            return (
                <div className="game-input-panel">
                    Get ready! You can start giving clues in a moment.
                </div>
            );
        }
        else if (this.state.mode == "pre-guess-sidelines") {
            return (
                <div className="game-input-panel">
                    The other team is about to start the guessing phase.
                </div>
            );
        }
        else if (this.state.mode == "guess-giver") {
            return (
                <div>
                    <form onSubmit={function(event) {event.preventDefault(); that.giveClue()}}>
                        <div className="game-input-panel d-flex align-items-center justify-content-center">
                            <div className="submit-guess-input-container">
                                <input 
                                className="submit-guess-input" 
                                id="word-input"
                                
                                />
                            </div>
                            <div className="submit-guess-button-container">
                                <button 
                                type="submit"
                                className="submit-guess-button action-button"
                                >
                                    Give clue
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            );
        }
        else if (this.state.mode == "guess-receiver") {
            return (
                <div>
                    <form onSubmit={function(event) {event.preventDefault(); that.giveGuess()}}>
                        <div className="game-input-panel d-flex align-items-center justify-content-center">
                            <div className="submit-guess-input-container">
                                <input 
                                className="submit-guess-input" 
                                id="word-input" 
                                
                                />
                            </div>
                            <div className="submit-guess-button-container">
                                <button 
                                className="submit-guess-button action-button"
                                type="submit"
                                >
                                    Guess word
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            );
        }
        else if (this.state.mode == "guess-sidelines") {
            return (
                <div className="game-input-panel">
                    The other team is trying to guess their words. If they fail, you win!
                </div>
            );
        }
        else if (this.state.mode == "post-game") {
            return (
                <div className="game-input-panel d-flex align-items-center">
                    <div className="submit-guess-input-container">
                    The game has ended. See who won! You may have to recount the given clue words.
                    </div>
                    <div className="submit-guess-button-container">
                        <button 
                        className="submit-guess-button ready-button action-button"
                        id="ready-up-button"
                        onClick={() => this.readyUp()}
                        >
                            Ready up
                        </button>
                    </div>
                    
                </div>
            )
        }
    }
}

class GameInfoPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            
        };
    }

    render() {
        return (
            <div className="game-info-panel">
                <GameUpdates />
            </div>
        );
    }
}

class GameUpdates extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            elements: [],
        };
        var that = this;

        socket.on('game-update', data => {
            //Read the update key to see what happened
            var newUpdate = {};
            newUpdate["playerName"] = data["update"]["playerName"];
            newUpdate["action"] = data["update"]["action"];
            newUpdate["value"] = data["update"]["value"];
            newUpdate["className"] = data["update"]["className"];
            var updatedElements = that.state.elements;
            updatedElements.push(newUpdate);
            that.setState({
                elements: updatedElements
            })
        });
    }

    componentWillUnmount() {
        socket.off('game-update');
    }

    render() {
        const elementsReversed = this.state.elements.slice().reverse();
        return (
            <div className="full-page-size game-update-elements">
                {elementsReversed.map((element, index, arr) => {
                    return (
                    <div 
                    className={"game-update game-update" + (index == 0 ? "-new" : "") + " rounded " + arr[index]["className"]}
                    key={arr.indexOf(element)}
                    >
                        {arr[index]["playerName"]}
                        &nbsp;
                        <span>{arr[index]["action"]}</span>
                        &nbsp;
                        {arr[index]["value"]}
                    </div> );
                })}
            </div>
        );
    }
}

//State updates are for server events
//Client ticks down by itself based off a function called one time in the render
//which has a set time out method

class GameClock extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            timeInitial: 15,
            color: "green",
            circleDashArray: 283,
        };
        this.timer = null;
        this.timePassed = 0;
        this.timeLeft = this.state.timeInitial;

        socket.on('reset-clock', time => {
            this.setState({
                timeInitial: time,
                color: "green",
                circleDashArray: 283,
            });
            this.timePassed = 0;
            this.timeLeft = time;
            if (time != 0) {
                this.startTimer();
            }
            
        }); 

        var that = this;
        socket.on('stop-clock', function() {
            clearInterval(that.timer);
        });
    }

    componentWillUnmount() {
        socket.off('reset-clock');
        clearInterval(this.timer);
    }

    generateClassName() {
        return "base-timer__path-remaining";
    }

    startTimer() {
        // The amount of time passed increments by one
        if (this.timer != null) {
            clearInterval(this.timer);
        }
        this.timer = setInterval(() => {
    
            // The amount of time passed increments by one
            this.timePassed = this.timePassed += 1;
            this.timeLeft = this.state.timeInitial - this.timePassed;
            
            // The time left label is updated
            
            if (this.timeLeft == 0) {
                clearInterval(this.timer);
            }
            document.getElementById("base-timer-label").innerHTML = this.timeLeft;

            //this.setCircleDasharray();
           // console.log("just updated circle dash");
        }, 1000);
    }

    calculateTimeFraction() {
        console.log(this.timeLeft, this.state.timeInitial);
        const rawTimeFraction = this.timeLeft / (this.state.timeInitial);
        console.log(rawTimeFraction, "is the fraction of dash array returned");
        return rawTimeFraction - (1 / (this.state.timeInitial + 1)) * (1 - rawTimeFraction);
    }

    // Update the dasharray value as time passes, starting with 283
    
    setCircleDasharray() {
    const circleDasharray = `${(
        this.calculateTimeFraction() * 283
    ).toFixed(0)} 283`;
    document
        .getElementById("base-timer-path-remaining")
        .setAttribute("stroke-dasharray", circleDasharray);
    }
    
    componentDidMount() {
        
        /*
        console.log('in CDM');
        this.timePassed = 0;
        this.timeLeft = this.state.timeInitial;
        // The amount of time passed increments by one
        this.timePassed = this.timePassed += 1;
        this.timeLeft = this.state.timeInitial - this.timePassed;
        // The time left label is updated
        
        if (this.timeLeft == 0) {
            //clearInterval(timerInterval);
        }
        document.getElementById("base-timer-label").innerHTML = this.timeLeft;

        //this.setCircleDasharray();
        console.log("just updated circle dash");
        console.log("Calling component did mount"); */

        //this.startTimer();
        
    }

    render() {
        return (
            <div className="base-timer rounded-circle">
                <svg className="base-timer__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <g className="base-timer__circle">
                        <circle className="base-timer__path-elapsed" cx="50" cy="50" r="45" />
                        <path
                            id="base-timer-path-remaining"
                            strokeDasharray="283"
                            className={this.generateClassName()}
                            d="
                            M 50, 50
                            m -45, 0
                            a 45,45 0 1,0 90,0
                            a 45,45 0 1,0 -90,0
                            "
                        >
                    </path>
                    </g>
                </svg>
                <span id="base-timer-label" className="base-timer__label">
                    {this.state.timeInitial}
                </span>
            </div>
        );
    }
}

class Word extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hidden: true,
            value: "???",
            guessed: false
        }
        var that = this;

        socket.on('words', words => {
            this.setState({
                hidden: false,
                value: words[that.props.index],
            });
        });

        socket.on('word-guessed', (word, index) => {
            if (index == that.props.index) {
                this.setState({
                    hidden: false,
                    value: word,
                    guessed: true
                });
            }
            
        });
    }

    componentWillUnmount() {
        socket.off('words');
        socket.off('word-guessed');
    }

    render() {
        if (this.state.hidden) {
            return (
                <div className="words-panel-word hidden-word d-flex align-items-center justify-content-center">
                    {this.state.value}
                </div>
            );
            
        }
        else {
            if (this.state.guessed) {
                return (
                    <div className="words-panel-word guessed-word d-flex align-items-center justify-content-center">
                        {this.state.value}
                    </div>
                );
            }
            else {
                return (
                    <div className="words-panel-word d-flex align-items-center justify-content-center">
                        {this.state.value}
                    </div>
                );
            }
            
        }
        
    }
}

class InfoPanelTexts extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            playerCount: props.playerCount,
        };

        socket.on('room-data', data => {
            this.setState({
                playerCount: data["playerCount"]
            });
        }); 
    }

    componentWillUnmount() {
        socket.off('room-data');
    }

    render() {
        return (
            <div className="d-flex">
                <div className="info-panel-text">
                    Room: {this.props.roomKey}
                </div>
                <div className="info-panel-text">
                    Players: {this.state.playerCount} / 16
                </div>
            </div>
        );
    }
}

class JoinTeamButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            enabled: true
        }

        socket.on('room-data', data => {
            var disable = false;
            // figure out which team they're on
            var members = data["team".concat(this.props.teamNumber)];
            for (var i = 0; i < members.length; i++) {
                if (Object.keys(members[i])[0] == playerId) {
                    disable = true;
                }
            }

            //Also disable when its team has 8 members

            if (members.length == 8) {
                disable = true;
            }

            //Always reset state so disabled can become enabled
            if (disable) {
                this.setState({
                    enabled: false
                });
            }
            else {
                this.setState({
                    enabled: true
                });
            }
        }); 
    }

    joinTeam(key, name, teamNumber) {
        socket.emit('join-team', key, name, teamNumber);
    }

    render() {
        var thisButton = this;
        if (this.state.enabled) {
            return (
                <div className="d-inline-block">
                    <button
                    disabled={!this.state.enabled}
                    onClick={function() { thisButton.joinTeam(thisButton.props.roomKey, thisButton.props.name, thisButton.props.teamNumber) }}
                    className="join-team-button action-button rounded"
                    >
                        Join
                    </button>
                </div>
            );
        }
        else {
            return (
                <div className="d-inline-block">
                    <button
                    disabled={!this.state.enabled}
                    className="join-team-button action-button rounded"
                    >
                        Join
                    </button>
                </div>
            );
        }
    }
}

/*
    Similar to TeamMembers, displays the members of each team during game time.
*/

class GameTeamPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            clueGiverIndex: props.roomData["team".concat(this.props.teamNumber).concat("ClueGiverIndex")],
            members: props.roomData["team".concat(this.props.teamNumber)],
            score: this.props.roomData["team" + this.props.teamNumber + "Score"]
        };

        var that = this;
        socket.on('score-update', data => {
            that.setState({
                score: data[that.props.teamNumber]
            });
        }); 
    }

    componentWillUnmount() {
        socket.off('score-update');
    }

    render() {
        var that = this;
        return (
            <div className="game-team-panel rounded">
                <div className="game-team-panel-title">
                    Team {that.props.teamNumber}: {that.state.score} points
                </div>
                {this.state.members.map((member, index, arr) => {
                    return (
                    <div 
                    className={index == that.state.clueGiverIndex ? "game-team-member clue-giver" : "game-team-member"}
                    key={Object.keys(member)[0]}
                    >
                        {index + 1}: &nbsp;
                        <span>{Object.values(member)[0]}</span>
                    </div> );
                })}
            </div>
        );
    }
}

class TeamScores extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            scores : this.props.scores
        };

        var that = this;
        
    }

    render() {
        return (
            <div className="team-scores text-center">
                Score: {this.state.scores[1]} to {this.state.scores[2]}
            </div>
        );
    }
}

class TeamMembers extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            clueGiverIndex: 0,
            members: [],
        };

        socket.on('room-data', data => {
            this.setState({
                clueGiverIndex: data["team".concat(this.props.teamNumber).concat("ClueGiverIndex")],
                members: data["team".concat(this.props.teamNumber)],
            });
        }); 
    }

    render() {
        var that = this;
        return (
            <div>
                {this.state.members.map((member, index, arr) => {
                    return (
                    <div 
                    className={index == that.state.clueGiverIndex ? "team-member clue-giver" : "team-member"}
                    key={Object.keys(member)[0]}
                    >
                        {index + 1}: &nbsp;
                        <span>{Object.values(member)[0]}</span>
                    </div> );
                })}
            </div>
        );
    }
}

class GameSettings extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            settings : this.props.default
        };
        var that = this;

        socket.on('change-settings-server', function(data) {
            var temp = {"preBidTime" : data["preBidTime"] / 1000, "bidTime" : data["bidTime"] / 1000, "guessTime" : data["guessTime"] / 1000};
            that.setState({
                settings : temp
            });

            /* have to hardcode this, slider thumbs weren't updating as supposed to */
            var preBidSlider = document.getElementById("slider-pre-bid");
            preBidSlider.value = that.state.settings["preBidTime"];
            var bidSlider = document.getElementById("slider-bid");
            bidSlider.value = that.state.settings["bidTime"];
            var guessSlider = document.getElementById("slider-guess");
            guessSlider.value = that.state.settings["guessTime"];
        });
    }

    componentWillUnmount() {
        socket.off('change-settings-server');
    }

    componentDidMount() {
        var that = this;
        var preBidSlider = document.getElementById("slider-pre-bid");
        var bidSlider = document.getElementById("slider-bid");
        var guessSlider = document.getElementById("slider-guess");
        preBidSlider.oninput = function() {
            var temp = that.state.settings;
            temp["preBidTime"] = preBidSlider.value;
            socket.emit('change-settings', that.props.roomKey, temp);
        }

        bidSlider.oninput = function() {
            var temp = that.state.settings;
            temp["bidTime"] = bidSlider.value;
            socket.emit('change-settings', that.props.roomKey, temp);
        }

        guessSlider.oninput = function() {
            var temp = that.state.settings;
            temp["guessTime"] = guessSlider.value;
            socket.emit('change-settings', that.props.roomKey, temp);
        }
    }

    render() {
        var that = this;
        return (
            <div className="settings-container">
                <div className="settings-slider-container d-flex align-items-center">
                    <div className="settings-slider-label" id="slider-pre-bid-label">Time before bidding starts: <span id="pre-bid-value">{this.state.settings["preBidTime"]} seconds</span></div>
                    <input type="range" min="1" max="30" defaultValue={this.state.settings["preBidTime"]} onChange={function(val) {that.state.settings["preBidTime"] = val}} className="settings-slider" id="slider-pre-bid" />
                </div>
                <div className="settings-slider-container d-flex align-items-center">
                    <div className="settings-slider-label" id="slider-pre-bid-label">Time to bid: <span id="pre-bid-value">{this.state.settings["bidTime"]} seconds </span></div>
                    <input type="range" min="5" max="30" defaultValue={this.state.settings["bidTime"]}  className="settings-slider" id="slider-bid" />
                </div>
                <div className="settings-slider-container d-flex align-items-center">
                    <div className="settings-slider-label" id="slider-pre-bid-label">Time to guess: <span id="pre-bid-value">{this.state.settings["guessTime"]} seconds </span></div>
                    <input type="range" min="15" max="300" defaultValue={this.state.settings["guessTime"]}  className="settings-slider" id="slider-guess" />
                </div>
            </div>
        );
    }
}

class StartGameButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            enabled: false
        };

        socket.on('room-data', data => {
            //Both teams need 2 or more players
            //Double check max players isn't violated

            if (data["team1"].length < 2) {
                this.setState({
                    enabled: false
                });
                
            } 
            else if (data["team1"].length > 8) {
                this.setState({
                    enabled: false
                });
                
            } 
            else if (data["team2"].length < 2) {
                this.setState({
                    enabled: false
                });
                
            } 
            else if (data["team2"].length > 8) {
                this.setState({
                    enabled: false
                });
            } 
            else {
                this.setState({
                    enabled: true
                });
            } 
            
            //TODO delete
            //this.setState({
            //    enabled: true
            //});
        });
    }

    render() {
        var that = this;
        return (
            <button
            className="action-button"
            disabled={!this.state.enabled}
            onClick={that.props.onClick}
            >
                Start Game
            </button>
        );
    }
}

//initialize player variables

var userName = "Anonymous";
var team1 = [];
var team2 = [];
var playerCount = null;
var playerId = null;

//Initialize web socket upon page visit
let socket = io();
socket.emit('connect'); 

//Attach the react render to the DOM
ReactDOM.render(
    <Main />,
    document.getElementById('root')
);