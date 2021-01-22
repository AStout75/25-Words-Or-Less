import SocketContext from '../socket-context';

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

const TeamScoresWithSocket = props => (
    <SocketContext.Consumer>
        {socket => <TeamScores {...props} socket={socket} />}
    </SocketContext.Consumer>
)

export {TeamScoresWithSocket as default}