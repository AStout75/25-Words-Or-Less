import SocketContext from '../socket-context'

class JoinTeamButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            enabled: true
        }
        var that = this;

        this.props.socket.on('room-data', data => {
            var disable = false;
            // figure out which team they're on
            var members = data["team".concat(that.props.teamNumber)];
            for (var i = 0; i < members.length; i++) {
                
                if (Object.keys(members[i])[0] == that.props.playerId) {
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
        this.props.socket.emit('join-team', key, name, teamNumber);
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

const JoinTeamButtonWithSocket = props => (
    <SocketContext.Consumer>
        {socket => <JoinTeamButton {...props} socket={socket} />}
    </SocketContext.Consumer>
)

export {JoinTeamButtonWithSocket as default}