function generateDeviceLi(device) {
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
    if ( $('#yourdevices li').length <= 0 ){
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