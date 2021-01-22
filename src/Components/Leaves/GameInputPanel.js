import SocketContext from '../socket-context'
class GameInputPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentBid: 25,
            mode: "pre-bid", //none, bid, or guess
        };
        var that = this;

        this.props.socket.on('game-update', data => {
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
        this.props.socket.off('game-update');
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
        this.props.socket.emit('player-bid', this.props.roomKey, this.state.currentBid);
    }

    handleKeyUp() {
        
    }

    giveClue() {
        var input = document.getElementById('word-input');
        if (input.value != "") {
            this.props.socket.emit('give-clue', this.props.roomKey, input.value);
            input.value = "";
        }
        
    }

    giveGuess() {
        var input = document.getElementById('word-input');
        if (input.value != "") {
            this.props.socket.emit('give-guess', this.props.roomKey, input.value);
            input.value = "";
        }
        
    }

    //post game screen: emit to server that player is ready to quit the game

    readyUp() {
        document.getElementById('ready-up-button').classList.toggle("ready-button-ready");
        this.props.socket.emit('ready-up', this.props.roomKey);
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
                                autoCapitalize="off"
                                autoComplete="off"
                                autoCorrect="off"
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

const GameInputPanelWithSocket = props => (
    <SocketContext.Consumer>
        {socket => <GameInputPanel {...props} socket={socket} />}
    </SocketContext.Consumer>
)

export {GameInputPanelWithSocket as default}