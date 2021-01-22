/*

Updates to complete for version 1.0.0:

Dev log - DONE
Guessed word icon - DONE
Front page modal - DONE
Enter sends guess / clue - DONE
Words cycle upon failure to bid - DONE
Instructions, FAQ, etc. on front page - DONE
Game updates basic style UI - DONE
Estimate # of clues given - DONE
End of game screen - go to lobby button, play again button, estimate of words - DONE (enough)
Game clock - DONE (enough)
Minor improvements on game update UI (optional) - DONE
Show team members on larger screens or on dropdown panel - DONE (enough)
Keep score - DONE (enough)
Allow customizable time settings DONE
Manually select clue giver
Reconnection feature
Animations and UI improvements (for clarity)
Fix crashing (null values on disconnect)
Emoji reactions to game updates
Other suggestions from the team
Footer / donate button DONE
Github branching DONE

Before you push to prod:
Fix start game capability
Change time global vars

To-do list:

In no particular order...

- Game clock UI, functionality
- Show more game data (teams list?) on larger views
- Guessed word has icon
- Big style updates for game updates panel:
    - color code updates
    - scrollability
    - clues stay at top? (probably not)
- dev log / update log on front page
- add modal for name, room # on front page join and create room buttons
- make X player cluegiver in lobby / hover over eye to see what it means
- modify game settings in lobby
- enter / return sends clue / guess
- parse multiple words as multiple clues
- track and display clue-words remaining
- attempt to decide a winner or loser after game timer runs out
- play again / return to lobby after game ends
- words cycle if no bid is made
- make words better
- fix security flaws:
    - check for null / handle errors appropriately, server can't crash randomly!
    - verify that user is in the room they claim to be in: overall,
    - verify all user messages that could possibly be faked
- probably make better styling for the entire site, not that important though (change color scheme)
- and, probably define an actual style and feel for the site, not just a font and 1-2 primary colors.
- I'm thinking more than that.
- footer, attribution, contact, donate button, details like that (and: report bug feature)
- animations for important react state changes
- upgrade heroku plan, get a proper domain name
- spread on social media :)
- create a testing / prod server split
*/

//Server imports
const express = require('express');
const socketIO = require('socket.io');
const path = require('path');

const constants = require('./constants');

function setUpServer() {
    console.log(constants.server.PORT);

    //Serve files
    var app = express();
    app.get('/', function(req, res) {
        res.sendFile(path.join(process.cwd() + constants.server.INDEX));
    });
    app.use(express.static(path.join(process.cwd(), 'dist')));
    
    let server = app.listen(constants.server.PORT, () => console.log(`Listening on ${constants.server.PORT}`));
    const io = socketIO(server);
    return io;
}

exports.setUpServer = setUpServer;



