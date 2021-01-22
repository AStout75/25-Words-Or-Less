import SocketContext from '../socket-context'

//Components
import StartGameButton from '../Leaves/StartGameButton';
import GameInputPanel from '../Leaves/GameInputPanel';
import GameInfoPanel from '../Leaves/GameInfoPanel';
import GameClock from '../Leaves/GameClock';
import Word from '../Leaves/Word';
import JoinTeamButton from '../Leaves/JoinTeamButton';
import InfoPanelTexts from '../Leaves/InfoPanelTexts';
import GameSettings from '../Leaves/GameSettings';
import TeamMembers from '../Leaves/TeamMembers';
import TeamScores from '../Leaves/TeamScores';
import GameTeamPanel from '../Leaves/GameTeamPanel';
import GameUpdates from '../Leaves/GameUpdates';

//Dev Log elements
import log from '../../Data/dev-log'

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

        this.props.socket.on('client-id-notification', id => {
            playerId = id;
        });

        this.props.socket.on('create-room-success', key => {
            that.setState({
                page: "pregame",
                createModal: false,
                joinModal: false,
                helpModal: false,
                roomKey: key,
            });
        });

        this.props.socket.on('join-room-success', (key, name, data, scores) => {
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
        
        this.props.socket.on('join-room-fail', function() {
            alert("Invalid room code");
        });

        this.props.socket.on('start-game-server', function (data) {
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

        this.props.socket.on('score-update-main', data => {
            that.scores[1] = data[1];
            that.scores[2] = data[2];
        });

        this.props.socket.on('change-settings-main', data => {
            var temp = {"preBidTime" : data["preBidTime"] / 1000, "bidTime" : data["bidTime"] / 1000, "guessTime" : data["guessTime"] / 1000};
            this.settings = temp;
        })

        this.props.socket.on('restart-game', function() {
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
                    <div className="dev-log-container rounded">
                        <div className="dev-log">
                        {log.map((member, index, arr) => {
                            return (
                            <div className="dev-log-element">
                                <div className="d-flex justify-content-between">
                                    <h3>Version {member.version}</h3>
                                    <h3>{member.date}</h3>
                                </div>
                                <h5>{member.title}</h5>
                                <ul>
                                    {member.bullets.map((bullet) => {
                                        return (
                                            <li>{bullet}</li>
                                        );
                                    })}
                                </ul>
                            </div>
                            );
                        })}
                        </div>
                    </div>

                    
                </div>
                <footer>
                    <div className="container d-flex align-items-center justify-content-end">
                    <div>
                        <a href="https://www.buymeacoffee.com/austin75"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=👻&slug=austin75&button_colour=FF5F5F&font_colour=ffffff&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00"/></a>
                    </div>
                    
                        
                        
                    </div>
                </footer>
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
        this.props.socket.emit('join-room', key, name);
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
        this.props.socket.emit('create-room', name);
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
                                    playerId = {playerId}
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
                                    playerId = {playerId}
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
        this.props.socket.emit('start-game', this.state.roomKey);
    }

    /* Remove the user from the current room and disconnect them
    from the server socket */

    leaveRoom() {
        this.props.socket.emit('leave-room', this.state.roomKey);
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
                    <div className="game-info-panel">
                        <GameUpdates />
                    </div>
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

//initialize player variables

var userName = "Anonymous";
var team1 = [];
var team2 = [];
var playerCount = null;
var playerId = null;

const MainWithSocket = props => (
    <SocketContext.Consumer>
        {socket => <Main {...props} socket={socket} />}
    </SocketContext.Consumer>
)

export {MainWithSocket as default}