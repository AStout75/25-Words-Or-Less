class StartGameButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            enabled: false
        };

        socket.on('room-data', data => {
            //Both teams need 2 or more players
            //Double check max players isn't violated

            //Testing: comment out this if else chain

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
            /*this.setState({
                enabled: true
            });*/
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

//export default StartGameButton