function generateDeviceLi(device) {
  device.isVibrating = false;

  let li = document.createElement("li");
  li.setAttribute("id", "li_" + device._name.replace(/\s/g, ''));
  li.appendChild(document.createTextNode(device.Name));

  let slider = document.createElement('input');
  slider.setAttribute("type", "range");
  slider.setAttribute("min", "0");
  slider.setAttribute("max", "10");
  slider.setAttribute("value", "0");
  slider.setAttribute("class", "slider");
  slider.oninput = function (evt) {
    ButtplugWrapper.vibrate(evt.target.device, parseFloat(this.value / 10));
  };
  slider.device = device;
  li.appendChild(slider);

  let buttonPattern1 = createButton('Low', device, function (evt) {
    StartPattern(evt.target.device, '1');
  });
  li.appendChild(buttonPattern1);

  let buttonPattern2 = createButton('Middle', device, function (evt) {
    StartPattern(evt.target.device, '2');
  });
  li.appendChild(buttonPattern2);

  let buttonPattern3 = createButton('High', device, function (evt) {
    StartPattern(evt.target.device, '3');
  });
  li.appendChild(buttonPattern3);

  let buttonPattern4 = createButton('Orgasmic', device, function (evt) {
    StartPattern(evt.target.device, '5');
  });
  li.appendChild(buttonPattern4);

  let buttonStop = createButton('Stop', device, function (evt) {
    StopPatternInterval(evt.target.device);
  });

  li.appendChild(buttonStop);

  return li;
}

function createButton(text, device, action) {
  let btn = document.createElement('button');
  btn.setAttribute("class", "c_btn");
  btn.device = device;
  btn.onclick = action;
  btn.innerText = text;
  return btn;
}

var timeInterval;
var patternDateStarted;

function StartPattern(device, patternName) {
  StopPatternInterval(device);

  let pattern;
  switch (patternName) {
    case '1':
      pattern = PlayPatternLow;
      break;
    case '2':
      pattern = PlayPatternMiddle;
      break;
    case '3':
      pattern = PlayPatternHigh;
      break;
    case '4':
      break;
    case '5':
      pattern = PlayPatternOrgasmic;
      break;
    default:
      break;
  }
  StartPatternInternal(device, pattern);
}


function StartPatternInternal(device, pattern) {
  patternDateStarted = new Date();
  timeInterval = setInterval(() => {
    pattern(device, new Date() - patternDateStarted);
  }, 10);
}

function StopPatternInterval(device) {
  if (timeInterval) {
    clearInterval(timeInterval);
  }
  setTimeout(function () { vibrate(device, 0); }, 500);
}

function PlayPatternLow(device, millisecondsEllapsed) {
  PlayPatternTimed(device, millisecondsEllapsed, 1, 500);
}

function PlayPatternMiddle(device, millisecondsEllapsed) {
  PlayPatternTimed(device, millisecondsEllapsed, 1, 300);
}

function PlayPatternHigh(device, millisecondsEllapsed) {
  PlayPatternTimed(device, millisecondsEllapsed, 1, 150);
}

function PlayPatternTimed(device, millisecondsEllapsed, intensity, rythm) {
  let millisecondsRounded = Math.round(millisecondsEllapsed / 10) * 10;
  let modulo = millisecondsRounded % rythm;
  if (modulo == 0) {
    if (device.isVibrating) {
      vibrate(device, 0);
    }
    else {
      vibrate(device, intensity);
    }
  }
}

function PlayPatternOrgasmic(device, millisecondsEllapsed) {
  let timeInSeconds = millisecondsEllapsed / 1000;
  let milliseconds = timeInSeconds - Math.trunc(timeInSeconds);
  if (device.isVibrating && milliseconds < 0.2) {
    vibrate(device, 0);
  }
  else {
    vibrate(device, milliseconds);
  }
}

function vibrate(device, vibration) {
  ButtplugWrapper.vibrate(device, vibration);
  if (vibration == 0) {
    device.isVibrating = false;
    console.log('off');
  }
  else {
    device.isVibrating = true;
    console.log('on');
  }
}

viewInitializer = {
  init: () => {
    let ul = $('#yourdevices');
    ul.empty();
  },
  generateli: (device) => {
    let ul = $('#yourdevices');
    li = generateDeviceLi(device, false);
    ul.append(li);
    $('#devices-title').show();
  },
  removeli: (device) => {
    $("#li_" + device._name.replace(/\s/g, '')).remove();
    if ($('#yourdevices li').length <= 0) {
      $('#devices-title').hide();
    }
  },
  connexionLostHandler: (exception) => {
    if (exception.message.includes("not available")) {
      viewInitializer.removeli(device);
      console.log("Device lost.");
    }
  }
}

ButtplugWrapper.init(viewInitializer);
var syncButton = $("#buttplug-local-button");
syncButton.on("click", function (evt) { ButtplugWrapper.connectToys(); });