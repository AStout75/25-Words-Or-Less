import SocketContext from '../socket-context';

class TeamMembers extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            clueGiverIndex: 0,
            members: [],
        };

        this.props.socket.on('room-data', data => {
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

const TeamMembersWithSocket = props => (
    <SocketContext.Consumer>
        {socket => <TeamMembers {...props} socket={socket} />}
    </SocketContext.Consumer>
)

export {TeamMembersWithSocket as default}