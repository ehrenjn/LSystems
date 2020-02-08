//HAVE TO CHANGE HOW FADE TIME IS USED IF I WANT TO BE ABLE TO CHANGE IT
//PROBABLY WANT TO MAKE SLIDERS WIDER/EASIER TO CLICK ON
//NEED TO MAKE SLIDERS HAVE DEFAULTS
    //since we're gonna have non linear sliders and stuff we probably just want every mapping to have a locationToVal function as well as a valToLocation function, and then just use valToLocation to calculate the initial... but that valToLocation might be overkill

//MAKE SURE YOUR STRETCH FUNCTION WORKS (I SEEM TO BE ABLE TO CHANGE THE INITIAL POSITION OF THE 4TH SLIDER BY LIKE 1 PIXEL WITHOUT IT GOING OFF OF 5??)
//MAX AND MIN RULES SEEM PRETTY IFFY... HAVE TO MAKE SURE THEY WORK (something nasty should happen when you set min rules above max rules)
    //ALSO: CAN I GO DOWN TO 1? ABOVE 5? THINK ABOUT IT
//STILL NEED TO MAKE MAPPINGS FOR STARTING SIZE

"use strict";

const MENU = document.getElementById("menu");

const SLIDER_ZERO_POSITION = 214; //when slider grip is this far left it's at 0
const SLIDER_FULL_POSITION = 14;
const SLIDER_LENGTH_PIX = SLIDER_ZERO_POSITION - SLIDER_FULL_POSITION; //number of positions slider has in pixels

const LinearConverter = createConverterClass(1);


const SLIDER_MAPPINGS = [
    {
        id: "fadeTimeSlider",
        min: 10,
        max: 10000,
        initial: FADE_TIME_MS,
        units: "ms",
        converter: createConverterClass(4),
        update: val => FADE_TIME_MS = val
    },
    {
        id: "distancePerMovementSlider",
        min: 1,
        max: 500,
        initial: DISTANCE_PER_MOVEMENT,
        units: "px",
        converter: createConverterClass(4),
        update: val => DISTANCE_PER_MOVEMENT = val
    },
    {
        id: "lineWidthSlider",
        min: 1,
        max: 20,
        initial: LINE_WIDTH,
        units: "px",
        converter: LinearConverter,
        update: val => {
            LINE_WIDTH = val;
            CONTEXT.lineWidth = LINE_WIDTH;
        }
    },
    {
        id: "linesPerMovementSlider",
        min: 1,
        max: 200,
        initial: FS_PER_TURTLE_MOVE,
        units: "",
        converter: createConverterClass(2),
        update: val => FS_PER_TURTLE_MOVE = val
    },
    {
        id: "timePerMovementSlider",
        min: 10,
        max: 1000,
        initial: MS_PER_TURTLE_MOVE,
        units: "ms",
        converter: createConverterClass(3),
        update: val => MS_PER_TURTLE_MOVE = val
    },
    {
        id: "angleRandomnessSlider",
        min: 0,
        max: 100,
        initial: Math.floor(RANDOM_ANGLE_CHANCE * 100),
        units: "%",
        converter: LinearConverter,
        update: val => RANDOM_ANGLE_CHANCE = val / 100
    },
    {
        id: "minRulesSlider",
        min: 2,
        max: 5,
        initial: MIN_RULES,
        units: "",
        converter: LinearConverter,
        update: val => MIN_RULES = val
    },
    {
        id: "maxRulesSlider",
        min: 2,
        max: 5,
        initial: MAX_RULES,
        units: "",
        converter: LinearConverter,
        update: val => MAX_RULES = val
    },
    {
        id: "minRuleLengthSlider",
        min: 2,
        max: 30,
        initial: MIN_RULE_LENGTH,
        units: "",
        converter: createConverterClass(2),
        update: val => MIN_RULE_LENGTH = val
    },
    {
        id: "maxRuleLengthSlider",
        min: 2,
        max: 30,
        initial: MAX_RULE_LENGTH,
        units: "",
        converter: createConverterClass(2),
        update: val => MAX_RULE_LENGTH = val
    },
    {
        id: "maxSystemLengthSlider",
        min: 10,
        max: 10000,
        initial: LSYSTEM_MAX_LENGTH,
        units: "",
        converter: createConverterClass(3),
        update: val => LSYSTEM_MAX_LENGTH = val
    }
]



function keepNumWithin(num, min, max) {
    num = num > max ? max : num;
    return num < min ? min : num;
}


function createConverterClass(power) {

    function numToPercent(num, min, max) {
        return (num - min) / (max - min);
    }
    
    function percentToNum(percent, min, max) {
        let num = percent * (max - min) + min;
        return keepNumWithin(num, min, max) //make absolutely sure we don't go out of bounds
    }

    function stretch(num, oldMin, oldMax, newMin, newMax, percentBender) {
        let numAsPercent = numToPercent(num, oldMin, oldMax);
        numAsPercent = percentBender(numAsPercent); //bend the normalized number (for non-linear sliders)
        let newNum = percentToNum(numAsPercent, newMin, newMax);
        return Math.floor(newNum);
    }

    return function(valMin, valMax) {

        this.locationToVal = function(offsetX) {
            let bender = percent => Math.pow(percent, power)
            return stretch(offsetX, 0, SLIDER_LENGTH_PIX, valMin, valMax, bender);
        }

        this.valToLocation = function(val) {
            let bender = percent => Math.pow(percent, 1/power);
            return stretch(val, valMin, valMax, 0, SLIDER_LENGTH_PIX, bender);
        }
    }
}


function setUpSliderMappings() {
    for (let mapping of SLIDER_MAPPINGS) {
        let sliderDiv = document.getElementById(mapping.id);
        let slider = sliderDiv.querySelector(".slider");
        let sliderGrip = sliderDiv.querySelector(".slider-grip");
        let numbox = sliderDiv.querySelector(".numbox");
        let converter = new mapping.converter(mapping.min, mapping.max);

        function updateEverything(val, offsetX) {
            numbox.innerText = val + " " + mapping.units;
            sliderGrip.style.right = SLIDER_ZERO_POSITION - offsetX;
            mapping.update(val);
        }

        function updateEverythingViaEvent(event) {
            let offsetX = event.clientX - slider.getBoundingClientRect().x; //mouse location relative to slider
            offsetX = keepNumWithin(offsetX, 0, SLIDER_LENGTH_PIX);
            let val = converter.locationToVal(offsetX);
            updateEverything(val, offsetX);
        }

        function updateEverythingViaVal(val) {
            let offsetX = converter.valToLocation(val);
            updateEverything(val, offsetX);
        }

        slider.onmousedown = clickEvent => {
            updateEverythingViaEvent(clickEvent);
            window.onmousemove = updateEverythingViaEvent;
        }
        sliderGrip.onmousedown = slider.onmousedown;

        updateEverythingViaVal(mapping.initial); //initialize the slider value
    }

    window.onmouseup = () => window.onmousemove = null;
}



CANVAS.onclick = function(clickEvent) {
    MENU.style.left = clickEvent.clientX;
    MENU.style.top = clickEvent.clientY;
    MENU.hidden = !MENU.hidden;
}

setUpSliderMappings();