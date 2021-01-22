import SocketContext from './Components/socket-context';

import Main from './Components/Pages/Main';

//Initialize web socket upon page visit
let socket = io();

//Give the socket context to a file so that nested react components may access it
//This is done by nesting the <Main> element (root element) inside an <App> element
//that provides socket context to all children
const App = props => (
    <SocketContext.Provider value={socket}>
        <Main />
    </SocketContext.Provider>
)

//Attach the react render to the DOM
ReactDOM.render(
    <App />,
    document.getElementById('root')
);

socket.emit('connect'); 