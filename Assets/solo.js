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

  let buttonPattern1 = ToyControlCommons.createButton('Low', device, function (evt) {
    ToyControlCommons.startPattern(evt.target.device, '1');
  });
  li.appendChild(buttonPattern1);

  let buttonPattern2 = ToyControlCommons.createButton('Middle', device, function (evt) {
    ToyControlCommons.startPattern(evt.target.device, '2');
  });
  li.appendChild(buttonPattern2);

  let buttonPattern3 = ToyControlCommons.createButton('High', device, function (evt) {
    ToyControlCommons.startPattern(evt.target.device, '3');
  });
  li.appendChild(buttonPattern3);

  let buttonPattern4 = ToyControlCommons.createButton('Orgasmic', device, function (evt) {
    ToyControlCommons.startPattern(evt.target.device, '4');
  });
  li.appendChild(buttonPattern4);

  let buttonStop = ToyControlCommons.createButton('Stop', device, function (evt) {
    ToyControlCommons.stopPatternInterval(evt.target.device);
  });

  li.appendChild(buttonStop);

  return li;
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
  connexionLostHandler: (exception, device) => {
    if (exception.message.includes("not available")) {
      viewInitializer.removeli(device);
      console.log("Device lost.");
    }
  }
}

ButtplugWrapper.init(viewInitializer);
var syncButton = $("#buttplug-local-button");
syncButton.on("click", function (evt) { ButtplugWrapper.connectToys(); });