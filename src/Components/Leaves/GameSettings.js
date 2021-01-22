import SocketContext from '../socket-context'
class GameSettings extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            settings : this.props.default
        };
        var that = this;

        this.props.socket.on('change-settings-server', function(data) {
            var temp = {"preBidTime" : data["preBidTime"] / 1000, "bidTime" : data["bidTime"] / 1000, "guessTime" : data["guessTime"] / 1000};
            that.setState({
                settings : temp
            });

            /* have to hardcode this, slider thumbs weren't updating as supposed to */
            var preBidSlider = document.getElementById("slider-pre-bid");
            preBidSlider.value = that.state.settings["preBidTime"];
            var bidSlider = document.getElementById("slider-bid");
            bidSlider.value = that.state.settings["bidTime"];
            var guessSlider = document.getElementById("slider-guess");
            guessSlider.value = that.state.settings["guessTime"];
        });
    }

    componentWillUnmount() {
        this.props.socket.off('change-settings-server');
    }

    componentDidMount() {
        var that = this;
        var preBidSlider = document.getElementById("slider-pre-bid");
        var bidSlider = document.getElementById("slider-bid");
        var guessSlider = document.getElementById("slider-guess");
        preBidSlider.oninput = function() {
            var temp = that.state.settings;
            temp["preBidTime"] = preBidSlider.value;
            that.props.socket.emit('change-settings', that.props.roomKey, temp);
        }

        bidSlider.oninput = function() {
            var temp = that.state.settings;
            temp["bidTime"] = bidSlider.value;
            that.props.socket.emit('change-settings', that.props.roomKey, temp);
        }

        guessSlider.oninput = function() {
            var temp = that.state.settings;
            temp["guessTime"] = guessSlider.value;
            that.props.socket.emit('change-settings', that.props.roomKey, temp);
        }
    }

    render() {
        var that = this;
        return (
            <div className="settings-container">
                <div className="settings-slider-container d-flex align-items-center">
                    <div className="settings-slider-label" id="slider-pre-bid-label">Time before bidding starts: <span id="pre-bid-value">{this.state.settings["preBidTime"]} seconds</span></div>
                    <input type="range" min="1" max="30" defaultValue={this.state.settings["preBidTime"]} onChange={function(val) {that.state.settings["preBidTime"] = val}} className="settings-slider" id="slider-pre-bid" />
                </div>
                <div className="settings-slider-container d-flex align-items-center">
                    <div className="settings-slider-label" id="slider-pre-bid-label">Time to bid: <span id="pre-bid-value">{this.state.settings["bidTime"]} seconds </span></div>
                    <input type="range" min="5" max="30" defaultValue={this.state.settings["bidTime"]}  className="settings-slider" id="slider-bid" />
                </div>
                <div className="settings-slider-container d-flex align-items-center">
                    <div className="settings-slider-label" id="slider-pre-bid-label">Time to guess: <span id="pre-bid-value">{this.state.settings["guessTime"]} seconds </span></div>
                    <input type="range" min="15" max="300" defaultValue={this.state.settings["guessTime"]}  className="settings-slider" id="slider-guess" />
                </div>
            </div>
        );
    }
}

const GameSettingsWithSocket = props => (
    <SocketContext.Consumer>
        {socket => <GameSettings {...props} socket={socket} />}
    </SocketContext.Consumer>
)

export {GameSettingsWithSocket as default}