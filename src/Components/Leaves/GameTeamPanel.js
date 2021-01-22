/*
    Similar to TeamMembers, displays the members of each team during game time.
*/

import SocketContext from '../socket-context'

class GameTeamPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            clueGiverIndex: props.roomData["team".concat(this.props.teamNumber).concat("ClueGiverIndex")],
            members: props.roomData["team".concat(this.props.teamNumber)],
            score: this.props.roomData["team" + this.props.teamNumber + "Score"],
            readyPlayers: []
        };

        var that = this;
        this.props.socket.on('score-update', data => {
            that.setState({
                score: data[that.props.teamNumber]
            });
        }); 

        this.props.socket.on('ready-up-server', data => {
            that.setState({
                readyPlayers: data
            })
        });
    }

    componentWillUnmount() {
        this.props.socket.off('score-update');
        this.props.socket.off('ready-up-server');
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
                    className={
                        (index == that.state.clueGiverIndex ? "game-team-member clue-giver" : "game-team-member") + 
                        (that.state.readyPlayers.includes(Object.keys(member)[0]) ? " ready-player" : "")
                    }
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

const GameTeamPanelWithSocket = props => (
    <SocketContext.Consumer>
        {socket => <GameTeamPanel {...props} socket={socket} />}
    </SocketContext.Consumer>
)

export {GameTeamPanelWithSocket as default}