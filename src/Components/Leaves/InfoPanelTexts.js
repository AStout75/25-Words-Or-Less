import SocketContext from '../socket-context'

class InfoPanelTexts extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            playerCount: props.playerCount,
        };

        this.props.socket.on('room-data', data => {
            this.setState({
                playerCount: data["playerCount"]
            });
        }); 
    }

    componentWillUnmount() {
        this.props.socket.off('room-data');
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

const InfoPanelTextsWithSocket = props => (
    <SocketContext.Consumer>
        {socket => <InfoPanelTexts {...props} socket={socket} />}
    </SocketContext.Consumer>
)

export {InfoPanelTextsWithSocket as default}