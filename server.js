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
Allow customizable time settings
Manually select clue giver
Reconnection feature
Animations and UI improvements (for clarity)
Fix crashing (null values on disconnect)
Emoji reactions to game updates
Other suggestions from the team
Footer / donate button
Github branching

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

'use strict';

const express = require('express');
const socketIO = require('socket.io');
const path = require('path');
const { get } = require('http');

const PORT = process.env.PORT || 3000;
const INDEX = '/public/views/index.html';

console.log(PORT);

var app = express();
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + INDEX));
});
app.use(express.static(path.join(__dirname, 'public')));

let server = app.listen(PORT, () => console.log(`Listening on ${PORT}`));
const io = socketIO(server);

var gameTimer;
const BID_TIME = 10000; //ms
const PRE_BID_TIME = 10000; //ms
const PRE_GUESS_TIME = 3000;
const GUESS_TIME = 150000;

var rooms = {}; //track room data
var words = {}; //track words for rooms in a (key - words list) dictionary
var IdToRoom = {};
var wordBank = 
    {
        "easy" : 
            [
                "baby", "door", "banana", "finger", "fence", "big", "swimming", "pool", "sun", "church", "yo-yo", "boy", "bag", "alligator", "mouse", "birthday", "winter", "beach", "tree", "teacher", "king", "telephone", "eye", "water", "jelly", "balloon", "toothbrush", "pants", "mom", "body", "bike", "toilet", "paper", "baseball", "pig", "lawn", "mower", "fire", "school", "belt", "pajamas", "mud", "ice", "cream", "cone", "arm", "drums", "spider", "shark", "seashell", "computer", "grandma", "pillow", "kite", "homework", "ladybug", "bed", "bird", "gum", "book", "dress", "queen", "puppy", "happy", "doctor", "frog", "blanket", "popsicle", "pen", "sandwich", "boat", "dad", "lunchbox", "ice", "bottle", "elbow", "penny", "broom", "dog", "rose", "picnic", "chair", "duck", "hair", "zoo", "party", "piano", "key", "apple", "chalk", "park", "clock", "pencil", "hill", "flag", "lollipop", "candle", "flower", "basketball", "hug", "clown", "paper", "mountain", "nose", "cow", "grown-up", "grass", "rainbow", "hide-and-seek", "pocket", "grape", "cowboy", "doll", "forehead", "football", "crayon", "desk", "TV", "bedtime", "hopscotch", "dump", "truck", "cold", "paint", "ear", "moon",
            ],
        "medium" :
            [
                "taxi", "cab", "standing", "ovation", "alarm", "clock", "tool", "banana", "peel", "flagpole", "money", "wallet", "ballpoint", "pen", "sunburn", "wedding", "ring", "spy", "baby-sitter", "aunt", "acne", "bib", "puzzle", "piece", "pawn", "astronaut", "tennis", "shoes", "blue", "jeans", "twig", "outer", "space", "banister", "batteries", "doghouse", "campsite", "plumber", "bedbug", "throne", "tiptoe", "log", "mute", "pogo", "stick", "stoplight", "ceiling", "fan", "bedspread", "bite", "stove", "windmill", "nightmare", "stripe", "spring", "wristwatch", "eat", "matchstick", "gumball", "bobsled", "bonnet", "flock", "sprinkler", "living", "room", "laugh", "snuggle", "sneeze", "bud", "elf", "headache", "slam", "dunk", "Internet", "saddle", "ironing", "board", "bathroom", "scale", "kiss", "shopping", "cart", "shipwreck", "funny", "glide", "lamp", "candlestick", "grandfather", "rocket", "home", "movies", "seesaw", "rollerblades", "smog", "grill", "goblin", "coach", "claw", "cloud", "shelf", "recycle", "glue", "stick", "Christmas", "carolers", "front", "porch", "earache", "robot", "foil", "rib", "robe", "crumb", "paperback", "hurdle", "rattle", "fetch", "date", "iPod", "dance", "cello", "flute", "dock", "prize", "dollar", "puppet", "brass", "firefighter", "huddle", "easel", "pigpen", "bunk", "bed", "bowtie", "fiddle", "dentist", "baseboards", "letter", "opener", "photographer", "magic", "Old", "Spice", "monster"
            ],
        "hard" :
            [
                "whatever", "buddy", "sip", "chicken", "coop", "blur", "chime", "bleach", "clay", "blossom", "cog", "twitterpated", "wish", "through", "feudalism", "whiplash", "cot", "blueprint", "beanstalk", "think", "cardboard", "darts", "inn", "Zen", "crow's", "nest", "BFF", "sheriff", "tiptop", "dot", "bob", "garden", "hose", "blimp", "dress", "shirt", "reimbursement", "capitalism", "step-daughter", "applause", "jig", "jade", "blunt", "application", "rag", "squint", "intern", "sow's", "ear", "brainstorm", "sling", "half", "pinch", "leak", "skating", "rink", "jog", "jammin'", "shrink", "ray", "dent", "scoundrel", "escalator", "cell", "phone", "charger", "kitchen", "knife", "set", "sequins", "ladder", "rung", "flu", "scuff", "mark", "mast", "sash", "modern", "ginger", "clockwork", "mess", "mascot", "runt", "chain", "scar", "tissue", "suntan", "pomp", "scramble", "sentence", "first", "mate", "cuff", "cuticle", "fortnight", "riddle", "spool", "full", "moon", "forever", "rut", "hem", "new", "freight", "train", "diver", "fringe", "humidifier", "handwriting", "dawn", "dimple", "gray", "hairs", "hedge", "plank", "race", "publisher", "fizz", "gem", "ditch", "wool", "plaid", "fancy", "ebony", "and", "ivory", "feast", "Murphy's", "Law", "billboard", "flush", "inconceivable", "tide", "midsummer", "population", "my", "elm", "organ", "flannel", "hatch", "booth"
            ],
        "zhang" :
            [
                "question", "Paul Newman", "earthworm", "leak", "mail", "Eddie Murphy", "raffle", "tap", "lock", "cellular phone", "long johns", "spout", "rodeo", "tobacco", "mouth", "Brooke Shields", "Seinfel", "reptile", "Niagara Fall", "positive", "booklet", "humidity", "wine", "Ireland", "rubber", "satellite", "scholarship", "scars", "conference call", "essential", "feather", "flare", "cowboy", "Manhattan", "butterfly", "mosquito", "Barbara Bush", "tuxedo", "Academy Awards", "recognize", "strap", "check", "mice", "fife", "Matt Lauer", "square", "bagel", "Magic Johnson", "noodle", "wits", "recliner", "nickel", "pauper", "scissors", "Cajun", "lullaby", "hibernate", "locomotive", "jade", "steam", "patron", "trousers", "avalanche", "yodel", "coyote", "teacher", "valet", "chopsticks", "navel", "Kin", "Garth Brooks", "patch", "company", "loan", "spinach", "pattern", "hyena", "leotard", "stripper", "Florida", "Goldie Hawn", "saloon", "patrol", "bell bottoms", "chemistry", "peg", "Bob Hope", "milkshake", "law", "seat belt", "layer", "blotter", "drench", "peel", "breakfast", "hitch", "pilot", "visit", "bingo", "Jim Morrison", "Ozzie & Harriet", "tab", "pea", "machine", "fairy", "yarn", "curtain", "loafer", "pageant", "jar", "sunset", "refurbish", "traffic", "grave stone", "New Orleans", "cellar", "viper", "sandwich", "cow", "flower", "harp", "spray paint", "starfish", "traitor", "wart", "gold mine", "tidal wave", "mixer", "thief", "harm", "hangover", "chicken soup", "prom", "honeymoon", "liposuction", "Santa Claus", "Elton John", "boxing gloves", "go-cart", "governor", "inside", "burn", "Confucius", "Arkansas", "Exodus", "list", "Jamaica", "gingerbread", "Van Gogh", "night stick", "journal", "luggage", "Denver", "aquarium", "curtsy", "favor", "fear", "film", "Dr. Spock", "marmalade", "floss", "gather", "crutches", "grab", "static", "Nicolas Cage", "sauce", "war", "fin", "chastity", "anchovy", "litterbug", "pasta", "Kermit", "bandit", "gossip", "toddler", "Captain Hook", "cough drop", "flight attendent", "answering machine", "corporation", "wallflower", "gift", "outline", "flexible", "seashell", "George Costanza", "game", "walk", "slot machine", "photograph", "paper", "Martian", "degree", "Aspen", "plantation", "pistachio", "rash", "elevator", "dice", "family", "green", "boots", "turkey", "Chrome", "galley", "Brussel sprouts", "fleece", "vanilla", "elderly", "windchimes", "trade", "erase", "Atlanta Braves", "buttonhole", "connect", "biceps", "divide", "sunburn", "soup", "ice", "dancing", "aircraft", "cricket", "Keith Richards", "hymn", "hypnosis", "venom", "Demi Moore", "alphabet", "Hercules", "enemy", "chapel", "Rome", "bozer shorts", "fire engine", "fork", "handbag", "intelligence", "thumb tack", "sushi", "gas", "spaghetti", "Pony express", "dishwasher", "World Series", "hickory", "virtual", "lighthouse", "branch", "desk", "racquet", "board", "Kideny bean", "beard", "mask", "Jerry Seinfeld", "apartment", "shoes", "Bill Cosby", "quily", "painter", "sand", "thong", "reindeer", "punch", "spine", "sangria", "warehouse", "geography", "cassette", "lawn", "nickname", "weight", "Twister", "Connecticut", "manuscript", "promise", "lava", "soda", "Monty Python", "kidney", "pillow", "kernel", "pail", "lake", "khakis", "sandpaper", "knob", "strip", "trout", "linen", "close", "Kathie Lee Gifford", "blackout", "purchase", "treat", "nervous", "awe", "month", "hot dog", "lightnight", "juke box", "politician", "note pad", "motorboat", "chainsaw", "neighborhood", "birthday", "hum", "Houdini", "seesaw", "Charles Lindbergh", "fossil", "hospital", "ivory", "rosary", "spoon", "Jay Leno", "candle", "open", "hamstring", "clothesline", "stainless steel", "Howard Stern", "golf club", "slick", "ruler", "blind date", "keepsake", "hoot", "neon", "explostion", "reflex", "puppy", "T-shirt", "expert", "mouse trap", "Nat King Cole", "lettuce", "stadium", "skiing", "map", "amnesia", "demon", "field", "rice", "antenna", "spark", "limp", "Red Cross", "ammonia", "Jodie Foster", "veal", "Oahu", "receipt", "grass", "belly", "whirlpool", "birdseed", "hardware", "mussel", "button", "chateau", "poncho", "meteor", "collar", "observatory", "laundry", "acrobat", "cello", "deodorant", "King Midas", "guacamole", "diamond", "crawl", "ale", "barge", "compact disk", "pumpkin", "stutter", "Dumbo", "itch", "tongue", "pawn shop", "occult", "Roseanne", "daffodil", "rail", "poster", "punchline", "roll", "Bette Midler", "plump", "ticket", "wood", "rope", "fruit salad", "Sally Field", "jerk", "The Partridge Family", "quiche", "century", "court", "Athens", "eyelash", "lunch", "prize", "food", "weekend", "coworker", "freedom", "glaze", "barrier", "percentage", "lion tamer", "stock exchange", "searchlight", "quit", "rattle", "garter", "marijuana", "parrot", "saxophone", "Montezumo", "hamster", "shuttle", "pans", "parlor", "dungeon", "beetle", "elf", "Kathleen Turner", "raspberries", "subway", "eyelid", "insect", "thight", "puddle", "dictator", "gauze", "jockey", "opinion", "Monte Carlo", "Ellis Island", "embroidery", "lavender", "option", "teenager", "landlord", "nutcracker", "pudding", "crock pot", "radiator", "ambulance", "intersection", "sprint", "retirement", "vineyard", "puncushion", "continent", "liquor", "slave", "William Shatner", "pickpocket", "limbo", "holiday", "whipped cream", "shawl", "wand", "Key West", "fingerpaint", "victory", "nurse", "song", "Pittsburgh Steelers", "Everglades", "lotion", "arsenic", "pastry", "mascot", "reed", "Casablanca", "Nancy Kerrigan", "mush", "oven", "nozzle", "martyr", "roller skate", "stuffing", "pigeon", "Great Lakes", "Graceland", "tush", "peep", "skeleton", "engine", "Betsy Ross", "croak", "island", "antique", "cigar", "bull", "gem", "garbage can", "clown", "soccer ball", "eggplant", "lumberjack", "limb", "sneeze", "Huck Finn", "Regis Philbin", "mob", "leaf", "moss", "toy box", "coffee", "lizard", "charcoal", "eyewitness", "Apollo", "intern", "canoe", "bracelet", "Indiana Jones", "odor", "parakeet", "reason", "siren", "politics", "athlete", "circle", "John F. Kennedy Jr.", "sunflower", "John Travolta", "president", "coma", "delicatessen", "shell", "tape", "staple", "beer", "wood stove", "brick", "castle", "maid", "E.T.", "staff", "veterinarian", "summer", "lawn mower", "llama", "barbed wire", "microscopic", "knot", "sweat", "truffle", "mold", "Dean Martin", "pulse", "bald", "memory", "rob", "squeal", "currency", "entrance", "requirement", "super", "homework", "dip", "definition", "mallet", "call", "moat", "altar", "nose", "harpoon", "wheelbarrow", "pirate", "envy", "tiger", "Little Red Riding Hood", "violin", "banana", "camper", "black hole", "fudge", "Thomas Jefferson", "phtographer", "gymnastics", "laugh", "Super Bowl", "monkey", "harem", "Times Square", "lingerie", "muffler", "otter", "razor", "bubble", "duct tape", "ingredients", "x-rays", "exhaustian", "earache", "yacht", "fax machine", "keg", "farmhouse", "accelerator", "kindergarten", "panel", "foam", "Tennessee", "kite", "pants", "ramp", "cauliflower", "napkin", "Humphrey Bogart", "sundial", "blank", "incense", "oasis", "Nobel Prize", "jackpot", "dandruff", "acupuncture", "escape", "label", "fair", "Dan Akroyd", "zero", "racehorse", "macaroni", "galaxy", "yard", "saddle", "turtle", "piranha", "Al Pacino", "Flipper", "belt", "blue jeans", "chest", "telephone", "watermelon", "ammunition", "cab", "statue", "bellhop", "Beaver Cleaver", "jacks", "river", "mud puddle", "sharp", "diaper", "moonbeams", "faucet", "angel", "clout", "brunch", "newborn", "loathe", "control", "wrapping paper", "echo", "bells", "socks", "flag", "comedian", "remote control", "apple pie", "wreck", "white", "redwood tree", "work boots", "rainbow", "horn", "epidemic", "gondola", "Mardi Gras", "flamingo", "trash compactor", "blender", "escalator", "mail box", "addiction", "digest", "King Kong", "buckle", "fire escape", "flour", "Neptune", "arcade", "compass", "dye", "supper", "Mickey Mantle", "life raft", "firecracker", "audience", "godchild", "sewing machine", "bat", "wreath", "outlet", "headlights", "Kim Basinger", "talk", "scab", "Charlie Sheen", "wife", "project", "tantrum", "fog", "runway", "Adam", "bar", "horse", "elbow", "knife", "cauldron", "hoof", "mantel", "pitchfork", "paradise", "democracy", "mannequin", "Danny DeVito", "pearl", "rum", "trash", "network", "tea", "Holland", "alumnus", "bazaar", "emergency room", "whale", "vase", "groupie", "Paris", "wallet", "toothpick", "organ", "shower curtain", "fish tank", "shrimp", "rocket", "chicken pox", "geology", "binoculars", "crazy", "voyage", "Amelia Earhart", "dune", "Mother Goose", "Sherlock Holmes", "commercial", "glove", "path", "fruit", "riddle", "file cabinet", "veto", "witch", "swingset",
            ],
        "bonnie" :
            [
                "Acne", "Flush", "Popsicle", "movie", "useful", "Acre", "Flutter", "Population", "death", "diplomat", "Advertise", "Fog", "Portfolio", "woman", "hard", "Aircraft", "Foil", "Positive", "assignment", "veil", "Aisle", "Football", "Post", "effort", "society", "Alligator", "Forehead", "Princess", "singer", "rescue", "Alphabetize", "Forever", "Procrastinate", "information", "dimension", "America", "Fortnight", "Protestant", "airport", "prestige", "Ankle", "France", "Psychologist", "method", "related", "Applesauce", "Freckle", "Publisher", "child", "virtue", "Application", "Freight", "Punk", "homework", "total", "Archaeologist", "Fringe", "Puppet", "significance", "courage", "Aristocrat", "Frog", "Puppy", "way", "well", "Armada", "Frown", "Push", "professor", "subject", "Asleep", "Gallop", "Puzzle", "diamond", "control", "Astronaut", "Game", "Quarantine", "quality", "gloom", "Athlete", "Garbage", "Queen", "tale", "improve", "Atlantis", "Garden", "Quicksand", "accident", "file", "Aunt", "Gasoline", "Quiet", "cousin", "golf", "Avocado", "Gem", "Race", "expression", "drama", "Backbone", "Ginger", "Radio", "policy", "routine", "Bag", "Gingerbread", "Raft", "song", "surgeon", "Baguette", "Girl", "Rag", "procedure", "mainstream", "Bald", "Glasses", "Rainbow", "safety", "fish", "Balloon", "Goblin", "Rainwater", "error", "plaster", "Banana", "Gold", "Random", "combination", "herd", "Banister", "Goodbye", "Ray", "climate", "piece", "Baseball", "Grandpa", "Recycle", "owner", "noble", "Baseboards", "Grape", "Red", "village", "theme", "Basketball", "Grass", "Regret", "newspaper", "slow", "Bat", "Gratitude", "Reimbursement", "cigarette", "ladder", "Battery", "Gray", "Retaliate", "ladder", "urine", "Beach", "Green", "Rib", "distribution", "essential", "Beanstalk", "Guitar", "Riddle", "composer", "baseball", "Beer", "Gum", "Rim", "colony", "rainbow", "Beethoven", "Gumball", "Rink", "salesperson", "outer", "Belt", "Hair", "Roller", "major", "drift", "Bib", "Half", "Room", "perform", "injury", "Bicycle", "Handle", "Rose", "pigeon", "confine", "Bike", "Handwriting", "Round", "clinic", "honor", "Billboard", "Hang", "Roundabout", "midnight", "science", "Bird", "Happy", "Rung", "curtain", "frame", "Birthday", "Hat", "Runt", "robot", "wear", "Bite", "Hatch", "Rut", "testify", "plan", "Blacksmith", "Headache", "Sad", "introduction", "tail", "Blanket", "Heart", "Safe", "employee", "cage", "Bleach", "Hedge", "Salmon", "afford", "wave", "Blimp", "Helicopter", "Salt", "behavior", "am", "Blossom", "Hem", "Sandbox", "register", "formal", "Blueprint", "Hide", "Sandcastle", "crevice", "smooth", "Blur", "Hill", "Sandwich", "justify", "live", "Boat", "Hockey", "Sash", "accessible", "folklore", "Bobsled", "Homework", "Satellite", "detail", "retreat", "Body", "Honk", "Scar", "track", "acquisition", "Bomb", "Hopscotch", "Scared", "singer", "speculate", "Bonnet", "Horse", "School", "disco", "peak", "Book", "Hose", "Scoundrel", "interest", "Booth", "Hot", "Scramble", "interactive", "memory", "Bowtie", "House", "Scuff", "name", "frame", "Box", "Houseboat", "Seashell", "light", "period", "Brainstorm", "Hug", "Season", "duke", "piano", "Brand", "Humidifier", "Sentence", "picture", "relinquish", "Brave", "Hungry", "Sequins", "hurt", "public", "Bride", "Hurdle", "Set", "cruelty", "pace", "Bridge", "Hurt", "Shaft", "window", "campaign", "Broccoli", "Hut", "Shallow", "trouble", "bolt", "Broken", "Ice", "Shampoo", "warning", "lend", "Broom", "Implode", "Shark", "contain", "cinema", "Bruise", "Inn", "Sheep", "change", "inside", "Brunette", "Inquisition", "Sheets", "workshop", "overeat", "Bubble", "Intern", "Sheriff", "star", "duck", "Buddy", "Internet", "Shipwreck", "scramble", "perfect", "Buffalo", "Invitation", "Shirt", "evoke", "wonder", "Bulb", "Ironic", "Shoelace", "memorandum", "satellite", "Bunny", "Ivory", "Short", "long", "wait", "Bus", "Ivy", "Shower", "guerrilla", "remunerate", "Buy", "Jade", "Shrink", "beam", "personality", "Cabin", "Japan", "Sick", "child", "hide", "Cafeteria", "Jeans", "Siesta", "pity", "ambiguity", "Cake", "Jelly", "Silhouette", "present", "condition", "Calculator", "Jet", "Singer", "declaration", "term", "Campsite", "Jig", "Sip", "push", "eavesdrop", "Can", "Jog", "Skate", "agriculture", "roof", "Canada", "Journal", "Skating", "toll", "bus", "Candle", "Jump", "Ski", "rotation", "onion", "Candy", "Key", "Slam", "able", "disk", "Cape", "Killer", "Sleep", "appear", "seem", "Capitalism", "Kilogram", "Sling", "deteriorate", "spray", "Car", "King", "Slow", "coup", "temple", "Cardboard", "Kitchen", "Slump", "compose", "acute", "Cartography", "Kite", "Smith", "roof", "promotion", "Cat", "Knee", "Sneeze", "defeat", "disco", "Cd", "Kneel", "Snow", "dance", "remedy", "Ceiling", "Knife", "Snuggle", "bacon", "wander", "Cell", "Knight", "Song", "density", "digress", "Century", "Koala", "Space", "subway", "racism", "Chair", "Lace", "Spare", "tick", "urine", "Chalk", "Ladder", "Speakers", "linen", "productive", "Champion", "Ladybug", "Spider", "shock", "shave", "Charger", "Lag", "Spit", "profit", "shorts", "Cheerleader", "Landfill", "Sponge", "coach", "fornicate", "Chef", "Lap", "Spool", "horn", "kitty", "Chess", "Laugh", "Spoon", "mechanism", "marvel", "Chew", "Laundry", "Spring", "resign", "batman", "Chicken", "Law", "Sprinkler", "fuel", "robinhood", "Chime", "Lawn", "Spy", "prosper", "apple", "China", "Lawnmower", "Square", "discriminate", "cinderella", "Chocolate", "Leak", "Squint", "conscience", "mulan", "Church", "Letter", "Stairs", "presidency", "minecraft", "Circus", "Level", "Standing", "bend", "James", "Clay", "Lifestyle", "Star", "get", "girlfriend", "Cliff", "Ligament", "State", "exact", "wife", "Cloak", "Light", "Stick", "coat", "watermelon", "Clockwork", "Lightsaber", "Stockholder", "shake", "Hollywood", "Clown", "Lime", "Stoplight", "demand", "refrigerator", "Clue", "Lion", "Stout", "popular", "dull", "Coach", "Lizard", "Stove", "omission", "fastidious", "Coal", "Log", "Stowaway", "sample", "stomach", "Coaster", "Loiterer", "Straw", "class", "simplicity", "Cog", "Lollipop", "Stream", "analyst", "skeleton", "Cold", "Loveseat", "Streamline", "spider", "pour", "College", "Loyalty", "Stripe", "divorce", "host", "Comfort", "Lunch", "Student", "gregarious", "thank", "Computer", "Lunchbox", "Sun", "experience", "borrow", "Cone", "Lyrics", "Sunburn", "dictionary", "researcher", "Constrictor", "Machine", "Sushi", "theater", "remark", "Continuum", "Macho", "Swamp", "return", "anticipation", "Conversation", "Mailbox", "Swarm", "feedback", "shape", "Cook", "Mammoth", "Sweater", "host", "grace", "Coop", "Mark", "Swimming", "reproduction", "separate", "Cord", "Mars", "Swing", "hypothesis", "thin", "Corduroy", "Mascot", "Tachometer", "deteriorate", "improve", "Cot", "Mast", "Talk", "material", "tract", "Cough", "Matchstick", "Taxi", "laser", "unity", "Cow", "Mate", "Teacher", "settle", "cluster", "Cowboy", "Mattress", "Teapot", "effective", "decisive", "Crayon", "Mess", "Teenager", "carbon", "court", "Cream", "Mexico", "Telephone", "rest", "catalogue", "Crisp", "Midsummer", "Ten", "knee", "gem", "Criticize", "Mine", "Tennis", "stall", "rule", "Crow", "Mistake", "Thief", "snub", "marathon", "Cruise", "Modern", "Think", "collection", "arm", "Crumb", "Mold", "Throne", "firm", "acceptance", "Crust", "Mom", "Through", "blue", "inject", "Cuff", "Monday", "Thunder", "whisper", "remunerate", "Curtain", "Money", "Tide", "blast", "opposition", "Cuticle", "Monitor", "Tiger", "threaten", "population", "Czar", "Monster", "Time", "precede", "book", "Dad", "Mooch", "Tinting", "hope", "hotdog", "Dart", "Moon", "Tiptoe", "discuss", "salesperson", "Dawn", "Mop", "Tiptop", "golf", "stadium", "Day", "Moth", "Tired", "virtue", "drama", "Deep", "Motorcycle", "Tissue", "landscape", "seminar", "Defect", "Mountain", "Toast", "abuse", "write", "Dent", "Mouse", "Toilet", "shock", "consumption", "Dentist", "Mower", "Tool", "residence", "series", "Desk", "Mud", "Toothbrush", "variation", "chop", "Dictionary", "Music", "Tornado", "harass", "jacket", "Dimple", "Mute", "Tournament", "grave", "ridge", "Dirty", "Nature", "Tractor", "digress", "Dismantle", "Negotiate", "Train", "safari", "reign", "Ditch", "Neighbor", "Trash", "execute", "mask", "Diver", "Nest", "Treasure", "deck", "taste", "Doctor", "Neutron", "Tree", "breeze", "musical", "Dog", "Niece", "Triangle", "sharp", "ideology", "Doghouse", "Night", "Trip", "eyebrow", "champion", "Doll", "Nightmare", "Truck", "rich", "soul", "Dominoes", "Nose", "Tub", "rehabilitation", "jealous", "Door", "Oar", "Tuba", "criminal", "peanut", "Dot", "Observatory", "Tutor", "calendar", "abolish", "Drain", "Office", "Television", "software", "address", "Draw", "Oil", "Twang", "gallery", "nightmare", "Dream", "Old", "Twig", "slow", "marathon", "Dress", "Olympian", "Twitterpated", "instruction", "chalk", "Drink", "Opaque", "Type", "young", "loot", "Drip", "Opener", "Unemployed", "temple", "sock", "Drums", "Orbit", "Upgrade", "summary", "squeeze", "Dryer", "Organ", "Vest", "represent", "lounge", "Duck", "Organize", "Vision", "assessment", "block", "Dump", "Outer", "Wag", "eject", "trust", "Dunk", "Outside", "Water", "strap", "snarl", "Dust", "Ovation", "Watermelon", "spare", "produce", "Ear", "Overture", "Wax", "make", "housing", "Eat", "Pail", "Wedding", "bad", "requirement", "Ebony", "Paint", "Weed", "seal", "variety", "Elbow", "Pajamas", "Welder", "feign", "replace", "Electricity", "Palace", "Whatever", "related", "straw", "Elephant", "Pants", "Wheelchair", "battle", "treat", "Elevator", "Paper", "Whiplash", "gown", "landowner", "Elf", "Paper", "Whisk", "established", "writer", "Elm", "Park", "Whistle", "color", "fog", "Engine", "Parody", "White", "rain", "dignity", "England", "Party", "Wig", "plug", "artist", "Ergonomic", "Password", "Will", "forestry", "funny", "Escalator", "Pastry", "Windmill", "vein", "knife", "Eureka", "Pawn", "Winter", "convert", "electronics", "Europe", "Pear", "Wish", "temple", "smooth",
 "Evolution", "Pen", "Wolf", "discover", "full", "Extension", "Pencil", "Wool", "district", "exclusive", "Eyebrow", "Pendulum", "World", "protest", "environment", "Fan", "Worm", "hear", "mosquito", "Fancy", "Penny", "Wristwatch", "rung", "cucumber", "Fast", "Pepper", "Yardstick", "trap", "final", "Feast", "Personal", "Zamboni", "joy", "liability", "Fence", "Philosopher", "Zen", "deteriorate", "sea", "Feudalism", "Phone", "Zero", "trainer", "bury", "Fiddle", "Photograph", "Zipper", "carbon", "threshold", "Figment", "Piano", "Zone", "attitude", "job", "Finger", "Picnic", "Zoo", "reconcile", "lesson", "Fire", "Pigpen", "savage", "sculpture", "minimum", "First", "Pillow", "Ryan", "mastermind", "east", "Fishing", "Pilot", "Austin", "different", "bounce", "Fix", "Pinch", "Sho", "license", "veteran", "Fizz", "Ping", "Billy", "good", "salon", "Flagpole", "Pinwheel", "Bonnie", "cheese", "quit", "Flannel", "Pirate", "version", "multiply", "pour", "Flashlight", "Plaid", "insect", "condition", "manner", "Flock", "Plan", "hotel", "win", "wilderness", "Flotsam", "Plank", "percentage", "bomber", "related", "Flower", "Plate", "possibility", "free", "surface", "Flu", "Platypus", "atmosphere", "soft", "bulb", "faint", "Playground", "shopping", "ethnic", "advertise", "clinic", "Plow", "thought", "worm", "scandal", "air", "Plumber", "obligation", "pastel", "reception", "throw", "Pocket", "property", "twist", "tract", "inspire", "Poem", "theory", "run", "advertising", "commitment", "Point", "situation", "tight", "conceive", "enthusiasm", "Pole", "pollution", "guideline", "time", "guerrilla", "Pomp", "driver", "address", "break", "hide", "Pong", "manufacturer", "operational", "competition", "pity", "Pool", "extent", "rung", "ranch", "mainstream", "concept", "medieval", "soar", "village", "sword", "mother", "jam", "plaster", "exit", "foot", "troop", "wife", "sheep", "interactive", "cattle", "winter", "predator", "regulation", "ballet", "candle"
            ],

        "bonnie-new" :
            [
                "question", "slytherin", "elephant", "leak", "mail", "tough", "raffle", "tap", "lock", "zodiac", "khaleesi", "spout", "rodeo", "tobacco", "mouth", "border", "Seinfeld", "reptile", "hook", "positive", "booklet", "humidity", "wine", "Ireland", "rubber", "satellite", "scholarship", "scars", "wedding", "essential", "feather", "flare", "cowboy", "talent", "butterfly", "mosquito", "fence", "tuxedo", "dare", "recognize", "strap", "check", "mice", "harambe", "hooters", "square", "bagel", "mosque", "noodle", "clickbait", "recliner", "nickel", "toad", "scissors", "Cajun", "lullaby", "hibernate", "locomotive", "jade", "steam", "patron", "trousers", "avalanche", "yodel", "coyote", "teacher", "valet", "chopsticks", "checkmate", "finesse", "aztec", "patch", "company", "loan", "spinach", "pattern", "hyena", "leotard", "chocolate", "Florida", "BTS", "coke", "patrol", "penalty", "chemistry", "peg", "karma", "milkshake", "law", "mist", "layer", "blotter", "schedule", "peel", "breakfast", "hitch", "pilot", "visit", "bingo", "fiance", "wound", "tab", "pea", "machine", "fairy", "yarn", "curtain", "loafer", "pageant", "jar", "sunset", "refurbish", "traffic", "biden", "pence", "cellar", "viper", "sandwich", "cow", "flower", "harp", "ikea", "starfish", "traitor", "wart", "quarrel", "quarantine", "mixer", "thief", "harm", "hangover", "hazel", "prom", "honeymoon", "aesthetic", "cold", "steam", "grit", "costco", "governor", "inside", "burn", "Confucius", "hockey", "pitbull", "list", "Jamaica", "gingerbread", "breadstick", "macbeth", "journal", "luggage", "routine", "aquarium", "curtsy", "favor", "fear", "film", "olive", "integer", "floss", "gather", "crutches", "grab", "static", "ship", "sauce", "war", "fin", "chastity", "anchovy", "litterbug", "pasta", "Kermit", "bandit", "gossip", "toddler", "poker", "rose", "garbage", "gate", "corporation", "wallflower", "gift", "outline", "flexible", "seashell", "starbucks", "game", "walk", "mitochondria", "photograph", "paper", "Martian", "degree", "Aspen", "plantation", "pistachio", "rash", "elevator", "dice", "family", "green", "boots", "turkey", "Chrome", "galley", "recipe", "fleece", "vanilla", "old", "casino", "trade", "erase", "incognito", "hookah", "connect", "biceps", "divide", "sunburn", "soup", "ice", "dancing", "aircraft", "cricket", "prank", "van", "hypnosis", "venom", "jeans", "alphabet", "Hercules", "enemy", "chapel", "Rome", "debt", "jailbait", "fork", "handbag", "intelligence", "gallop", "sushi", "gas", "spaghetti", "kismet", "dishwasher", "forget", "hickory", "virtual", "lighthouse", "branch", "desk", "racquet", "board", "seltzer", "beard", "mask", "kobe", "apartment", "shoes", "music", "quily", "painter", "sand", "thong", "reindeer", "punch", "spine", "sangria", "warehouse", "geography", "cassette", "lawn", "nickname", "weight", "Twister", "Connecticut", "manuscript", "promise", "lava", "soda", "photoshop", "kidney", "pillow", "kernel", "pail", "lake", "khakis", "sandpaper", "knob", "strip", "trout", "linen", "close", "princess", "blackout", "purchase", "treat", "nervous", "awe", "month", "position", "lightnight", "christmas", "politician", "cologne", "motorboat", "chainsaw", "neighborhood", "birthday", "hum", "Houdini", "seesaw", "nostalgia", "fossil", "hospital", "ivory", "rosary", "spoon", "umbrella", "candle", "open", "hamstring", "clothesline", "ocean", "urn", "dessert", "slick", "ruler", "metal", "simp", "hoot", "neon", "explosion", "reflex", "puppy", "fiji", "expert", "Einstein", "poison", "lettuce", "stadium", "skiing", "map", "amnesia", "demon", "field", "rice", "antenna", "spark", "limp", "royalty", "ammonia", "punk", "veal", "raw", "receipt", "grass", "belly", "whirl", "venmo", "hardware", "mussel", "button", "chateau", "poncho", "meteor", "collar", "oprah", "laundry", "candy", "cello", "deodorant", "blackberry", "guacamole", "diamond", "crawl", "ale", "time", "Taki", "pumpkin", "stutter", "Dumbo", "itch", "tongue", "presentation", "occult", "daydreaming", "slippers", "rail", "poster", "punchline", "roll", "jail", "plump", "ticket", "wood", "rope", "eternity", "oats", "jerk", "charcuterie", "quiche", "century", "court", "Athens", "eyelash", "lunch", "prize", "food", "weekend", "coworker", "freedom", "glaze", "barrier", "cancer", "hipster", "power", "searchlight", "quit", "rattle", "garter", "marijuana", "parrot", "saxophone", "society", "hamster", "shuttle", "pans", "parlor", "dungeon", "beetle", "elf", "latin", "raspberries", "subway", "eyelid", "insect", "thight", "puddle", "dictator", "gauze", "jockey", "opinion", "inflation", "uber", "embroidery", "lavender", "option", "teenager", "landlord", "nutcracker", "pudding", "emergency", "radiator", "ambulance", "intersection", "sprint", "retirement", "vineyard", "circus", "continent", "liquor", "slave", "equity", "pickpocket", "limbo", "holiday", "architect", "shawl", "wand", "sword", "theory", "victory", "nurse", "song", "gouda", "duel", "lotion", "arson", "pastry", "mascot", "reed", "Casablanca", "vein", "mush", "oven", "nozzle", "martyr", "bozo", "stuffing", "pigeon", "auction", "weed", "tush", "community", "skeleton", "engine", "future", "croak", "island", "antique", "cigar", "bull", "gem", "wagina", "clown", "lollygag", "eggplant", "lumberjack", "bazaar", "sneeze", "piano", "mimosa", "mob", "leaf", "moss", "capuccino", "coffee", "lizard", "charcoal", "eyewitness", "Apollo", "intern", "canoe", "bracelet", "Indiana Jones", "odor", "parakeet", "reason", "siren", "politics", "athlete", "circle", "boujee", "sunflower", "canoodle", "president", "coma", "doppelganger", "shell", "tape", "staple", "beer", "hippocampus", "brick", "castle", "maid", "E.T.", "staff", "veterinarian", "summer", "latte", "llama", "noob", "microscopic", "knot", "sweat", "truffle", "mold", "blur", "pulse", "bald", "memory", "propose", "squeal", "currency", "entrance", "requirement", "super", "homework", "dip", "definition", "mallet", "call", "moat", "altar", "nose", "harpoon", "wheelbarrow", "pirate", "envy", "tiger", "superhero", "violin", "banana", "camper", "university", "fudge", "tyranny", "phtographer", "gymnastics", "laugh", "chug jug", "monkey", "forest", "mall", "lingerie", "muffler", "otter", "razor", "bubble", "route", "ingredients", "x-rays", "exhaustian", "merlot", "yacht", "voldemort", "keg", "farmhouse", "accelerator", "kindergarten", "panel", "foam", "Tennessee", "kite", "pants", "ramp", "cauliflower", "napkin", "shave", "sundial", "blank", "incense", "oasis", "grocery", "jackpot", "dandruff", "mario", "escape", "label", "fair", "pikachu", "zero", "racehorse", "macaroni", "galaxy", "yard", "saddle", "turtle", "piranha", "buffalo", "luigi", "belt", "mafia", "chest", "telephone", "watermelon", "ammunition", "cab", "statue", "bellhop", "spicy", "jacks", "river", "waterfall", "sharp", "diaper", "vaccine", "faucet", "angel", "clout", "brunch", "newborn", "loathe", "control", "lagoon", "echo", "bells", "socks", "flag", "comedian", "silent", "zit", "wreck", "white", "soldier", "spell", "rainbow", "horn", "epidemic", "gondola", "bermuda", "flamingo", "water", "blender", "escalator", "oyester", "addiction", "digest", "fire", "buckle", "death", "flour", "Neptune", "arcade", "compass", "dye", "supper", "sharpie", "hurdle", "firecracker", "audience", "godchild", "winter", "bat", "wreath", "outlet", "headlights", "siracha", "talk", "scab", "egypt", "wife", "project", "tantrum", "fog", "runway", "cliff", "bar", "horse", "elbow", "knife", "cauldron", "hoof", "cheese", "pitchfork", "paradise", "democracy", "mannequin", "milk", "pearl", "rum", "trash", "network", "tea", "olympics", "alumnus", "bazaar", "unicycle", "whale", "vase", "groupie", "Paris", "wallet", "toothpick", "organ", "match", "fable", "shrimp", "rocket", "creeper", "geology", "binoculars", "crazy", "voyage", "minecraft", "dune", "omelette", "Sherlock Holmes", "commercial", "glove", "path", "fruit", "riddle", "wit", "veto", "witch", "swingset", "wild", "monopoly", "taco", "purse", "mistake", "asparagus", "glue", "monsoon", "diploma", "ferry", "dinner", "Fender", "handwriting", "web", "surgeon", "intermission", "Picasso", "essay", "orange", "lime", "lawyer", "kingdom", "mineral", "perm", "cheetah", "model", "quirky", "cosmetics", "engagement", "speedometer", "potpurri", "mayhem", "glasses", "will", "dangerous", "parabola", "loophole", "solution", "wander", "sticky", "website", "silence", "barber", "bugle", "concert", "taxi", "spill", "huddle", "thirst", "perfect", "icon", "rod", "tender", "camel", "cork", "salsa", "dig", "trial", "tourist", "smoothie", "magazine", "aunt", "pool", "employee", "giraffe", "freckle", "world", "jungle", "leader", "hammock", "cap", "zucchini", "ranch", "tack", "carrot", "oral ", "Texas", "quote", "dragon", "alley", "solitaire", "skyscraper", "byte", "stranger", "read", "tow", "blood", "glass", "bark", "peace", "vampire", "fish", "laboratory", "easel", "history", "waiter", "bridge", "name", "gallery", "zipper", "secret", "sale", "matador", "steak", "librarian", "knickers", "grudge", "snail", "mole", "crib", "domino", "suspicious", "giant", "guitar", "hut", "Cinderella", "abdomen", "Ghandi", "pregnant", "hose", "Detroit", "romeo", "chime", "queue", "blimp", "Gemini", "Newton", "dog", "embassy", "mine", "barn", "poem", "bass", "baby", "pin", "ornament", "sew", "dictionary", "steeple", "seaweed", "mercury", "appendix", "murder", "coal", "hurricane", "loaf", "Congress", "credit", "drink", "miracle", "cowbell", "meatball", "overlap", "kinky", "sow", "gyro", "woods", "card", "champagne", "brass", "honesty", "airport", "insult", "parka", "nature", "tent", "jewel", "parish", "saucer", "stocks", "shine", "gumdrop", "base", "ham", "prey", "Germany", "copier", "cabbage", "chalice", "thermometer", "coupon", "goldfish", "discount", "simple", "paintbrush", "deed", "Barcelona", "gold", "explorer", "homesick", "aisle", "surfing", "hostess", "furnace", "tinder", "aqua", "coral", "gumball", "kit", "windbreaker", "cupid", "possessive", "salesman", "halloween", "tag", "kilts", "twins", "soul", "heir", "sticker", "sheep", "Ohio", "basement", "crop", "disguise", "pickle", "customer", "tank", "shovel", "egg", "lane", "sterilize", "belongings", "cavity", "kid", "lunar", "underwear", "senator", "dimension", "strap", "sequel", "judo", "frown", "sombrero", "grill", "porcupine", "onion", "pansy", "gasoline", "emblem", "cereal", "instant", "nuts", "whiskey", "hog", "torch", "spy", "cinema", "whisper", "garland", "pond", "vegas", "bathtub", "xbox", "parade", "apple", "pressure", "romance", "playstation", "keyhole", "mouse", "yolk", "friends", "dairy", "waist", "snow", "Appalachians", "kangaroo", "earth", "clay", "heart", "raisin", "arch", "prescription", "oyster", "orchestra", "proverb", "spa", "octopus", "scotch", "electrician", "handkerchief", "clover", "marvel", "ruby", "dotor", "bear", "daisy", "football", "barney", "tear", "beans", "lie", "negligee", "elmo", "you", "hamburger", "leprachaun", "courtyard", "smurf", "pavement", "crash", "frosty", "location", "steer", "Disneyland", "dream", "spool", "citizen", "blizzard", "outdoors", "towel", "Russia", "pooch", "soot", "touchdown", "dial", "Japan", "twitter", "pajamas", "Hollywood", "infinity", "cancel", "suspenders", "discovery", "free", "budget", "data", "flash", "fasten", "disney", "know", "checkers", "gymnast", "garden", "sneak", "gravy", "chase", "rules", "real", "churn", "cafe", "hymn", "dentures", "maggi", "satire", "debate", "whack", "zoom", "beehive", "limousine", "vehicle", "facebook", "peninsula", "ramen", "rack", "cruise", "cigarette", "assembly", "canine", "passport", "scalpel", "orchard", "marriage", "tweezers", "caveman", "carnival", "overall", "coronavirus", "basketball", "pollution", "trip", "footstool", "teapot", "hexagon", "grandchild", "roast", "frosting", "news", "vest", "government", "sheriff", "cream", "parachute", "wizard", "tomato", "Venice", "sunshine", "diary", "Miami", "granit", "frog", "attic", "hiccup", "guru", "language", "Greek", "men", "oval", "perfume", "Tokyo", "mammal", "luxury", "portrait", "fur", "leprechaun", "movie", "nephew", "vertigo", "pride", "netflix", "flirt", "sponge", "message", "vulture", "fine", "storm", "migraine", "mirage", "safari", "notebook", "temple", "evening", "drill", "diagonal", "cookies", "paste", "blanket", "pawn", "cable", "decoration", "beyonce", "sphere", "gillete", "lobster", "virus", "shakespear", "boredom", "link", "chlorine", "vertical", "beckham", "Lent", "pixie", "toxic", "license", "advice", "alcatraz", "break", "softball", "homicide", "trophy", "pepsi", "sweatpants", "leather", "stampede", "alligator", "zoology", "twig", "raft", "candidate", "pain", "donation", "bachelor", "chandelier", "dryer", "ignore", "broadway", "cafeteria", "nanny", "cleats", "nail", "fantasy", "dashboard", "ghost", "tablespoon", "knuckle", "igloo", "ufo", "tattletale", "speakers", "Tiktok", "dolphin", "doughnut", "roommate", "Haiti", "patio", "luck", "philosophy", "flute", "foot", "package", "jam", "kiwi", "uncle", "blemish", "spring", "autumn", "freeway", "ketchup", "lamb", "bullfighter", "sailboat", "barbell", "medal", "crayon", "brother", "goat", "Austria", "motorcycle", "suit", "keyboard", "Valentine", "sandals", "ladle", "Tarzan", "canary", "wallpaper", "radio", "Cuba", "salad", "gucci", "ring", "shade", "pupil", "Yale", "puppet", "basic", "woke", "increase", "twerk", "trunk", "rain", "referee", "net", "jersey", "gadget", "Chicago", "bottle", "table", "penguin", "eggnog", "boomer", "panda", "mud", "pollen", "zebra", "tinsel", "tuna", "award", "weird", "ballet", "frame", "toilet", "thunder", "cancel", "speed", "pier", "submarine", "cybersecurity", "beet", "hairdresser", "knit", "bleach", "rage", "Indian", "salary", "casserole", "Oregon", "railroad", "rap", "waves", "midnight", "lotion", "major", "cougar", "pop", "nightmare", "general", "pizza", "boomerang", "hit", "dehumidifier", "China", "biology", "lantern", "Democrat", "France", "boar", "Darwin", "basket", "beau", "chalkboard", "chalk", "evergreen", "moon", "driveway", "sofa", "flex", "screwdriver", "pepperoni", "sea", "beauty", "melamine", "cry", "barf", "croissant", "tickle", "handshake", "idiot"
            ]
    };

io.on('connect', socket => {

    /*
    Immediately upon connection, tell the client its user ID 
    for improving client side operations */

    io.to(socket.id).emit('client-id-notification', socket.id);

    /* Upon joining a room, send a new room-data emit to all room
    members */
    socket.on('join-room', (key, name) => {
        if (name.length > 32) {
            name = name.substring(0, 32);
        }
        
        if (rooms[key] != null) {
            if (rooms[key]["gameStarted"]) {
                socket.emit('join-room-fail');
            }
            else if (rooms[key]["playerCount"] == 16) {
                socket.emit('join-room-fail');
            }
            else {
                rooms[key]["playerCount"] += 1;
                var socketId = socket.id;
                addToFirstAvailableTeam(key, name, socketId);
                socket.join(key, function() {
                    IdToRoom[socketId] = key;
                    var scores = {1: rooms[key]["team1Score"], 2: rooms[key]["team2Score"]};
                    socket.emit('join-room-success', key, name, rooms[key], scores);
                    io.in(key).emit('room-data', rooms[key]);
                    //io.in(key).emit('score-update-main', {1: rooms[key]["team1Score"], 2: rooms[key]["team2Score"]});
                });
            }
        }
        else {
            socket.emit('join-room-fail');
        }
    });

    socket.on('create-room', name => {
        if (name.length > 32) {
            name = name.substring(0, 32);
        }
        var key = createNewRoomKey();
        createNewRoom(key, name, socket);
        var socketId = socket.id;
        socket.join(key, function() {
            IdToRoom[socketId] = key;
            socket.emit('create-room-success', key);
            io.in(key).emit('room-data', rooms[key]);
        });
    });
    
    socket.on('join-team', (key, name, teamNumber) => {
        if (name.length > 32) {
            name = name.substring(0, 32);
        }
        removePlayerFromAnyTeam(key, socket.id);
        if (!addToDesiredTeam(key, name, socket.id, teamNumber)) {
            //This shouldn't happen unless someone is calling their own code
            console.log("this shouldnt happen (desired not available)");
            addToFirstAvailableTeam(key, name, socket.id);
        }
        io.in(key).emit('room-data', rooms[key]);
    }); 

    socket.on('leave-room', key => {
        var socketId = socket.id;
        IdToRoom[socketId] = null;
        socket.leave(key);
        if (rooms[key] != null) {
            rooms[key]["playerCount"] -= 1;
            removePlayerFromAnyTeam(key, socket.id);
            socket.disconnect;
            if (rooms[key]["playerCount"] == 0) {
                garbageCollectRoom(key);
            }
            else {
                io.in(key).emit('room-data', rooms[key]);
            }
        }
        else {
            console.log('rooms key was null');
        }
    });

    socket.on('change-settings', (key, data) => {
        if (data["preBidTime"] > 30) {
            rooms[key]["preBidTime"] = 30000;
        }
        else if (data["preBidTime"] < 1) {
            rooms[key]["preBidTime"] = 1000;
        }
        else {
            rooms[key]["preBidTime"] = data["preBidTime"] * 1000;
        }

        if (data["bidTime"] > 30) {
            rooms[key]["bidTime"] = 30000;
        }
        else if (data["bidTime"] < 5) {
            rooms[key]["bidTime"] = 5000;
        }
        else {
            rooms[key]["bidTime"] = data["bidTime"] * 1000;
        }

        if (data["guessTime"] > 300) {
            rooms[key]["guessTime"] = 300000;
        }
        else if (data["guessTime"] < 15) {
            rooms[key]["guessTime"] = 15000;
        }
        else {
            rooms[key]["guessTime"] = data["guessTime"] * 1000;
        }
    
        io.in(key).emit('change-settings-server', rooms[key]);
        io.in(key).emit('change-settings-main', rooms[key]);
    });

    socket.on('start-game', key => {
        var ready = false;
        if (rooms[key]["team1"].length >= 2 && rooms[key]["team2"].length >= 2) {
            ready = true;
        }

        ready = true; //delete

        if (ready) {
            startGame(key);
        }
        else {
            //shouldn't happen, but...
            //console.log("start game sent to server but not ready");
        }
    });

    socket.on('player-bid', (key, bid) => {
        //validate bid
        const playerHasCurrentBid = (rooms[key]["game"]["currentBidOwner"] == socket.id) ? true : false;
        if (bid < rooms[key]["game"]["currentBid"] && bid > 0 && !playerHasCurrentBid  && isPlayerClueGiver(key, socket.id) && rooms[key]["game"]["mode"] == "bid") {
            rooms[key]["game"]["currentBid"] = bid;
            rooms[key]["game"]["currentBidOwner"] = socket.id;
            rooms[key]["game"]["bidExists"] = false;
            rooms[key]["game"]["update"]["playerName"] = getPlayerNameFromId(key, socket.id);

            // X D
            if (bid < 6) {
                rooms[key]["game"]["update"]["action"] = "very recklessly bids";
            }
            else if (bid < 7) {
                rooms[key]["game"]["update"]["action"] = "quite recklessly bids";
            }
            else {
                rooms[key]["game"]["update"]["action"] = "bids";
            }
            rooms[key]["game"]["update"]["value"] = bid;
            rooms[key]["game"]["update"]["className"] = "game-update-bid";
            
            io.in(key.concat("clue-givers")).emit('game-update', rooms[key]["game"]);
            rooms[key]["game"]["mode"] = "bid-sidelines";
            io.in(key.concat("clue-receivers")).emit('game-update', rooms[key]["game"]);
            rooms[key]["game"]["mode"] = "bid";

            //If the game timer runs out, move past bidding phase
            if (gameTimer != null) {
                clearTimeout(gameTimer);
            }
            io.in(key).emit('reset-clock', rooms[key]["bidTime"] / 1000);
            gameTimer = setTimeout(function() {
                startPreGuessPhase(key);
            }, rooms[key]["bidTime"]);
        }
        
    });

    socket.on('give-clue', (key, clue) => {
        if (rooms[key]["game"]["mode"] != "post-game") {
            //validate this person as a cluegiver
            if (isPlayerActiveClueGiver(key, socket.id)) {
                processAndAddClues(key, clue);
                rooms[key]["game"]["update"]["playerName"] = getPlayerNameFromId(key, socket.id);
                rooms[key]["game"]["update"]["action"] = "gives clue: ";
                rooms[key]["game"]["update"]["value"] = `'${clue}' (${rooms[key]["game"]["cluesGiven"].length}/${rooms[key]["game"]["currentBid"]})`;
                rooms[key]["game"]["update"]["className"] = "game-update-clue";
                sendUpdateDuringGuessPhase(key);
                if (rooms[key]["game"]["cluesGiven"].length > rooms[key]["game"]["currentBid"]) {
                    if (gameTimer != null) {
                        clearTimeout(gameTimer);
                    }
                    startPostGamePhase(key);
                }
            }
        }
        
    });

    socket.on('give-guess', (key, guess) => {
        if (rooms[key]["game"]["mode"] != "post-game") {
            if (isPlayerActiveGuesser(key, socket.id)) {
                rooms[key]["game"]["update"]["playerName"] = getPlayerNameFromId(key, socket.id);
                guess = guess.toLowerCase();
                var correct = false;
                for (var i = 0; i < words[key].length; i++) {
                    if (guess.includes(words[key][i])) { //correct guess
                        if (rooms[key]["game"]["guessedWords"].includes(words[key][i])) { //repeated guess
                            rooms[key]["game"]["update"]["action"] = "submits an already guessed word: ";
                            rooms[key]["game"]["update"]["className"] = "game-update-guess-correct-repeated";
                            rooms[key]["game"]["update"]["value"] = words[key][i];
                        }
                        else {
                            rooms[key]["game"]["update"]["action"] = "CORRECTLY guesses";
                            rooms[key]["game"]["update"]["className"] = "game-update-guess-correct";
                            rooms[key]["game"]["update"]["value"] = words[key][i];
                            rooms[key]["game"]["guessedWords"].push(words[key][i]); // guess - > words[key][i]
                            
                        }
                        io.in(key).emit('word-guessed', words[key][i], i);
                        correct = true;
                    }
                }
                if (!correct) {
                    rooms[key]["game"]["update"]["action"] = "incorrectly guesses";
                    rooms[key]["game"]["update"]["className"] = "game-update-guess-incorrect";
                    rooms[key]["game"]["update"]["value"] = guess;
                }
                
                sendUpdateDuringGuessPhase(key);
                if (rooms[key]["game"]["guessedWords"].length == 5) {
                    console.log("All words have been guessed");
                    //if all words have been guessed, end the round early
                    if (gameTimer != null) {
                        clearTimeout(gameTimer);
                    }
                    startPostGamePhase(key);
                }
            }
        }
    });

    socket.on('ready-up', key => {
        var arr = rooms[key]["readyPlayers"];
        if (arr.includes(socket.id)) {
            var index = arr.indexOf(socket.id);
            arr.splice(index, 1);
        }
        else {
            arr.push(socket.id);
        }

        if (arr.length == rooms[key]["playerCount"]) {
            restartGame(key);
        }
    });

    socket.on('clock-test-event', key => {
        io.in(key).emit('reset-clock', 10);
    });

    socket.on('disconnect', function() {
        //Find out which room they were in
        var socketId = socket.id;
        var key = IdToRoom[socketId];
        if (key != null) {
            rooms[key]["playerCount"] -= 1;
            removePlayerFromAnyTeam(key, socket.id);
            if (rooms[key]["playerCount"] == 0) {
                garbageCollectRoom(key);
            }
            else {
                io.in(key).emit('room-data', rooms[key]);
            }
        }
    });
});

function startGame(key) {
    rooms[key]["gameStarted"] = true;
    io.in(key).emit('start-game-server', rooms[key]);
    words[key] = selectGameWords();
    startPreBidPhase(key);
}

function startPreBidPhase(key) {
    rooms[key]["game"]["mode"] = "pre-bid";
    rooms[key]["game"]["update"]["playerName"] = "[Game]";
    rooms[key]["game"]["update"]["action"] = "has initiated a pre-bid phase of";
    rooms[key]["game"]["update"]["value"] = (rooms[key]["preBidTime"] / 1000).toString().concat(" seconds");
    rooms[key]["game"]["update"]["className"] = "game-update-phase-change";
    io.in(key).emit('game-update', rooms[key]["game"]);
    io.in(key).emit('room-data', rooms[key]);
    //Add clue givers and clue receivers to separate rooms
    var clients = io.sockets.adapter.rooms[key];
    Object.keys(clients["sockets"]).forEach(person => {
        var tempSocket = io.sockets.connected[person];
        if(isPlayerClueGiver(key, person)) {
            
            tempSocket.join(key.concat("clue-givers"), function() {
                io.in(key.concat("clue-givers")).emit('words', words[key]);
            });
        }
        else {
            tempSocket.join(key.concat("clue-receivers"), function() {

            });
        }
    });

    
    if (gameTimer != null) {
        clearTimeout(gameTimer);
    }
    io.in(key).emit('reset-clock', rooms[key]["preBidTime"] / 1000);
    gameTimer = setTimeout(function() {
        startBidPhase(key);
    }, rooms[key]["preBidTime"]);
}

function startBidPhase(key) {
    rooms[key]["game"]["mode"] = "bid";
    rooms[key]["game"]["bidExists"] = false;
    rooms[key]["game"]["update"]["playerName"] = "[Game]";
    rooms[key]["game"]["update"]["action"] = "has initiated the bidding phase at a bid of:";
    rooms[key]["game"]["update"]["value"] = rooms[key]["game"]["currentBid"];
    rooms[key]["game"]["update"]["className"] = "game-update-phase-change";
    io.in(key.concat("clue-givers")).emit('game-update', rooms[key]["game"]);
    rooms[key]["game"]["mode"] = "bid-sidelines";
    io.in(key.concat("clue-receivers")).emit('game-update', rooms[key]["game"]);
    rooms[key]["game"]["mode"] = "bid";
    if (gameTimer != null) {
        clearTimeout(gameTimer);
    }
    io.in(key).emit('reset-clock', rooms[key]["bidTime"] / 1000);
    gameTimer = setTimeout(function() {
        if (rooms[key]["game"]["bidExists"]) {
            startPreGuessPhase(key);
        }
        else {
            //no bid exists, so cycle the words and restart the pre-bid phase
            words[key] = selectGameWords();
            rooms[key]["game"]["update"]["playerName"] = "Neither clue giver";
            rooms[key]["game"]["update"]["action"] = "made a bid in time. Sending new words...";
            rooms[key]["game"]["update"]["value"] = "";
            rooms[key]["game"]["update"]["className"] = "game-update-phase-change";
            io.in(key).emit('game-update', rooms[key]["game"]);
            startPreBidPhase(key);
        }
        
    }, rooms[key]["bidTime"]);
}

function startPreGuessPhase(key) {
    rooms[key]["game"]["update"]["playerName"] = "[Game]";
    rooms[key]["game"]["update"]["action"] = "has closed bidding. Player ".concat(getPlayerNameFromId(key, rooms[key]["game"]["currentBidOwner"])).concat(" wins the bidding at ".concat(rooms[key]["game"]["currentBid"])).concat(" words");
    rooms[key]["game"]["update"]["value"] = "";
    rooms[key]["game"]["update"]["className"] = "game-update-phase-change";
    io.in(key).emit('game-update', rooms[key]["game"]);

    rooms[key]["game"]["update"]["playerName"] = "[Game]";
    rooms[key]["game"]["update"]["action"] = "will initiate guessing phase in";
    rooms[key]["game"]["update"]["value"] = (PRE_GUESS_TIME / 1000).toString().concat(" seconds");
    rooms[key]["game"]["update"]["className"] = "game-update-phase-change";

    //Once bidding is done we can split the players into 4 groups:
    //Playing team cluegiver key|clue-givers-playing
    //Playing team clueguessers key|clue-receivers-playing
    //Non playing team clue giver key|clue-givers-resting
    //Non playing team extras key|clue-receivers-resting

    var clueGivers = io.sockets.adapter.rooms[key.concat("clue-givers")];
    var clueReceivers = io.sockets.adapter.rooms[key.concat("clue-receivers")];
    var playingTeam = returnTeamNumber(key, rooms[key]["game"]["currentBidOwner"]);

    //Crashes here often when refreshing the page
    Object.keys(clueGivers["sockets"]).forEach(person => {
        var tempSocket = io.sockets.connected[person];
        if(returnTeamNumber(key, tempSocket.id) == playingTeam) {
            //This is the clue giver on the playing team
            tempSocket.join(key.concat("clue-givers-playing"), function() {
                rooms[key]["game"]["activeClueGiver"] = tempSocket.id;
                rooms[key]["game"]["mode"] = "pre-guess-giver";
                io.in(key.concat("clue-givers-playing")).emit('game-update', rooms[key]["game"]);
            });
        }
        else {
            //This is the clue giver on the NOT playing team
            tempSocket.join(key.concat("clue-givers-resting"), function() {
                rooms[key]["game"]["mode"] = "pre-guess-sidelines";
                io.in(key.concat("clue-givers-resting")).emit('game-update', rooms[key]["game"]);
            });
        }
    });
    if (clueReceivers != null) {
        Object.keys(clueReceivers["sockets"]).forEach(person => {
            var tempSocket = io.sockets.connected[person];
            if(returnTeamNumber(key, tempSocket.id) == playingTeam) {
                
                
                tempSocket.join(key.concat("clue-receivers-playing"), function() {
                    rooms[key]["game"]["mode"] = "pre-guess-guesser";
                    io.in(key.concat("clue-receivers-playing")).emit('game-update', rooms[key]["game"]);
                });
            }
            else {
                
                tempSocket.join(key.concat("clue-receivers-resting"), function() {
                    rooms[key]["game"]["mode"] = "pre-guess-sidelines";
                    io.in(key.concat("clue-receivers-resting")).emit('game-update', rooms[key]["game"]);
                });
            }
        });
    }
    else {
        console.log("need more people, test message");
    }
    //Once a team has been decided, we can show the words to the resting team
    io.in(key.concat("clue-receivers-resting")).emit('words', words[key]);
    

    if (gameTimer != null) {
        clearTimeout(gameTimer);
    }
    io.in(key).emit('reset-clock', PRE_GUESS_TIME / 1000);
    gameTimer = setTimeout(function() {
        startGuessPhase(key);
    }, PRE_GUESS_TIME);
}

function startGuessPhase(key) {
    rooms[key]["game"]["update"]["playerName"] = "[Game]";
    rooms[key]["game"]["update"]["action"] = "has initiated the guessing phase for";
    rooms[key]["game"]["update"]["value"] = (rooms[key]["guessTime"] / 1000).toString().concat(" seconds");
    rooms[key]["game"]["update"]["className"] = "game-update-phase-change";
    sendUpdateDuringGuessPhase(key);

    if (gameTimer != null) {
        clearTimeout(gameTimer);
    }
    io.in(key).emit('reset-clock', rooms[key]["guessTime"] / 1000);
    gameTimer = setTimeout(function() {
        startPostGamePhase(key);
    }, rooms[key]["guessTime"]);
}

function startPostGamePhase(key) {
    io.in(key).emit('stop-clock');
    rooms[key]["game"]["mode"] = "post-game";
    rooms[key]["game"]["update"]["playerName"] = "[Game]";
    rooms[key]["game"]["update"]["action"] = "has ended.";
    rooms[key]["game"]["update"]["value"] = "";
    rooms[key]["game"]["update"]["className"] = "game-update-phase-change";
    io.in(key).emit('game-update', rooms[key]["game"]);
    io.in(key).emit('words', words[key]);
    rooms[key]["game"]["update"]["playerName"] = getPlayerNameFromId(key, rooms[key]["game"]["activeClueGiver"]);
    rooms[key]["game"]["update"]["action"] = "gave";
    rooms[key]["game"]["update"]["value"] = `${rooms[key]["game"]["cluesGiven"].length} out of ${rooms[key]["game"]["currentBid"]} clues allowed!`;
    rooms[key]["game"]["update"]["className"] = "game-update-phase-change";
    io.in(key).emit('game-update', rooms[key]["game"]);
    var winningTeam = determineWinnerAndUpdateScore(key);
    rooms[key]["game"]["update"]["playerName"] = "Team " + winningTeam
    rooms[key]["game"]["update"]["action"] = "wins a point";
    rooms[key]["game"]["update"]["value"] = "via automated scoring";
    rooms[key]["game"]["update"]["className"] = "game-update-phase-change";
    io.in(key).emit('game-update', rooms[key]["game"]);
    io.in(key).emit('score-update', {1: rooms[key]["team1Score"], 2: rooms[key]["team2Score"]});
    io.in(key).emit('score-update-main', {1: rooms[key]["team1Score"], 2: rooms[key]["team2Score"]});
}

function selectGameWords() {
    var words = [];
    var pack = "bonnie-new";

    const word1index = Math.floor((Math.random() * wordBank[pack].length));
    const word1 = wordBank[pack][word1index];
    const word2index = Math.floor((Math.random() * wordBank[pack].length));
    const word2 = wordBank[pack][word2index];
    while (word2 == word1) {
        const word2index = Math.floor((Math.random() * wordBank[pack].length));
        const word2 = wordBank[pack][word2index];
    }
    const word3index = Math.floor((Math.random() * wordBank[pack].length));
    const word3 = wordBank[pack][word3index];
    while (word3 == word2) {
        const word3index = Math.floor((Math.random() * wordBank[pack].length));
        const word3 = wordBank[pack][word3index];
    }
    const word4index = Math.floor((Math.random() * wordBank[pack].length));
    const word4 = wordBank[pack][word4index];
    while (word4 == word3) {
        const word4index = Math.floor((Math.random() * wordBank[pack].length));
        const word4 = wordBank[pack][word4index];
    }
    const word5index = Math.floor((Math.random() * wordBank[pack].length));
    const word5 = wordBank[pack][word5index];
    while (word5 == word4) {
        const word5index = Math.floor((Math.random() * wordBank[pack].length));
        const word5 = wordBank[pack][word5index];
    }
    words.push(word1);
    words.push(word2);
    words.push(word3);
    words.push(word4);
    words.push(word5);

    words[0] = words[0].toLowerCase();
    words[1] = words[1].toLowerCase();
    words[2] = words[2].toLowerCase();
    words[3] = words[3].toLowerCase();
    words[4] = words[4].toLowerCase();
    return words;
}

function garbageCollectRoom(key) {
    //rooms[key] = null;
}

function sendUpdateDuringGuessPhase(key) {
    //send the right modes to the right players

    rooms[key]["game"]["mode"] = "guess-sidelines";
    io.in(key.concat("clue-receivers-resting")).emit('game-update', rooms[key]["game"]);
    io.in(key.concat("clue-givers-resting")).emit('game-update', rooms[key]["game"]);

    rooms[key]["game"]["mode"] = "guess-giver";
    io.in(key.concat("clue-givers-playing")).emit('game-update', rooms[key]["game"]);

    rooms[key]["game"]["mode"] = "guess-receiver";
    io.in(key.concat("clue-receivers-playing")).emit('game-update', rooms[key]["game"]);
}

function addToFirstAvailableTeam(key, name, playerId) {
    if (rooms[key]["team1"].length < 8) {
        var newMember = {};
        newMember[playerId] = name;
        rooms[key]["team1"].push(newMember);
    }
    else {
        var newMember = {};
        newMember[playerId] = name;
        rooms[key]["team2"].push(newMember);
    }
}

function addToDesiredTeam(key, name, playerId, number) {
    if (rooms[key]["team".concat(number)].length < 8) {
        var newMember = {};
        newMember[playerId] = name;
        rooms[key]["team".concat(number)].push(newMember);
        return true;
    }
    return false;
}

function isPlayerClueGiver(key, playerId) {
    var team1 = rooms[key]["team1"];
    var team2 = rooms[key]["team2"];
    var team1ClueGiver = team1[rooms[key]["team1ClueGiverIndex"]];
    var team2ClueGiver = team2[rooms[key]["team2ClueGiverIndex"]];
    
    if (Object.keys(team1ClueGiver)[0] == playerId) {
        return true;
    }

    //not in team 1...
    if (team2ClueGiver == null || Object.keys(team2ClueGiver)[0] == playerId) {
        return true;
    } 
    return false;
}

function isPlayerActiveClueGiver(key, playerId) {
    return (playerId == rooms[key]["game"]["activeClueGiver"]);
    /*
    var result = false;
    var clients = io.sockets.adapter.rooms[key.concat("clue-givers-playing")];
    console.log(clients);
    
    Object.keys(clients["sockets"]).forEach(person => {
        console.log(person);
        //should only be one, but re-using this code
        if (person == playerId) {
            console.log("player IS active clue giver");
            result = true;
        }
    });
    return result;
    */
}

function isPlayerActiveGuesser(key, playerId) {
    var clients = io.sockets.adapter.rooms[key.concat("clue-receivers-playing")];
    var result = false;
    Object.keys(clients["sockets"]).forEach(person => {
        //should only be one, but re-using this code
        if (person == playerId) {
            result = true;
        }
    });
    return result;
}

function returnTeamNumber(key, playerId) {
    var team1 = rooms[key]["team1"];
    var team2 = rooms[key]["team2"];
    for (var i = 0; i < team1.length; i++) {
        if (Object.keys(team1[i])[0] == playerId) {
            return 1;
        }
    }

    //not in team 1...
    for (var i = 0; i < team2.length; i++) {
        if (Object.keys(team2[i])[0] == playerId) {
            return 2;
        }
    }

}

function getPlayerNameFromId(key, playerId) {
    var team1 = rooms[key]["team1"];
    var team2 = rooms[key]["team2"];
    for (var i = 0; i < team1.length; i++) {
        if (Object.keys(team1[i])[0] == playerId) {
            return Object.values(team1[i])[0];
        }
    }

    //not in team 1...
    for (var i = 0; i < team2.length; i++) {
        if (Object.keys(team2[i])[0] == playerId) {
            return Object.values(team2[i])[0];
        }
    }
}

function removePlayerFromAnyTeam(key, playerId) {
    var team1 = rooms[key]["team1"];
    var team2 = rooms[key]["team2"];
    for (var i = 0; i < team1.length; i++) {
        
        if (Object.keys(team1[i])[0] == playerId) {
            team1.splice(i, 1);
            return;
        }
    }

    //not in team 1...
    for (var i = 0; i < team2.length; i++) {
        if (Object.keys(team2[i])[0] == playerId) {
            team2.splice(i, 1);
            return;
        }
    }
    console.log("failed to remove a player");
}

function processAndAddClues(key, clue) {
    clue = clue.trim();
    var clueArray = clue.split(" ");
    clueArray.forEach(word => {
        if (!rooms[key]["game"]["cluesGiven"].includes(word)) {
            rooms[key]["game"]["cluesGiven"].push(word);
        }
    });
}

//Generate a sequence of 4 random 0-9 numbers that doesn't
// already exist in rooms

function createNewRoomKey() {
    var key = "-1";
    while (key == -1 || key in Object.keys(rooms)) {
        var num1 = Math.floor((Math.random() * 10)).toString();
        var num2 = Math.floor((Math.random() * 10)).toString();
        var num3 = Math.floor((Math.random() * 10)).toString();
        var num4 = Math.floor((Math.random() * 10)).toString();
        key = num1 + num2 + num3 + num4;
    }
    return key;
    
}

function createNewRoom(key, hostName, socket) {
    var hostId = socket.id;
    rooms[key] = {};
    rooms[key]["playerCount"] = 1;
    rooms[key]["team1"] = [];
    var newMember = {};
    newMember[hostId] = hostName;
    rooms[key]["team1"].push(newMember);
    rooms[key]["team2"] = [];
    rooms[key]["team1ClueGiverIndex"] = 0;
    rooms[key]["team2ClueGiverIndex"] = 0;
    rooms[key]["team1Score"] = 0;
    rooms[key]["team2Score"] = 0;
    rooms[key]["preBidTime"] = PRE_BID_TIME;
    rooms[key]["bidTime"] = BID_TIME;
    rooms[key]["guessTime"] = GUESS_TIME;
    rooms[key]["gameStarted"] = false;
    rooms[key]["game"] = {};
    rooms[key]["game"]["currentBid"] = 25;
    rooms[key]["game"]["cluesGiven"] = [];
    rooms[key]["game"]["guessedWords"] = [];
    rooms[key]["game"]["update"] = {};
    rooms[key]["readyPlayers"] = [];
}

function determineWinnerAndUpdateScore(key) {
    var playingTeam = returnTeamNumber(key, rooms[key]["game"]["currentBidOwner"]);
    var restingTeam = playingTeam == 1 ? 2 : 1;
    if (rooms[key]["game"]["guessedWords"].length == 5) {
        rooms[key]["team" + playingTeam + "Score"] += 1;
        return playingTeam;
    }
    else {
        rooms[key]["team" + restingTeam + "Score"] += 1;
        return restingTeam;
    }
}

function restartGame(key) {
    rooms[key]["game"] = {};
    rooms[key]["game"]["currentBid"] = 25;
    rooms[key]["game"]["cluesGiven"] = [];
    rooms[key]["game"]["guessedWords"] = [];
    rooms[key]["game"]["update"] = {};
    rooms[key]["readyPlayers"] = [];
    rooms[key]["gameStarted"] = false;
    //for every player in clue-givers, clue-receivers, clue-givers playing, clue-givers-receiving, that player leaves the room

    rooms[key]["team1"].forEach(player => {
        var tempSocket = io.sockets.connected[Object.keys(player)[0]];
        tempSocket.leaveAll();
        tempSocket.join(key);
    });
    rooms[key]["team2"].forEach(player => {
        var tempSocket = io.sockets.connected[Object.keys(player)[0]];
        tempSocket.leaveAll();
        tempSocket.join(key);
    });
    io.in(key).emit('restart-game');
    io.in(key).emit('room-data', rooms[key]);
}