import SocketContext from '../socket-context'

class Word extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hidden: true,
            value: "???",
            guessed: false
        }
        var that = this;

        this.props.socket.on('words', words => {
            this.setState({
                hidden: false,
                value: words[that.props.index],
            });
        });

        this.props.socket.on('word-guessed', (word, index) => {
            if (index == that.props.index) {
                this.setState({
                    hidden: false,
                    value: word,
                    guessed: true
                });
            }
            
        });
    }

    componentWillUnmount() {
        this.props.socket.off('words');
        this.props.socket.off('word-guessed');
    }

    render() {
        if (this.state.hidden) {
            return (
                <div className="words-panel-word hidden-word d-flex align-items-center justify-content-center">
                    {this.state.value}
                </div>
            );
            
        }
        else {
            if (this.state.guessed) {
                return (
                    <div className="words-panel-word guessed-word d-flex align-items-center justify-content-center">
                        {this.state.value}
                    </div>
                );
            }
            else {
                return (
                    <div className="words-panel-word d-flex align-items-center justify-content-center">
                        {this.state.value}
                    </div>
                );
            }
            
        }
        
    }
}

const WordWithSocket = props => (
    <SocketContext.Consumer>
        {socket => <Word {...props} socket={socket} />}
    </SocketContext.Consumer>
)

export {WordWithSocket as default}