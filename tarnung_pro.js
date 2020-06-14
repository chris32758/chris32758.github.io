/*
 * Author: Mag. Klaus Steiner
 * E-Mail: ksteiner@raetselagentur.at
 * Created: September 2012
 */
COPYRIGHT="Klaus Steiner (2012-14), ksteiner@raetselagentur.at, Vinckensteiner Rätsel und Denkspiele, http://www.raetselagentur.at";

// PARAMETERS - here, and only here, changes are welcome

// gaming parameters;  Werte 30-30-3 sind sehr gut
NUMBEROFBUGS = 60; // Total number of initial bugs. Should be a multiple of number of BUGIMAGES!
MINPOPULATION = 20; // per cent of NUMBEROFBUGS when next generation will be reproduced
NUMBEROFGENERATIONS = 3;
DURATION = 30; //max duration for a generation in seconds (30)

// skaling
BUGSIZE = 18;
HITRADIUS = BUGSIZE;
MARKRADIUS = BUGSIZE+3;
OFFSET = 15; // min. bug distance to frame
STATUSHEIGHT = 25;

// usage
TRANSITIONDELAY = 1000; // delay in milliseconds for click insensitivity on transition screens

// images
BUGIMAGESRC = ["images/bug01.png","images/bug02.png","images/bug03.png","images/bug04.png","images/bug05.png",
    "images/bug06.png","images/bug07.png","images/bug08.png","images/bug09.png","images/bug10.png"];
BACKIMAGESRC = ["images/HG01.JPG","images/HG02.JPG","images/HG03.JPG","images/HG04.JPG"];

// Language
LANGUAGE = "de"; // default language

var text = new Array();
text["de"] = new Object();
text["de"]["button1"] = "Neustart";
text["de"]["transition1"] = "Überlebende der ";
text["de"]["transition2"] = ". Generation";
text["de"]["transitionClick"] = "Weiter mit Klick";
text["de"]["status1"] = "Generation ";
text["de"]["status2"] = "Restzeit: ";
text["de"]["status3"] = " Sek.";
text["de"]["status4"] = "       ";
text["de"]["status5"] = " Käfer sind am Leben, ";
text["de"]["status6"] = " noch zu fangen";
text["de"]["finish0"] = "Auswertung";
text["de"]["finish1"] = "Anfang";
text["de"]["finish2"] = "Generation ";
text["de"]["finish3"] = "Ende";
text["de"]["finishClick"] = "Klick hier für neues Spiel";

text["en"] = new Object();
text["en"]["button1"] = "Restart";
text["en"]["transition1"] = "Survivors of generation #";
text["en"]["transition2"] = "";
text["en"]["transitionClick"] = "Click here to proceed";
text["en"]["status1"] = "Generation #";
text["en"]["status2"] = "Time: ";
text["en"]["status3"] = " sec.";
text["en"]["status4"] = "";
text["en"]["status5"] = " bugs alife, ";
text["en"]["status6"] = " still to catch";
text["en"]["finish0"] = "Results";
text["en"]["finish1"] = "Start";
text["en"]["finish2"] = "Generation #";
text["en"]["finish3"] = "End";
text["en"]["finishClick"] = "Click here to start new game";


// global variables (do not change)

var DEBUG = "";
var fauna = new Array(); // Array of Objects (bugs)
var faunaStat = new Array(); // array of bugStat; holds population statistics for all generations
var livingbugs;
var Generation;
var CanvasWidth;
var CanvasHeight;
var STATUS; // ("ACTIVE","START","NEXT","FINISH") current status for processing of mouse clicks
var IntervalVar;
var DownCount;
var StatusBarBg; // stores background for status bar
var TransitionTime = new Date(); // stores time of last transition screen

// preload images

BUGIMAGES = new Array();
for (i=0;i<BUGIMAGESRC.length;i++){
    BUGIMAGES[i] = new Image();
    BUGIMAGES[i].src = BUGIMAGESRC[i];
}

BACKIMAGES = new Array();
for (i=0;i<BACKIMAGESRC.length;i++){
    BACKIMAGES[i] = new Image();
    BACKIMAGES[i].src = BACKIMAGESRC[i];
}

var Hgbild = new Image();
Hgbild = BACKIMAGES[0]; // fallback image

var ExBug = new Image();
ExBug.src = "images/ex.png";

// usage statistics
_numberOfGamesStarted = 0;
_numberOfGamesFinished = 0;
_startincrement = Math.floor(Math.random()*BACKIMAGESRC.length)

/* ------------------------------------------------------------------
   ------------------------------------------------------------------ */
function updateStatusBar (canvas) {
    // draw remaining seconds on canvas
    //alert(DownCount);
    if(canvas.getContext){
        var context = canvas.getContext('2d');
        context.putImageData(StatusBarBg,0,0);
        context.fillStyle="#aaa";
        context.globalAlpha = 0.7;
        context.fillRect(0,0,canvas.width,STATUSHEIGHT);
        context.fillStyle="#000";
        context.globalAlpha = 1.0;
        context.font = '14px sans-serif';
        context.textBaseline = 'bottom';
        context.textAlign = 'left';
        // count down
        var g=Generation+1;
        var outStr = text[LANGUAGE]["status1"]+g+ text[LANGUAGE]["status2"] + DownCount+ text[LANGUAGE]["status3"];
        // bugs stat
        var alive = 0;
        for (i=0;i<fauna.length;i++){
            if (fauna[i]["alive"])
                alive++;
        }
        var tocatch = alive - Math.floor(MINPOPULATION * NUMBEROFBUGS/100);
        //context.fillText(alive+" KÃ¤fer sind am Leben, "+tocatch+" noch zu fangen",400,20);
        outStr += text[LANGUAGE]["status4"] + alive+text[LANGUAGE]["status5"]+tocatch+text[LANGUAGE]["status6"];
        //context.fillText(outStr,20,20);

        context.textAlign = 'left';
        context.fillText(text[LANGUAGE]["status1"]+g,30,20);
        context.textAlign = 'center';
        context.fillText(text[LANGUAGE]["status4"] + alive+text[LANGUAGE]["status5"]+tocatch+text[LANGUAGE]["status6"],canvas.width/2,20);
        context.textAlign = 'right';
        context.fillText(text[LANGUAGE]["status2"] + DownCount + text[LANGUAGE]["status3"],canvas.width-30,20);

    }
}

/* ------------------------------------------------------------------
   ------------------------------------------------------------------ */
function setCountdown(canvas){
    DownCount--;
    updateStatusBar (canvas);
    if (DownCount<=0){
        //alert(DownCount);
        clearInterval(IntervalVar);
        if (Generation==NUMBEROFGENERATIONS-1){
            STATUS = "FINISH";
        } else {
            STATUS = "NEXT";
        }
        makeTransition(canvas);
    }
}

/* ------------------------------------------------------------------
   ------------------------------------------------------------------ */
function startCountdown(canvas){
//  return;
    DownCount = DURATION;
    if(canvas.getContext){
        var context = canvas.getContext('2d');
        StatusBarBg = context.getImageData(0,0,canvas.width,STATUSHEIGHT);
    }
    updateStatusBar (canvas);
    IntervalVar = setInterval(function(){setCountdown(canvas)},1000);
}

/* ------------------------------------------------------------------
   ------------------------------------------------------------------ */
function removeBug(bugNr,canvas){
    //alert("du hast auf bug(s) geklickt: "+bugNr);
    fauna[bugNr]["alive"]=false;
    if(canvas.getContext){
        var context = canvas.getContext('2d');
        undrawBug(fauna[bugNr],context);
    }
}

/* ------------------------------------------------------------------
   ------------------------------------------------------------------ */
function markSurvivors(canvas){
    //return;
    //alert("du hast auf bug(s) geklickt: "+bugNr);

    function drawArc(canvas){
        context.beginPath( );
        context.arc(fauna[i]["x"]+BUGSIZE/2,fauna[i]["y"]+BUGSIZE/2,MARKRADIUS,0,2*Math.PI,true);
        context.lineWidth = 3;
        context.strokeStyle = '#ff0';
        context.stroke();
        //context.closePath( );
    }

    if(canvas.getContext){
        var context = canvas.getContext('2d');
        for (i=0;i<fauna.length;i++)
            if (fauna[i]["alive"]){
                //var id = setTimeout(drawArc(canvas),100);
                drawArc(canvas);
            }
    }
} // function markSurvivors

/* ------------------------------------------------------------------
   ------------------------------------------------------------------ */
function makeTransition(canvas){
    var border = 200;
    clearInterval(IntervalVar);
    markSurvivors(canvas);
    if(canvas.getContext){
        // define globals
        CanvasWidth = canvas.width;
        CanvasHeight = canvas.height;
        var context = canvas.getContext('2d');
        context.fillStyle="#aaa";
        context.globalAlpha = 0.8;
        context.fillRect(border,border,CanvasWidth-2*border,CanvasHeight-2*border);
        context.globalAlpha = 1.0;
        context.fillStyle = '#333';

        context.beginPath();
        context.rect(border+5,border+5,CanvasWidth-2*border-10,CanvasHeight-2*border-10);
        context.lineWidth = 1;
        context.strokeStyle = '#333';
        context.stroke();

        context.font = 'bold 16px sans-serif';
        context.textBaseline = 'middle';
        context.textAlign = 'center';
        var g = Generation+1;
        context.fillText(text[LANGUAGE]["transition1"] +g+text[LANGUAGE]["transition2"], CanvasWidth/2,border+80);

        context.textBaseline = 'middle';
        context.textAlign = 'center';
        context.font = 'bold 12px sans-serif';
        context.fillText("<"+text[LANGUAGE]["transitionClick"]+">" , CanvasWidth/2,border+150);
    }
    TransitionTime = new Date();
}

/* ------------------------------------------------------------------
   ------------------------------------------------------------------ */
function setNewBug(type,context){
    var bug = new Object();
    var isTooClose = true;
    do {
        // avoid overlapping bugs
        isTooClose = false
        var x=Math.floor(Math.random()*(CanvasWidth -2*OFFSET)) + OFFSET;
        var y=Math.floor(Math.random()*(CanvasHeight- 2*OFFSET- STATUSHEIGHT)) + OFFSET + STATUSHEIGHT;
        for (j=0;j<i;j++){
            var x0 = fauna[j]["x"];
            var y0 = fauna[j]["y"];
            var betrag = Math.sqrt(Math.pow(x-x0,2) + Math.pow(y-y0,2));
            if (betrag<BUGSIZE){
                isTooClose = true;
            }
        }
    } while (isTooClose);
    bug["x"] = x;
    bug["y"] = y;
    bug["angle"]=Math.random()*2*Math.PI;
    bug["type"]=type;
    bug["alive"]=true;
    bug["background"] = drawBug(bug,context);
    return bug;
}

/*
 * function setPopulationStat
 * adds new entry to faunaStat for current generation
 * use only once per generation!
 * out: changes global floraStat
 * returns: alive - number of currently living bugs
 */
function setPopulationStat(){
    if (Generation != faunaStat.length)
        alert("ERROR: multiple use of setPopulationStat per Generation! Generation = "+Generation +" faunaStat = "+faunaStat.toSource())
    // get data of surviving population
    var bugStat = new Array();
    var alive = 0;
    for (i=0;i<BUGIMAGES.length;i++){ // initialization
        var bStat = new Object();
        bStat["starter"]=0;
        bStat["survivor"]=0;
        bugStat.push(bStat);
    }
    for (i=0;i<fauna.length;i++){
        bugStat[fauna[i]["type"]]["starter"]++;
        if (fauna[i]["alive"]){
            bugStat[fauna[i]["type"]]["survivor"]++;
            alive++;
        }
    }
    faunaStat.push(bugStat.slice(0));

    //alert("faunaStat: " + faunaStat.toSource());
    //alert("bugStat: " + bugStat.toSource());

    return alive;
}

/* ------------------------------------------------------------------
   ------------------------------------------------------------------ */
function finishGame(canvas){
    var border = 50;

    var aliveAnz = setPopulationStat();
    var out = "\n"+aliveAnz+"\n";

    for (i=0;i<BUGIMAGES.length;i++){
        var v = Math.round(100 * faunaStat[Generation][i]["survivor"]/aliveAnz);
        out += "Tier "+i+" ... " + v + "%\n";
    }

    if(canvas.getContext){
        var context = canvas.getContext('2d');
        context.drawImage(Hgbild,0,0,canvas.width, canvas.height);

        context.fillStyle="#aaa";
        context.globalAlpha = 0.8;
        context.fillRect(border,border,canvas.width-2*border,canvas.height-2*border);

        context.beginPath();
        context.rect(border+5,border+5,canvas.width-2*border-10,canvas.height-2*border-10);
        context.lineWidth = 1;
        context.strokeStyle = '#00c';
        context.stroke();

        context.globalAlpha = 1.0;

        context.fillStyle = '#333';
        context.font = 'bold 24px sans-serif';
        context.textBaseline = 'bottom';
        context.textAlign = 'center';
        var g = Generation+1;
        context.fillText(text[LANGUAGE]["finish0"], canvas.width/2,border+100);
        context.font = 'bold 14px sans-serif';

        // bug sizes proportional to bio mass
        var anz = NUMBEROFBUGS/BUGIMAGES.length;
        var percentsize = BUGSIZE * BUGSIZE * anz / NUMBEROFBUGS ;
        //alert(percentsize + " ... 10% = ");
        for (var g=0;g<=Generation;g++){
            var y = border+160+g*55;
            if (g==0)
                var caption = text[LANGUAGE]["finish1"];
            else
                var caption = text[LANGUAGE]["finish2"] + g;
            context.fillText(caption, border+100, y+10);
            for (i=0;i<BUGIMAGES.length;i++){
                var prozent = 100 * faunaStat[g][i]["starter"]/NUMBEROFBUGS;
                // context.fillText(prozent, border+150+i*35, y); ///////// UNCOMMENTED
                if (prozent<=0.5)
                    context.drawImage(ExBug, border+250+i*35-BUGSIZE/2, y-BUGSIZE/2,BUGSIZE,BUGSIZE);
                else {
                    var propSize = Math.sqrt(prozent * percentsize);
                    context.drawImage(BUGIMAGES[i], border+250+i*35-propSize/2, y-propSize/2,propSize,propSize);
                }
            }
        }
        var y = border+160 + (Generation+1)*55;
        context.fillText(text[LANGUAGE]["finish3"], border+100, y+10);
        for (i=0;i<BUGIMAGES.length;i++){
            var prozent = 100 * faunaStat[Generation][i]["survivor"]/aliveAnz;
            // context.fillText(prozent, border+150+i*35, y); ///////// UNCOMMENTED
            if (prozent<=0.5)
                context.drawImage(ExBug, border+250+i*35-BUGSIZE/2, y-BUGSIZE/2,BUGSIZE,BUGSIZE);
            else {
                var propSize = Math.sqrt(prozent * percentsize);
                context.drawImage(BUGIMAGES[i], border+250+i*35-propSize/2, y-propSize/2,propSize,propSize);
            }
        }
        context.textAlign = "center";
        context.fillText("<< "+text[LANGUAGE]["finishClick"]+" >>", canvas.width/2,border+450);


        /*
        // Result as per cent numbers
        context.font = 'bold 16px sans-serif';
        context.fillText("Start", border+10,border+65);
        for (i=0;i<BUGIMAGES.length;i++){
           context.drawImage(BUGIMAGES[i],border+150+i*35,border+50);
        }
        */

        for (var g=0;g<=Generation;g++){
            //      context.drawImage(ExBug,border+150+i*35,border+50+20,BUGSIZE,BUGSIZE);
            //alert(faunaStat[g].toSource());
            var y = border+200 +g*55;
            // context.fillText("Generation " + g, border+10, y);
            for (i=0;i<BUGIMAGES.length;i++){
                var prozent = Math.round(100 * faunaStat[g][i]["starter"] / NUMBEROFBUGS);
                context.fillText(prozent, border+250+i*35, y);
                //context.drawImage(BUGIMAGES[i],border+150+i*35,border+50,BUGSIZE,BUGSIZE);
            }
        }

        var alive = 0;
        for (i=0;i<fauna.length;i++){
            if (fauna[i]["alive"]){
                alive++;
            }
        }

        // Endpopulation
        var y = border+200 + (Generation+1)*55;
        // context.fillText("Endpopulation", border+10, y);
        for (i=0;i<BUGIMAGES.length;i++){
            var prozent = Math.round(100 * faunaStat[Generation][i]["survivor"] / alive);
            context.fillText(prozent, border+250+i*35, y);
        }

    }
    TransitionTime = new Date();
}

/* ------------------------------------------------------------------
   ------------------------------------------------------------------ */
function shuffleArray(arr){
    var newArr = new Array();

    // create shuffled array
    while (arr.length>0){
        var ri = Math.floor(Math.random()*arr.length);
        var el = arr[ri];
        arr.splice(ri,1);
        newArr.push(el);
    }

    // correct too long Array to NUMBEROFBUGS
    while (newArr.length>NUMBEROFBUGS) {
        newArr.pop();
    }

    // correct too short Array to NUMBEROFBUGS
    while (newArr.length<NUMBEROFBUGS) {
        var a = newArr[Math.floor(Math.random()*newArr.length)];
        newArr.push(a);
    }
    return newArr;
}


/* ------------------------------------------------------------------
   ------------------------------------------------------------------ */
function setNextGeneration(canvas){

    var aliveAnz = setPopulationStat(); // write statistic data fur current generation
    var typeArr = new Array();

    for (i=0;i<BUGIMAGES.length;i++){
        var neue = Math.round(NUMBEROFBUGS * faunaStat[Generation][i]["survivor"]/aliveAnz);
        for (j=0;j<neue;j++)
            typeArr.push(i);
    }
    typeArr = shuffleArray(typeArr);

    Generation++;

    fauna = [];
    if(canvas.getContext){
        var context = canvas.getContext('2d');
        context.save();
        context.drawImage(Hgbild,0,0,canvas.width, canvas.height);
        for (i=0;i<NUMBEROFBUGS;i++){
            var bug = setNewBug(typeArr[i],context);
            fauna.push(bug);
        }
        context.restore();
    }
    startCountdown(canvas);
}

/* ------------------------------------------------------------------
   ------------------------------------------------------------------ */
function checkClick(x,y,canvas){

    var now = new Date();

    if (STATUS == "START"){
        if (now.getTime()>TransitionTime.getTime()+TRANSITIONDELAY){
            start();
            STATUS = "ACTIVE";
        }
        return;
    }

    if (STATUS == "NEXT") {
        if (now.getTime()>TransitionTime.getTime()+TRANSITIONDELAY){
            setNextGeneration(canvas);
            STATUS = "ACTIVE";
        }
        return;
    }

    if (STATUS == "FINISH") {
        if (now.getTime()>TransitionTime.getTime()+TRANSITIONDELAY){
            finishGame(canvas);
            STATUS = "FINISHED";
        }
        return;
    }

    if (STATUS == "FINISHED") {
        if (now.getTime()>TransitionTime.getTime()+TRANSITIONDELAY){
            initScreen(canvas);
            STATUS = "START";
        }
        return;
    }

    // STATUS == ACTICE as default

    var foundbugs = [];
    for (i=0;i<NUMBEROFBUGS;i++){
        if (i > fauna.length) alert ("fauna.length = " + fauna.length + " NUMBEROFBUGS =" + NUMBEROFBUGS);

        if (fauna[i]["alive"]){
            var x0 = fauna[i]["x"] + BUGSIZE/2;
            var y0 = fauna[i]["y"] + BUGSIZE/2;
            var betrag = Math.sqrt(Math.pow(x-x0,2) + Math.pow(y-y0,2));
            if (betrag<HITRADIUS){
                foundbugs.push(i);
            }
        }
    }
    for (i=0;i<foundbugs.length;i++)
        removeBug(foundbugs[i],canvas);
    if (foundbugs.length>0)
        updateStatusBar (canvas);

    var popcount = 0;
    for (i=0;i<fauna.length;i++){
        if (fauna[i]["alive"])
            popcount++;
    }

    if (popcount<=MINPOPULATION * NUMBEROFBUGS/100){
        if (Generation==NUMBEROFGENERATIONS-1){
            STATUS = "FINISH";
        } else {
            STATUS = "NEXT";
        }
        makeTransition(canvas);
    }
}

/* ------------------------------------------------------------------
   ------------------------------------------------------------------ */
function undrawBug(bug,context){
    var bg = bug["background"];
    context.putImageData(bg,bug["x"],bug["y"]);
}

/* ------------------------------------------------------------------
   ------------------------------------------------------------------ */
function drawBug(bug,context){
    var bild = new Image();
    var bg = context.getImageData(bug["x"],bug["y"],BUGSIZE+1,BUGSIZE+1);
    bild = BUGIMAGES[bug["type"]];
    context.save();
    context.translate(Math.round(bug["x"]+BUGSIZE/2),Math.round(bug["y"]+BUGSIZE/2));
    context.rotate(bug["angle"]);
    context.drawImage(bild,-BUGSIZE/2,-BUGSIZE/2,BUGSIZE,BUGSIZE);
    context.restore();
    return bg;
}

/* ------------------------------------------------------------------
   ------------------------------------------------------------------ */
function resetGlobals(){
    _numberOfGamesStarted++;
    Generation = 0;
    fauna = [];
    faunaStat = [];
    livingbugs = 0;
    DEBUG = "";
    DownCount = DURATION;
}

/* ------------------------------------------------------------------
   ------------------------------------------------------------------ */
function getBackgroundImage(){
    return BACKIMAGES[(_numberOfGamesStarted+_startincrement)%BACKIMAGES.length];
}


/* ------------------------------------------------------------------
   ------------------------------------------------------------------ */
function start(){
    resetGlobals();
    STATUS = "ACTIVE";
    Hgbild = getBackgroundImage();
    var canvas = document.getElementById('mainCanvas');

    if(canvas.getContext){
        var context = canvas.getContext('2d');
        context.save();
        //context.clearRect(0,0,canvas.width, canvas.height);
        context.drawImage(Hgbild,0,0,canvas.width, canvas.height);
        context.restore();

        for (i=0;i<NUMBEROFBUGS;i++){
            var typ = i%BUGIMAGES.length;
            var bug = setNewBug(typ,context);
            fauna.push(bug);
        }
    }
    startCountdown(canvas);
} // function start

/* ------------------------------------------------------------------
   ------------------------------------------------------------------ */
function setLanguage(){
    LANGUAGE = document.getElementById('language').value;
    document.getElementById('button1').innerHTML = text[LANGUAGE]["button1"];
}

/* ------------------------------------------------------------------
   ------------------------------------------------------------------ */
function initEventlistener(canvas){

    // inline function
    function isTouch() {
        var dummy = document.createElement("div");
        dummy.setAttribute("ontouchmove", "return;");
        return typeof dummy.ontouchmove == "function" ? true : false;
    };

    // check for touch or mouse click
    if (isTouch()) {
        canvas.addEventListener('touchstart',
            function(e) {
                var x = e.touches[0].pageX - this.offsetLeft;
                var y = e.touches[0].pageY - this.offsetTop;
                checkClick(x,y,canvas);
                e.preventDefault();},
            false);
        canvas.addEventListener('touchmove', function(e) { e.preventDefault(); }, false);
        canvas.addEventListener('touchend',  function(e) { e.preventDefault(); }, false);
    } else {
        canvas.addEventListener('mousedown',
            function (e) {
                var x = e.pageX - this.offsetLeft;
                var y = e.pageY - this.offsetTop;
                checkClick(x,y,canvas);},
            false);
        //canvas.addEventListener('mousemove', mouseMove, false);
        //canvas.addEventListener('mouseup', mouseUp, false);
    }
}

/* ------------------------------------------------------------------
   ------------------------------------------------------------------ */
function initScreen(canvas){
    //resetGlobals();
    STATUS = "START";
    clearInterval(IntervalVar);

    Hgbild = getBackgroundImage();
    if(canvas.getContext){
        // define globals
        CanvasWidth = canvas.width;
        CanvasHeight = canvas.height;
        var context = canvas.getContext('2d');
        context.save();
        context.drawImage(Hgbild,0,0,canvas.width, canvas.height);
        context.restore();

        for (i=0;i<NUMBEROFBUGS;i++){
            var typ = i%BUGIMAGES.length;
            var bug = setNewBug(typ,context);
            fauna.push(bug);
        }

        context.fillStyle="#ff6";
        context.globalAlpha = 0.8;
        context.fillRect(100,100,canvas.width-200,canvas.height-200);

        context.globalAlpha = 1.0;

        context.beginPath();
        context.rect(100+5,100+5,canvas.width-200-10,canvas.height-200-10);
        context.lineWidth = 1;
        context.strokeStyle = '#00c';
        context.stroke();

        context.fillStyle = '#00c';
        context.textBaseline = 'bottom';
        context.textAlign = 'center';

        if (LANGUAGE=="en"){
            context.font = 'italic bold 16px sans-serif';
            context.fillText('You are a very, very hungry insectvore.', canvas.width/2, 180);
            context.fillText('Thus pick up as many bugs as possibly by clicking them!', canvas.width/2, 220);

            var minanz = Math.floor(MINPOPULATION * NUMBEROFBUGS/100);
            context.fillText("After "+DURATION+" seconds, or when only "+minanz +" bugs are left,", canvas.width/2, 260);
            context.fillText("the survivors will reproduce and create a", canvas.width/2, 300);
            context.fillText("new generation of "+NUMBEROFBUGS+" beetles.", canvas.width/2, 340);
            context.fillText('Play and learn which bugs still exist after '+NUMBEROFGENERATIONS+" generations", canvas.width/2, 380);
            context.font = 'italic normal 16px sans-serif';
            context.fillText('<< Click here to start game! >>', canvas.width/2, 440);

        } else {
            context.font = 'italic bold 16px sans-serif';
            context.fillText('Du bist ein hungriger Insektenfresser. ', canvas.width/2, 180);
            context.fillText('Erbeute so viele Käfer wie möglich durch Anklicken.', canvas.width/2, 220);
            var minanz = Math.floor(MINPOPULATION * NUMBEROFBUGS/100);
            context.fillText("Nach "+DURATION+" Sekunden, oder wenn nur noch "+minanz +" Käfer übrig", canvas.width/2, 260);
            context.fillText("sind, vermehren sich die Überlebenden und eine ", canvas.width/2, 300);
            context.fillText("neue Generation von "+NUMBEROFBUGS+" Käfern entsteht.", canvas.width/2, 340);
            context.fillText('Finde heraus welche Käfer es nach '+NUMBEROFGENERATIONS+" Generationen noch gibt!", canvas.width/2, 380);
            context.font = 'italic normal 16px sans-serif';
            context.fillText('<< Klick ins Fenster, um zu beginnen! >>', canvas.width/2, 440);
        }
    }
}

/* ------------------------------------------------------------------
   ------------------------------------------------------------------ */
function init(){
    // resetGlobals();
    STATUS = "START";
    var canvas = document.getElementById('mainCanvas');
    setLanguage();
    initEventlistener(canvas);
    initScreen(canvas);
}

