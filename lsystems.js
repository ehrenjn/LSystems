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

//WOULD IT BE POSSIBLE TO MAKE THE LSYSTEMS THEMSELVES HAVE A COLOR SWITCH INSTRUCTION? 
    //would be annoying because I'd probably want a color stack... but maybe just having an instruction to switch to a complementry color or something would work?
//SHOULD PROBABLY HAVE A POPUP THING BEFORE THE SITE THAT TELLS YOU HOW TO USE IT (maybe it could tell you to fullscreen if I dont fix that?)
//should have a thing that lets people input their own custom LSystems instead of random ones

//SOMETIMES I SEE A NEW LSYSTEM JUMP SOMEWHERE IN THE MIDDLE OF THE SCREEN INSTEAD OF FOLLOWING OLD ONE?
    //very high chance that this is just caused by a bunch of closing square brackets at the end (since beginning of old lsystem has already faded away)

//RN YOU SEEM TO NOT BE USING ANY SQUARE BRACKETS BECAUSE YOU TOOK THEM OUT OF THE LIST OF CHARS BUT ITS LOOKING VERY NICE, SO MAYBE YOU SHOULD HAVE A WAY TO GET RID OF SQUARE BRACKETS IN THE FUTURE
//IF ANGLE IS STORED IN THE LSYSTEM THEN SHOULDN'T COLOR BE TOO?
//MIGHT WANNA PASS AROUND CANVAS AND CONTEXT INSTEAD OF HAVING THEM GLOBAL, IDK (think about it)

//BIIIIG ISSUE I JUST REALIZED: SOMETIMES NEW LSYSTEM TAKES A WHILE TO LOAD (fades and everything freeze)
    //OBVIOUSLY RAISING COMPLEXITY FIXES IT BUT ITS PROBABLY HAPPENING ON NORMAL SETTINGS WHICH AINT GREAT
    //HOL UP INSTEAD OF JUST COUNTING THE NUMBER OF ROUNDS AND CAPPING IT I CAN CHECK THE RATE AT WHICH ITS GROWING AND CHOOSE TO DO SOMETHING FROM THERE

"use strict";

const CANVAS = document.getElementById("canvas");
const CONTEXT = CANVAS.getContext("2d");
const PI = Math.PI; //just to make this shorter


//consts for randomly generating lsystems
let MIN_RULES = 2;
let MAX_RULES = 5;
let MIN_START_LENGTH = 1;
let MAX_START_LENGTH = 5;
let MIN_RULE_LENGTH = 2;
let MAX_RULE_LENGTH = 5;
const NON_RANDOM_ANGLES = [20, 30, 36, 45, 60, 90, 135];
let RANDOM_ANGLE_CHANCE = 0.5;
const MAX_ANGLE = 179;
const MIN_ANGLE = 5;
let LSYSTEM_MAX_LENGTH = 2000;
const MAX_GROWTH_CYCLES = 200;

//drawing
let DISTANCE_PER_MOVEMENT = 20;
let LINE_WIDTH = 2;
let MS_PER_TURTLE_MOVE = 10;
let FS_PER_TURTLE_MOVE = 5//2;//5;//50; //number of "F" commands per turtle move
let FADE_TIME_MS = 100;

resizeCanvas(); //initialize canvas to proper size



function LSystem(seed, rules, angle) {
    this.seed = seed;
    this.string = seed;
    this.rules = rules;
    this.angle = angle;


    this.grow = maxLen => {
        let growthCycle = 0;
        let grownString = this.string;

        while (grownString.length < maxLen) {
            this.string = grownString; //only update this.string when we know the grown string is below max length
            let grownStringAry = [];
            for (let char of this.string) {
                if (char in this.rules) {
                    grownStringAry.push(this.rules[char]);
                } else {
                    grownStringAry.push(char);
                }
            }
            grownString = grownStringAry.join('');

            if (grownString == this.string) { //stop trying to grow if it can't anymore (will happen if rules look something like {a: bbb, b: ccc, c: ddd})
                break;
            }

            if (growthCycle > MAX_GROWTH_CYCLES) { //also stop trying to grow if we've already grown the string a bunch of times (usually system size grows exponentially so it doesn't matter, but sometimes systems grow linearly and can lag everything out)
                break;
            }
            growthCycle ++;
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
    return color;
}

function chance(percentage) {
    return Math.random() < percentage;
}


const POSSIBLE_CHARS = ['F', '+', '-', 'A', 'B'];
const SQUARE_BRACKET_CHANCE = 1 / (POSSIBLE_CHARS.length + 1); //chance of a character in an lsystem string being an opening square bracket

function randLSystemString(length) {
    let numBracketPairs = 0;
    for (let pairNum = 0; pairNum < Math.floor(length / 2); pairNum ++) { //length / 2 because we generate brackets 2 at a time (pair of chars)
        if (chance(SQUARE_BRACKET_CHANCE)) {
            numBracketPairs ++;
        }
    }

    let string = "";
    let numRandomLetters = length - (numBracketPairs * 2);
    for (; numRandomLetters > 0; numRandomLetters --) {
        string += randChoice(POSSIBLE_CHARS);
    }

    for (let bracketPair = 0; bracketPair < numBracketPairs; bracketPair ++) {
        let openingLocation = randInt(0, string.length);
        let closingLocation = randInt(openingLocation, string.length);
        string = string.substring(0, openingLocation) + '[' +
                string.substring(openingLocation, closingLocation) + ']' +
                string.substring(closingLocation, string.length);
    }

    return string;
}


function CharSet(bannedChars) {
    this.bannedChars = new Set(bannedChars);
    this.set = new Set();

    this.addChars = function(str) {
        for (let char of str) {
            if (! this.bannedChars.has(char)) {
                this.set.add(char);
            }
        }
    }

    this.banChar = function(char) {
        this.set.delete(char);
        this.bannedChars.add(char);
    }

    this.randChar = function() {
        return randChoice(Array.from(this.set));
    }
}


function randAngle() {
    let angle;
    if (chance(RANDOM_ANGLE_CHANCE)) {
        angle = randInt(MIN_ANGLE, MAX_ANGLE);
    } else {
        angle = randChoice(NON_RANDOM_ANGLES);
    }
    return degreeToRad(angle);
}


function createRandomRuleStrings(numRules) {
    let ruleStrings = [];
    for (let rule = 0; rule < numRules; rule ++) {
        let ruleLength = randInt(MIN_RULE_LENGTH, MAX_RULE_LENGTH);
        let newRuleString = randLSystemString(ruleLength);
        ruleStrings.push(newRuleString);
    }

    // make sure rules have at least one F
    let hasF = false;
    for (let ruleStr of ruleStrings) {
        if (ruleStr.search('F') != -1) {
            hasF = true;
            break;
        }
    }
    if (!hasF) {
        let [randRuleNum, randRuleStr] = randChoice(Array.from(ruleStrings.entries()));
        let fLocation = randInt(0, randRuleStr.length);
        ruleStrings[randRuleNum] = randRuleStr.substring(0, fLocation) + 'F' + 
            randRuleStr.substring(fLocation) //this could make this rule exceed the maximum rule length but it doesn't matter too much and is way simpler than maintaining the max rule length (would have to deal with square brackets)
    }

    return ruleStrings;
}


function tryToCreateRuleMap(start, ruleStrings) {
    let usedChars = new CharSet("[]"); //make sure [ and ] can't be rule keys
    usedChars.addChars(start);
    let allRules = {};
    while (ruleStrings.length > 0) {
        let ruleStr = ruleStrings.pop();
        let ruleKey = usedChars.randChar();
        if (ruleKey === undefined) { //we ran out of key choices :(
            return undefined; //rule map generation failed
        }
        allRules[ruleKey] = ruleStr;
        usedChars.banChar(ruleKey);
        usedChars.addChars(ruleStr);
    }
    return allRules; 
}


function randomLSystem() {
    let angle = randAngle();
    let numRules = randInt(MIN_RULES, MAX_RULES);
    let start;
    let ruleMap;
    while (ruleMap === undefined) { //randomly generate rules (and start) until something works
        let ruleStrings = createRandomRuleStrings(numRules);
        let num_start_chars = randInt(MIN_START_LENGTH, MAX_START_LENGTH);
        start = randLSystemString(num_start_chars);
        ruleMap = tryToCreateRuleMap(start, ruleStrings);
    }
    return new LSystem(start, ruleMap, angle);
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


function resizeCanvas() {
    CANVAS.width = window.innerWidth;
    CANVAS.height = window.innerHeight;
    CONTEXT.lineWidth = LINE_WIDTH;
    CONTEXT.strokeStyle = randomColor();
}



drawRandomLSystemPath();
setInterval(fadeCanvas, FADE_TIME_MS);
window.addEventListener('resize', resizeCanvas);
