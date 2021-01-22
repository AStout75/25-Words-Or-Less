import SocketContext from '../socket-context'
class GameUpdates extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            elements: [],
        };
        var that = this;

        this.props.socket.on('game-update', data => {
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
        this.props.socket.off('game-update');
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

const GameUpdatesWithSocket = props => (
    <SocketContext.Consumer>
        {socket => <GameUpdates {...props} socket={socket} />}
    </SocketContext.Consumer>
)

export {GameUpdatesWithSocket as default}