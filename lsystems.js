//DOESNT LOOK LIKE THE BOT?
//NEED TO GET LINES TO ACTUALLY GO OFF EDGE, THEN LIFT PEN AND START AGAIN ON THE OTHER SIDE FROM 0
//NEED TO SMOOTH LINES BY ONLY DRAWING FULL STRAIGHT LINES (no intermediate steps)
    //gets annoying because of wall hits
    //IF I DRAW LINES LIKE THIS THEN DOING A SLOW FADE OUT WILL BE HARD WITH DIFFERENT SIZED LINED...
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
            console.log(grownString);
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

    this.draw = (startX, startY, initialAngle) => {
        let currentAngle = initialAngle || 0;
        let [x, y] = [startX, startY];
        let positionStack = [];
        CONTEXT.beginPath();
        CONTEXT.moveTo(startX, startY);
        for (let char of this.string) {
            switch (char) {
                case 'F':
                    let deltaX = Math.cos(currentAngle) * DISTANCE_PER_MOVEMENT;
                    let deltaY = Math.sin(currentAngle) * DISTANCE_PER_MOVEMENT;
                    /*let newX = x + deltaX;
                    let newY = y + deltaY;
                    if (newX >= CANVAS.width || newX < 0) {
                        deltaX = -deltaX;
                    }
                    if (newY >= CANVAS.height || newY < 0) {
                        deltaY = -deltaY;
                    }
                    x += deltaX;
                    y += deltaY;
                    currentAngle = Math.atan(deltaX/deltaY);*/
                    //CONTEXT.lineTo(x, y);
                    x = (x + deltaX) % CANVAS.width;
                    y = (y + deltaY) % CANVAS.height;
                    if (x < 0) x += CANVAS.width;
                    if (y < 0) y += CANVAS.height;
                    CONTEXT.lineTo(x, y);
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
                    currentAngle = position.angle;
                    break;
            }
        }
        CONTEXT.stroke();
    }
}

//let sys = new LSystem("T", {"F":"FFFFF-","T":"[]FFFTF"}, PI / 4);
let sys = new LSystem("+F", {"F":"FF"}, PI / 4);
sys.grow(1000);
console.log(sys.string);
sys.draw(100, 100)