const log = [
{
    
    version: "0.9.4",
    date: "1/22/21",
    title: "Big code organizing and simultaneous game bug-fix",
    bullets: [
        "Source code now on Github and much more organized than before",
        "Simultaneously running games no longer use the same game clock object in code (oops)",
        "Added footer and donate button ;)"
    ], 
},
{
    
    version: "0.9.2",
    date: "10/25/20",
    title: "Ready indicator",
    bullets: [
        "Players who are ready to move to the next game are colored in green",
    ], 
},
{
    
    version: "0.9.1",
    date: "10/16/20",
    title: "Game settings",
    bullets: [
        "Customize your game with the new game settings panel in the game lobby",
        "Fixed score display issue",
    ],
},
{
    
    version: "0.9.0",
    date: "10/11/20",
    title: "Layout changes and improvements",
    bullets: [
        "Improved formatting during game mode; Clock stays next to words",
        "Teams are displayed on corners of the game page on large enough screens (mobile view coming soon)",
        "Score is kept track of on a per-team basis and is displayed on the pre-game page. (Note: joining a room will incorrectly always display the score as 0-0, but this is just a temporary visual bug, the room's score is saved server-side)",
        "Nicknames are capped at 32 characters",
        "Minor bug fixes and improvements - clock stops when game ends, words remain 'checked' once guessed",
    ], 
},
{
    
    version: "0.8.4",
    date: "10/03/20",
    title: "Gameplay bug fixes and game clock adjustment",
    bullets: [
        "Game clock stays right at the top, and is positioned foreground relative to game updates",
        "Sending a guess that contains the right word no longer contributes to ending the game early",
        "It also properly displays the guessed word to the clue guessers in the words panel and in the game updates panel",
    ], 
},
{
    
    version: "0.8.0",
    date: "09/22/20",
    title: "Deployment, room size, game clock",
    bullets: [
        "Room size increased to 16 with 8 per team",
        "Game clock added, still needs positioning fix",
        "Repeated guesses now have a background color",
        "Game is now available on <a href='https://25words.games'>https://25words.games!</a>",
        "Server capacities increased",
    ], 
},
{
    
    version: "0.7.0",
    date: "09/04/20",
    title: "Gameplay",
    bullets: [
        "Round ends when all words are guessed",
        "Exact same clue words can be repeated",
        "Upon giving a clue, remind players how many are left",
    ], 
},
{
    
    version: "0.6.0",
    date: "09/03/20",
    title: "Usability, game results",
    bullets: [
        "Auto-focus create room, join room, give clue, and give guess input fields upon load",
        "Pressing enter attempts to create or join room",
        "Game attempts to tally up clues given",
        "'Ready up' button and restarting games functionality",
    ], 
},
{
    
    version: "0.5.2",
    date: "09/01/20",
    title: "Game improvements, back-end changes",
    bullets: [
        "New words come if no one bids",
        "Back end file organization",
        "Pressing enter submits your clue / guess",
        "Color code game updates (needs improvement)",
        "How to play and FAQ section on homepage",
    ], 
},
{
    
    version: "0.5.1",
    date: "08/31/20",
    title: "Title page changes",
    bullets: [
        "Clicking Create a room or Join a room will open a modal overlay instead of relying on the join code box and a window prompt",
    ], 
},
{
    
    version: "0.5.0",
    date: "08/31/20",
    title: "Preliminary, workable version of a finished game",
    bullets: [
        "Title page",
        "Creating, joining, and leaving server rooms",
        "Arranging team members",
        "Bidding for words",
        "Giving clues and sending guesses",
        "Sent guesses are validated by server",
        "Displaying words to players at appropriate times",
        "Game updates are shown to all players",
        "Server manages a time limit on different game stages",
        "Intermediary phases between / before bidding and guessing",
        "Dev log",
    ], 
},
{
    
    version: "0.0.0",
    date: "08/24/20",
    title: "Development started",
    bullets: [
        "Playing around with a few features",
    ], 
},
];

export {log as default}