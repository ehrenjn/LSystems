//NEED TO GET LINES TO ACTUALLY GO OFF EDGE, THEN LIFT PEN AND START AGAIN ON THE OTHER SIDE FROM 0
    //MIGHT WANNA TURN MOVEMENTS INTO AN ACTUAL OBJECT AND MAKE ALL PEN MOVEMENT HAPPEN AS A METHOD OF THAT OBJECT
//NEED TO SMOOTH LINES BY ONLY DRAWING FULL STRAIGHT LINES (no intermediate steps)
    //gets annoying because of wall hits
    //IF I DRAW LINES LIKE THIS THEN DOING A SLOW FADE OUT WILL BE HARD WITH DIFFERENT SIZED LINES...
        //but you could just shrink the line instead of fading it completely I guess? idk
            //eg instead of drawing a full F movement at a time it would be part of an F movement
    //OK TURNS OUT 45 DEGREE LINES JUST LOOK FRICKED BECAUSE IM NOT FULL SCREEN BUT OTHER LINES STILL LOOK FRICKED 
        //its also really good for efficiency
    //AHHH BUT IDK HOW ID DRAW MULTICOLORED LINES LIKE THIS
//MAYBE SHOULD BE USING ACTUAL SIZE INSTEAD OF FULL SCREEN SIZE?
    //dont wanna ruin it on full screen though... maybe check how it looks once you finish the smoothing
//LOOK INTO Path2D FOR KEEPING TRACK OF PATHS (https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes)

//GOD DAMN IT, WHEN IM MAKING SURE STRINGS CONTAIN AN F I LET IT REPLACE ANY CHAR WITH F INCLUDING [ AND ]
    //CANT JUST TELL IT TO NOT REPLACE THOSE BECAUSE ITS POSSIBLE TO GET RULES THAT ONLY HAVE [ AND ]
    //might wanna refactor all the generation but dunno where to start
    //SIMPLEST SOLUTION: WHEN ADDING F TO SOMEWHERE JUST TAKE OFF THE FIRST CHAR OF THE STRING, IF IT WAS "[" THEN ALSO TAKE OUT THE FIRST "]", THEN SPRINKLE IN EITHER 1 OR 2 F'S RANDOMLY DEPENDING ON HOW MANY CHARS YOU GOT RID OF
        //OR just add a new f without removing anything or always only add in 1 f if you dont really care about it being "perfect"

//STILL GOTTA TEST SQUARE BRACKET REPLACEMENT
//REPLACING THE SQUARE BRACKETS ARE MESSING UP THE RULE FROMS
    //AT THIS POINT JUST REWRITE THE RANDOM L SYSTEM STRING GENERATION AND HOPEFULLY GET RID OF THAT "HACK" LINE (but maybe youll still need it, whatever)

//STRAIGHT LINES DONT LOOK SO GREAT, TRY TO FIGURE OUT A WAY TO REDUCE THOSE
    //ALSO WANNA TRY TO GET RID OF THE ONES THAT DONT DO ANYTHING
//WOULD IT BE POSSIBLE TO MAKE THE LSYSTEMS THEMSELVES HAVE A COLOR SWITCH INSTRUCTION? 
    //would be annoying because I'd probably want a color stack... but maybe just having an instruction to switch to a complementry color or something would work?
//SHOULD MAKE A MENU YOU CAN ACCESS WITH THE MOUSE
//SHOULD MAKE COLORS HAVE A MINIMUM BRIGHTNESS (like 200 or something idk)
//MIGHT WANNA MAKE IT SO YOU DONT HAVE TO FULLSCREEN (a border would be kinda ugly though, try to find a better way)


"use strict";

const CANVAS = document.getElementById("canvas");
const CONTEXT = CANVAS.getContext("2d");
const DISTANCE_PER_MOVEMENT = 80;
const PI = Math.PI; //just to make is shorter

CANVAS.width = screen.width * 4;
CANVAS.height = screen.height * 4;
CONTEXT.lineWidth = 8;
CONTEXT.strokeStyle = "white";

//consts for randomly generating lsystems
const MIN_RULES = 2;
const MAX_RULES = 5;
const MIN_START_LENGTH = 1;
const MAX_START_LENGTH = 5;
const MIN_RULE_LENGTH = 2;
const MAX_RULE_LENGTH = 5;
const NON_RANDOM_ANGLES = [20, 30, 36, 45, 60, 90, 135];
const RANDOM_ANGLE_CHANCE = 0.5;
const MAX_ANGLE = 179;
const MIN_ANGLE = 5;
const POSSIBLE_CHARS = ['F', '+', '-', '[', 'A', 'B']
const LSYSTEM_MAX_LENGTH = 2000;

//drawing
const MS_PER_TURTLE_MOVE = 10;
const FS_PER_TURTLE_MOVE = 50; //number of "F" commands per turtle move
const FADE_TIME_MS = 100;



function LSystem(seed, rules, angle) {
    this.seed = seed;
    this.string = seed;
    this.rules = rules;
    this.angle = angle;

    this.grow = maxLen => {
        let grownString = this.string;
        while (grownString.length < maxLen) {
            //console.log(grownString);
            this.string = grownString; //only update this.string when we know the grown string is below max length
            grownString = "";
            for (let char of this.string) {
                if (char in this.rules) {
                    grownString = grownString.concat(this.rules[char]);
                } else {
                    grownString = grownString.concat(char);
                }
            }
            if (grownString == this.string) {
                break; //HACK TO FIX ISSUE WITH RULES RUNNING FOREVER 
            }
        }
    }
}


function TurtleState(x, y, angle, positionStack) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.positionStack = positionStack;
}


function degreeToRad(degree) {
    return degree * (PI / 180);
}

function randInt(min, max) {
    let valueRange = max - min + 1; // +1 to be inclusive
    return Math.floor(Math.random() * valueRange) + min;
}

function randChoice(ary) {
    return ary[Math.floor(Math.random() * ary.length)];
}

function randomColor() {
    let color;
    do {
        color = "#"
        for (var i = 0; i < 6; i++) {
            let newDigit = randInt(0, 15);
            color += newDigit.toString(16);
        }
    } while (color.match(/#(([abcdef].....)|(..[abcdef]...)|(....[abcdef].))/) === null); //make sure color is bright
    console.log(color)
    return color;
}

function chance(percentage) {
    return Math.random() < percentage;
}


function randLSystemString(length, usedCharsSet) {
    let string = "";
    let closingBracketLocations = new Set();
    for (let char = 0; char < length; char ++) {
        let newChar = randChoice(POSSIBLE_CHARS);
        //console.log(char, string, closingBracketLocations, newChar);
        if (closingBracketLocations.has(char)) {
            newChar = ']';
        }
        else if (newChar == '[') {
            if (closingBracketLocations.size >= length - char - 1) { // dont do anything if no more room in string
                char --;
                continue;
            } else {
                let newClosingBracketLocation;
                do {
                    newClosingBracketLocation = randInt(char + 1, length - 1);
                } while (closingBracketLocations.has(newClosingBracketLocation));
                closingBracketLocations.add(newClosingBracketLocation);
                newChar = '['
            }
        }
        if (newChar != '[' && newChar != ']') {
            usedCharsSet.add(newChar);
        }
        string += newChar;
    }
    return string;
}


function randomLSystem() {
    console.log("starting rand sys")
    let usedChars = new Set();

    let num_start_chars = randInt(MIN_START_LENGTH, MAX_START_LENGTH);
    let start = randLSystemString(num_start_chars, usedChars);

    let angle;
    if (chance(RANDOM_ANGLE_CHANCE)) {
        angle = randInt(MIN_ANGLE, MAX_ANGLE);
    } else {
        angle = randChoice(NON_RANDOM_ANGLES);
    }
    angle = degreeToRad(angle);

    let rules = {};
    let numRules = randInt(MIN_RULES, MAX_RULES);
    for (let rule = 0; rule < numRules; rule ++) {
        let ruleLength = randInt(MIN_RULE_LENGTH, MAX_RULE_LENGTH);
        let ruleFrom = randChoice(Array.from(usedChars));
        let ruleTo = randLSystemString(ruleLength, usedChars);
        rules[ruleFrom] = ruleTo;
    }

    // make sure rules have at least one F
    let hasF = false;
    for (let ruleTo in Object.values(rules)) {
        if (ruleTo.search('F') != -1) {
            hasF = true;
            break;
        }
    }
    if (!hasF) {
        let [randRuleFrom, randRuleTo] = randChoice(Object.entries(rules));
        let numFs = 1;
        if (randRuleTo.charAt(0) == "[") {
            numFs = 2;
            randRuleTo = randRuleTo.replace(']', '');
        }
        randRuleTo = randRuleTo.substr(1);
        for (; numFs > 0; numFs --) {
            let randIndex = randInt(0, randRuleTo.length - 1);
            randRuleTo = randRuleTo.substring(0, randIndex) + "F" + 
                randRuleTo.substring(randIndex, randRuleTo.length);
        }
        rules[randRuleFrom] = randRuleTo;
    }

    console.log("NEW SYS: ", start, rules)
    return new LSystem(start, rules, angle);
}


function* turtleMoveGenerator() {
    let currentStrings = [];
    let numFs = 0;
    while (true) {
        let lsys = randomLSystem();
        lsys.grow(LSYSTEM_MAX_LENGTH);
        let currentStringPosition = 0;
        while (currentStringPosition < lsys.string.length) {
            let nextFPosition = lsys.string.indexOf('F', currentStringPosition);
            let foundF = nextFPosition != -1;
            if (! foundF) {
                nextFPosition = lsys.string.length - 1;
            } else {
                numFs ++;
            }
            currentStrings.push({
                string: lsys.string.substring(currentStringPosition, nextFPosition + 1),
                lsystem: lsys
            });
            if (numFs >= FS_PER_TURTLE_MOVE) {
                yield currentStrings;
                currentStrings = [];
                numFs = 0;
            }
            currentStringPosition = nextFPosition + 1;
        }
    }
}


function sleep(ms) {
    return new Promise(callback => {
        setTimeout(callback, ms)
    });
}


function getNextPenMovement(x, y, angle, distance) {
    let sinAngle = Math.sin(angle);
    let cosAngle = Math.cos(angle);
    let newX = x + cosAngle * distance;
    let newY = y + sinAngle * distance;
    let tooLeft = newX < 0;
    let tooRight = newX > CANVAS.width;
    let tooUp = newY < 0;
    let tooDown = newY > CANVAS.height;
    let possibleMovements = [{
        x: newX,
        y: newY,
        length: distance,
        moveToX: undefined,
        moveToY: undefined
    }];

    let distUntilOutOfBounds;
    if (tooRight || tooLeft) {
        let moveToX;
        if (tooRight) {
            distUntilOutOfBounds = (CANVAS.width - x) / cosAngle;
            moveToX = 0;
        } else if (tooLeft) {
            distUntilOutOfBounds = (-x) / cosAngle;
            moveToX = CANVAS.width;
        }
        newX = x + cosAngle * distUntilOutOfBounds;
        newY = y + sinAngle * distUntilOutOfBounds;
        possibleMovements.push({
            x: newX,
            y: newY,
            length: distUntilOutOfBounds,
            moveToX: moveToX,
            moveToY: newY
        });
    }
    if (tooDown || tooUp) {
        let moveToY;
        if (tooDown) {
            distUntilOutOfBounds = (CANVAS.height - y) / sinAngle;
            moveToY = 0;
        } else if (tooUp) {
            distUntilOutOfBounds = (-y) / sinAngle;
            moveToY = CANVAS.height;
        }
        newX = x + cosAngle * distUntilOutOfBounds;
        newY = y + sinAngle * distUntilOutOfBounds;
        possibleMovements.push({
            x: x + cosAngle * distUntilOutOfBounds,
            y: y + sinAngle * distUntilOutOfBounds,
            length: distUntilOutOfBounds,
            moveToX: newX,
            moveToY: moveToY
        });
    }

    let shortestMovement = possibleMovements[0];
    for (let movement of possibleMovements) {
        if (movement.length < shortestMovement.length) {
            shortestMovement = movement;
        }
    }
    return shortestMovement;
}


function drawLSystemSubString(string, turnAngle, initialTurtleState) {
    let currentAngle = initialTurtleState.angle;
    let positionStack = initialTurtleState.positionStack;
    let x = initialTurtleState.x, y = initialTurtleState.y;
    CONTEXT.beginPath();
    CONTEXT.moveTo(x, y);
    for (let char of string) {
        switch (char) {
            case 'F':
                let distanceRemaining = DISTANCE_PER_MOVEMENT;
                let nextMovement = getNextPenMovement(x, y, currentAngle, distanceRemaining);
                while (nextMovement.length < distanceRemaining) {
                    CONTEXT.lineTo(nextMovement.x, nextMovement.y);
                    CONTEXT.moveTo(nextMovement.moveToX, nextMovement.moveToY);
                    x = nextMovement.moveToX, y = nextMovement.moveToY;
                    distanceRemaining -= nextMovement.length;
                    nextMovement = getNextPenMovement(x, y, currentAngle, distanceRemaining);
                }
                CONTEXT.lineTo(nextMovement.x, nextMovement.y);
                x = nextMovement.x, y = nextMovement.y;
                break;
            case '+':
                currentAngle += turnAngle;
                break;
            case '-':
                currentAngle -= turnAngle;
                break;
            case '[':
                positionStack.push({
                    x: x,
                    y: y,
                    angle: currentAngle
                });
                break;
            case ']':
                let position = positionStack.pop();
                x = position.x;
                y = position.y;
                CONTEXT.moveTo(x, y);
                currentAngle = position.angle;
                break;
        }
    }
    CONTEXT.stroke();
    return new TurtleState(x, y, currentAngle, positionStack);
}


async function drawRandomLSystemPath() {
    let moveGenerator = turtleMoveGenerator();
    let currentTurtleState = new TurtleState(0, 0, 0, []);
    let currentLSystem;
    for (let instructions of moveGenerator) {
        for (let {string: string, lsystem: lsystem} of instructions) {
            if (lsystem != currentLSystem) {
                CONTEXT.strokeStyle = randomColor();
                currentLSystem = lsystem;
            }
            currentTurtleState = drawLSystemSubString(string, lsystem.angle, currentTurtleState);
        }
        await sleep(MS_PER_TURTLE_MOVE);
    }
}


function fadeCanvas() {
    CONTEXT.fillStyle = "rgba(0, 0, 0, 0.1)";
    CONTEXT.fillRect(0, 0, CANVAS.width, CANVAS.height);
}



drawRandomLSystemPath();
setInterval(fadeCanvas, FADE_TIME_MS);