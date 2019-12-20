//DOESNT LOOK LIKE THE BOT?
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


"use strict";

const CANVAS = document.getElementById("canvas");
const CONTEXT = CANVAS.getContext("2d");
const DISTANCE_PER_MOVEMENT = 80;
const PI = Math.PI; //just to make is shorter

CANVAS.width = screen.width * 4;
CANVAS.height = screen.height * 4;
CONTEXT.lineWidth = 8;
CONTEXT.strokeStyle = "white";



function LSystem(seed, rules, angle) {
    this.seed = seed;
    this.string = seed;
    this.rules = rules;
    this.angle = angle;

    this.grow = maxLen => {
        let grownString = this.string;
        while (grownString.length < maxLen) {
            this.string = grownString; //only update this.string when we know the grown string is below max length
            grownString = "";
            for (let char of this.string) {
                if (char in this.rules) {
                    grownString = grownString.concat(this.rules[char]);
                } else {
                    grownString = grownString.concat(char);
                }
            }
        }
    }


    this.getNextPenMovement = (x, y, angle, distance) => {
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


    this.draw = (startX, startY, initialAngle) => {
        let currentAngle = initialAngle || 0;
        let [x, y] = [startX, startY];
        let positionStack = [];
        CONTEXT.beginPath();
        CONTEXT.moveTo(startX, startY);
        for (let char of this.string) {
            switch (char) {
                case 'F':
                    let distanceRemaining = DISTANCE_PER_MOVEMENT;
                    let nextMovement = this.getNextPenMovement(x, y, currentAngle, distanceRemaining);
                    while (nextMovement.length < distanceRemaining) {
                        CONTEXT.lineTo(nextMovement.x, nextMovement.y);
                        CONTEXT.moveTo(nextMovement.moveToX, nextMovement.moveToY);
                        [x, y] = [nextMovement.moveToX, nextMovement.moveToY];
                        distanceRemaining -= nextMovement.length;
                        nextMovement = this.getNextPenMovement(x, y, currentAngle, distanceRemaining);
                    }
                    CONTEXT.lineTo(nextMovement.x, nextMovement.y);
                    [x, y] = [nextMovement.x, nextMovement.y];
                    break;
                case '+':
                    currentAngle += this.angle;
                    break;
                case '-':
                    currentAngle -= this.angle;
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
    }
}


function degreeToRad(degree) {
    return degree * (PI / 180);
}

//let sys = new LSystem("T", {"F":"FFFFF-","T":"[]FFFTF"}, PI / 4);
//let sys = new LSystem("FF", {"F":"FQ+FB","G":"[W]F","X":"W+XQ+--Q+","W":"QG","Q":"G[W]W"}, degreeToRad(60))
let sys = new LSystem("FLLL", {"F":"FF-L+L","L":"+L[F+F]+L"}, degreeToRad(60));
//let sys = new LSystem("+F", {"F":"FF"}, PI / 4);
sys.grow(1000);
console.log(sys.string);
sys.draw(0, 0)