//State updates are for server events
//Client ticks down by itself based off a function called one time in the render
//which has a set time out method

import SocketContext from '../socket-context'

class GameClock extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            timeInitial: 15,
            color: "green",
            circleDashArray: 283,
        };
        this.timer = null;
        this.timePassed = 0;
        this.timeLeft = this.state.timeInitial;

        this.props.socket.on('reset-clock', time => {
            this.setState({
                timeInitial: time,
                color: "green",
                circleDashArray: 283,
            });
            this.timePassed = 0;
            this.timeLeft = time;
            if (time != 0) {
                this.startTimer();
            }
            
        }); 

        var that = this;
        this.props.socket.on('stop-clock', function() {
            clearInterval(that.timer);
        });
    }

    componentWillUnmount() {
        this.props.socket.off('reset-clock');
        clearInterval(this.timer);
    }

    generateClassName() {
        return "base-timer__path-remaining";
    }

    startTimer() {
        // The amount of time passed increments by one
        if (this.timer != null) {
            clearInterval(this.timer);
        }
        this.timer = setInterval(() => {
    
            // The amount of time passed increments by one
            this.timePassed = this.timePassed += 1;
            this.timeLeft = this.state.timeInitial - this.timePassed;
            
            // The time left label is updated
            
            if (this.timeLeft == 0) {
                clearInterval(this.timer);
            }
            document.getElementById("base-timer-label").innerHTML = this.timeLeft;

            //this.setCircleDasharray();
           // console.log("just updated circle dash");
        }, 1000);
    }

    calculateTimeFraction() {
        console.log(this.timeLeft, this.state.timeInitial);
        const rawTimeFraction = this.timeLeft / (this.state.timeInitial);
        console.log(rawTimeFraction, "is the fraction of dash array returned");
        return rawTimeFraction - (1 / (this.state.timeInitial + 1)) * (1 - rawTimeFraction);
    }

    // Update the dasharray value as time passes, starting with 283
    
    setCircleDasharray() {
    const circleDasharray = `${(
        this.calculateTimeFraction() * 283
    ).toFixed(0)} 283`;
    document
        .getElementById("base-timer-path-remaining")
        .setAttribute("stroke-dasharray", circleDasharray);
    }
    
    componentDidMount() {
        
        /*
        console.log('in CDM');
        this.timePassed = 0;
        this.timeLeft = this.state.timeInitial;
        // The amount of time passed increments by one
        this.timePassed = this.timePassed += 1;
        this.timeLeft = this.state.timeInitial - this.timePassed;
        // The time left label is updated
        
        if (this.timeLeft == 0) {
            //clearInterval(timerInterval);
        }
        document.getElementById("base-timer-label").innerHTML = this.timeLeft;

        //this.setCircleDasharray();
        console.log("just updated circle dash");
        console.log("Calling component did mount"); */

        //this.startTimer();
        
    }

    render() {
        return (
            <div className="base-timer rounded-circle">
                <svg className="base-timer__svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <g className="base-timer__circle">
                        <circle className="base-timer__path-elapsed" cx="50" cy="50" r="45" />
                        <path
                            id="base-timer-path-remaining"
                            strokeDasharray="283"
                            className={this.generateClassName()}
                            d="
                            M 50, 50
                            m -45, 0
                            a 45,45 0 1,0 90,0
                            a 45,45 0 1,0 -90,0
                            "
                        >
                    </path>
                    </g>
                </svg>
                <span id="base-timer-label" className="base-timer__label">
                    {this.state.timeInitial}
                </span>
            </div>
        );
    }
}

const GameClockWithSocket = props => (
    <SocketContext.Consumer>
        {socket => <GameClock {...props} socket={socket} />}
    </SocketContext.Consumer>
)

export {GameClockWithSocket as default}