//PROBABLY WANT TO MAKE SLIDERS WIDER/EASIER TO CLICK ON

//initial fade time could go down maybe... 1000ms default looks nice
//would be nice if sliders were grabbable on mobile... but I'm mainly making this for desktop so whatever
    //on mobile chrome pulling up the menu can extend the page past the canvas... dunno if I can fix it or if its worthwhile 


"use strict";

const MENU = document.getElementById("menu");
const SAVE_BUTTON = document.getElementById("saveButton");

const SLIDER_ZERO_POSITION = 214; //when slider grip is this far left it's at 0
const SLIDER_FULL_POSITION = 14;
const SLIDER_LENGTH_PIX = SLIDER_ZERO_POSITION - SLIDER_FULL_POSITION; //number of positions slider has in pixels

const LinearConverter = createConverterClass(1);


const SLIDER_MAPPINGS = [
    {
        id: "fadeTimeSlider",
        min: 10 * FADE_LOOPS_UNTIL_BLACK,
        max: 1000 * FADE_LOOPS_UNTIL_BLACK,
        initial: PARAMETERS.FADE_TIME_MS * FADE_LOOPS_UNTIL_BLACK,
        units: "ms",
        converter: createConverterClass(4),
        update: val => PARAMETERS.FADE_TIME_MS = Math.floor(val / FADE_LOOPS_UNTIL_BLACK),
        save: "FADE_TIME_MS"
    },
    {
        id: "lineLengthSlider",
        min: 1,
        max: 500,
        initial: PARAMETERS.DISTANCE_PER_MOVEMENT,
        units: "px",
        converter: createConverterClass(4),
        update: val => PARAMETERS.DISTANCE_PER_MOVEMENT = val,
        save: "DISTANCE_PER_MOVEMENT"
    },
    {
        id: "lineWidthSlider",
        min: 1,
        max: 20,
        initial: PARAMETERS.LINE_WIDTH,
        units: "px",
        converter: LinearConverter,
        update: val => {
            PARAMETERS.LINE_WIDTH = val;
            CONTEXT.lineWidth = PARAMETERS.LINE_WIDTH;
        },
        save: "LINE_WIDTH"
    },
    {
        id: "linesPerFrameSlider",
        min: 1,
        max: 200,
        initial: PARAMETERS.FS_PER_TURTLE_MOVE,
        units: "",
        converter: createConverterClass(2),
        update: val => PARAMETERS.FS_PER_TURTLE_MOVE = val,
        save: "FS_PER_TURTLE_MOVE"
    },
    {
        id: "timePerFrameSlider",
        min: 10,
        max: 1000,
        initial: PARAMETERS.MS_PER_TURTLE_MOVE,
        units: "ms",
        converter: createConverterClass(3),
        update: val => PARAMETERS.MS_PER_TURTLE_MOVE = val,
        save: "MS_PER_TURTLE_MOVE"
    },
    {
        id: "angleRandomnessSlider",
        min: 0,
        max: 100,
        initial: Math.floor(PARAMETERS.RANDOM_ANGLE_CHANCE * 100),
        units: "%",
        converter: LinearConverter,
        update: val => PARAMETERS.RANDOM_ANGLE_CHANCE = val / 100,
        save: "RANDOM_ANGLE_CHANCE"
    },
    {
        id: "minSeedSizeSlider",
        min: 1,
        max: 30,
        initial: PARAMETERS.MIN_START_LENGTH,
        units: "",
        converter: createConverterClass(3),
        update: val => PARAMETERS.MIN_START_LENGTH = val,
        save: "MIN_START_LENGTH"
    },
    {
        id: "maxSeedSizeSlider",
        min: 1,
        max: 30,
        initial: PARAMETERS.MAX_START_LENGTH,
        units: "",
        converter: createConverterClass(3),
        update: val => PARAMETERS.MAX_START_LENGTH = val,
        save: "MAX_START_LENGTH"
    },
    {
        id: "minRulesSlider",
        min: 2,
        max: 5,
        initial: PARAMETERS.MIN_RULES,
        units: "",
        converter: LinearConverter,
        update: val => PARAMETERS.MIN_RULES = val,
        save: "MIN_RULES"
    },
    {
        id: "maxRulesSlider",
        min: 2,
        max: 5,
        initial: PARAMETERS.MAX_RULES,
        units: "",
        converter: LinearConverter,
        update: val => PARAMETERS.MAX_RULES = val,
        save: "MAX_RULES"
    },
    {
        id: "minRuleLengthSlider",
        min: 2,
        max: 30,
        initial: PARAMETERS.MIN_RULE_LENGTH,
        units: "",
        converter: createConverterClass(2),
        update: val => PARAMETERS.MIN_RULE_LENGTH = val,
        save: "MIN_RULE_LENGTH"
    },
    {
        id: "maxRuleLengthSlider",
        min: 2,
        max: 30,
        initial: PARAMETERS.MAX_RULE_LENGTH,
        units: "",
        converter: createConverterClass(2),
        update: val => PARAMETERS.MAX_RULE_LENGTH = val,
        save: "MAX_RULE_LENGTH"
    },
    {
        id: "maxSystemLengthSlider",
        min: 10,
        max: 10000,
        initial: PARAMETERS.LSYSTEM_MAX_LENGTH,
        units: "",
        converter: createConverterClass(3),
        update: val => PARAMETERS.LSYSTEM_MAX_LENGTH = val,
        save: "LSYSTEM_MAX_LENGTH"
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


SAVE_BUTTON.onclick = function() {
    let queryString = "?";
    for (let mapping of SLIDER_MAPPINGS) {
        queryString += mapping.save + "=" + PARAMETERS[mapping.save] + '&';
    }
    queryString = queryString.substring(0, queryString.length - 1); //remove last '&' for nicer query string
    history.replaceState(null, "LSystems", queryString);
}



setUpSliderMappings();