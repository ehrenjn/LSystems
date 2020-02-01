//HAVE TO CHANGE HOW FADE TIME IS USED IF I WANT TO BE ABLE TO CHANGE IT
//MAKE SLIDERS USE A PROPER SUPPORTED ELEMENT
//ADD NON LINEAR SLIDERS
    //just have a locationToVal function in every mapping, most of the time its just a func called linear() but for exponential stuff its exponential(2) or something
//PROBABLY WANT TO MAKE SLIDERS WIDER/EASIER TO CLICK ON
//NEED TO MAKE SLIDERS HAVE DEFAULTS
    //since we're gonna have non linear sliders and stuff we probably just want every mapping to have a locationToVal function as well as a valToLocation function, and then just use valToLocation to calculate the initial... but that valToLocation might be overkill


"use strict";

const MENU = document.getElementById("menu");

const SLIDER_ZERO_POSITION = 214; //when slider grip is this far left it's at 0
const SLIDER_FULL_POSITION = 14;
const SLIDER_LENGTH_PIX = SLIDER_ZERO_POSITION - SLIDER_FULL_POSITION; //number of positions slider has in pixels


const SLIDER_MAPPINGS = [
    {
        id: "fadeTimeSlider",
        min: 10,
        max: 10000,
        initial: FADE_TIME_MS,
        units: "ms",
        update: val => FADE_TIME_MS = val
    },
    {
        id: "distancePerMovementSlider",
        min: 1,
        max: 500,
        initial: DISTANCE_PER_MOVEMENT,
        units: "px",
        update: val => DISTANCE_PER_MOVEMENT = val
    },
    {
        id: "lineWidthSlider",
        min: 1,
        max: 20,
        initial: LINE_WIDTH,
        units: "px",
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
        update: val => FS_PER_TURTLE_MOVE = val
    },
    {
        id: "timePerMovementSlider",
        min: 10,
        max: 1000,
        initial: MS_PER_TURTLE_MOVE,
        units: "ms",
        update: val => MS_PER_TURTLE_MOVE = val
    }
]


function keepNumWithin(num, min, max) {
    num = num > max ? max : num;
    return num < min ? min : num;
}


function setUpSliderMappings() {
    for (let mapping of SLIDER_MAPPINGS) {
        let sliderDiv = document.getElementById(mapping.id);
        let slider = sliderDiv.querySelector(".slider");
        let sliderGrip = sliderDiv.querySelector(".slider-grip");
        let numbox = sliderDiv.querySelector(".numbox");

        function locationToVal(offsetX) {
            let valAmplitude = mapping.max - mapping.min;
            let valAsPercent = offsetX/SLIDER_LENGTH_PIX;
            let val = valAsPercent * valAmplitude + mapping.min;
            val = keepNumWithin(val, mapping.min, mapping.max) //make absolutely sure we don't go out of bounds
            return Math.floor(val);
        }

        function updateEverything(event) {
            let offsetX = event.clientX - slider.getBoundingClientRect().x;
            offsetX = keepNumWithin(offsetX, 0, SLIDER_LENGTH_PIX);
            let val = locationToVal(offsetX);
            numbox.innerText = val;
            sliderGrip.style.right = SLIDER_ZERO_POSITION - offsetX;
            mapping.update(val);
        }

        slider.onmousedown = clickEvent => {
            updateEverything(clickEvent);
            window.onmousemove = updateEverything;
        }
        sliderGrip.onmousedown = slider.onmousedown;
        //updateSliderUI(mapping.initial); //initialize the slider value
    }

    window.onmouseup = () => window.onmousemove = null;
}



CANVAS.onclick = function(clickEvent) {
    MENU.style.left = clickEvent.clientX;
    MENU.style.top = clickEvent.clientY;
    MENU.hidden = !MENU.hidden;
}

setUpSliderMappings();