import SocketContext from '../socket-context'
import GameUpdates from './GameUpdates.js';

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

const GameInfoPanelWithSocket = props => (
    <SocketContext.Consumer>
        {socket => <GameInfoPanel {...props} socket={socket} />}
    </SocketContext.Consumer>
)

export {GameInfoPanelWithSocket as default}

