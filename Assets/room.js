var socket = io.connect();
var users = new Array();
var currentUser;
chat.init(socket);

document.getElementById("pseudo").addEventListener('keyup', function (event) {
  if (event.keyCode === 13) {
    connect();
  }
});

socket.on('identity', function (user) {
  currentUser = user;
});

socket.on('users', function (data) {
  //First init or user left
  //if (users.length <= 0 || users.length > data.users.length) {
  $('#users-list').empty();
  data.users.forEach(function (user) {
    if (user._id.value != currentUser._id.value) {
      createUserMenu(user);
    }
  });

  users = data.users;
});


socket.on('change_state', function (device) {
  let ul = $('#yourdevices');
  ButtplugWrapper.client.Devices.forEach(async function (d) {
    if (d.Name == device._device._name && d.isFaulty !== true) {
      if (device._targetedState._patternName !== undefined && device._targetedState._patternName !== "") {
        ToyControlCommons.startPattern(d, device._targetedState._patternName);
      }
      else if (device._targetedState._intensity > 0) {
        await ToyControlCommons.vibrate(d, device._targetedState._intensity);
      }
      else {
        ToyControlCommons.stopPatternInterval(d);
        ToyControlCommons.stopVibrating(d);
      }

      device._currentState = device._targetedState;
      socket.emit('update_state', device);

      li = updateDeviceLi(d, true);
      ul.append(li);
    }
  });
});

function createUserMenu(user) {
  let li = document.createElement("li");
  li.classList.add('list');
  li.setAttribute('id', user._id.value);

  let p = document.createElement("p");
  p.innerHTML = user._pseudo;
  li.appendChild(p);

  let ulToys = document.createElement("ul");
  user._devices.forEach(function (device) {
    ulToys.appendChild(generate_device_list(device));
  });

  li.appendChild(ulToys);
  $('#users-list').append(li);
}

function connect() {
  var pseudo = $('#pseudo').val();
  if (pseudo !== 'undefined') {
    let newUser = {
      pseudo: pseudo,
      room: window.location.pathname.slice(6)
    };
    socket.emit('newUser', newUser);
    $(".identification").hide();
    $(".toys").show();
    $(".users").show();
    $("#toySync").html("<span class='light'>Welcome</span> <span class='bold'>" + pseudo + "</span>");
    $("#users-currentuser").html('<span class="light">You, </span><span class="bold">' + pseudo + '</span>');
  }
}

function start(toyId) {
  socket.emit('change_state', toyId, 1, "");
}

function playPattern(toyId, patternName) {
  socket.emit('change_state', toyId, 1, patternName);
}

function stop(toyId) {
  socket.emit('change_state', toyId, 0, "");
}

function generate_device_list(device) {
  let li = document.createElement("li");
  li.classList.add('list');
  li.appendChild(document.createTextNode(device._device._name));
  var br = document.createElement("br");
  li.appendChild(br);

  if (device._currentState !== undefined && device._currentState._intensity > 0) {
    let button = document.createElement("button");
    button.innerHTML = "Stop";
    button.setAttribute('id', device._id.value);
    button.setAttribute('onclick', 'stop(\'' + device._id.value + '\')');
    button.setAttribute('class', 'c_btn');
    li.appendChild(button);
  }
  else {
    let button = document.createElement("button");
    button.innerHTML = "Start";
    button.setAttribute('id', device._id.value);
    button.setAttribute('onclick', 'start(\'' + device._id.value + '\')');
    button.setAttribute('class', 'c_btn');
    li.appendChild(button);

    let buttonLow = createButton("Low", device, 'playPattern(\'' + device._id.value + '\',' + '\'1\')');
    li.appendChild(buttonLow);

    let buttonMiddle = createButton("Middle", device, 'playPattern(\'' + device._id.value + '\',' + '\'2\')');
    li.appendChild(buttonMiddle);

    let buttonHigh = createButton("High", device, 'playPattern(\'' + device._id.value + '\',' + '\'3\')');
    li.appendChild(buttonHigh);

    let buttonOrgasmic = createButton("Orgasmic", device, 'playPattern(\'' + device._id.value + '\',' + '\'4\')');
    li.appendChild(buttonOrgasmic);
  }

  return li;
}

function createButton(text, device, method) {
  let button = document.createElement("button");
  button.innerHTML = text;
  button.setAttribute('id', device._id.value);
  button.setAttribute('onclick', method);
  button.setAttribute('class', 'c_btn');

  return button;
}

function update_device_list(device) {
  let button = $("#" + device._id.value)[0];

  if (button !== undefined) {
    if (device._vibratingIntensity > 0) {
      button.innerHTML = "Stop";
      button.setAttribute('onclick', 'stop(\'' + device._id.value + '\')');
      button.setAttribute('class', 'c_btn');
    }
    else {
      button.innerHTML = "Start";
      button.setAttribute('onclick', 'start(\'' + device._id.value + '\')');
      button.setAttribute('class', 'c_btn');
    }
  }
  else {
    generate_device_list(device);
  }
}

function generateBasicDeviceLi(device) {
  let li = document.createElement("li");
  li.insertAdjacentHTML('beforeend', '<span class="bold">' + device.Name + '</span>');

  return li;
}

function generateDeviceLi(device, isVibrating) {
  let li = document.createElement("li");
  li.insertAdjacentHTML('beforeend', '<span class="bold">' + device.Name + '</span>');

  if (isVibrating) {
    li.insertAdjacentHTML('beforeend', '<span id=\'' + device.Name.split(' ').join('') + '\' class="light"> - started</span>');
  }
  else {
    li.insertAdjacentHTML('beforeend', '<span id=\'' + device.Name.split(' ').join('') + '\' class="light"> - stopped</span>');
  }

  return li;
}

function updateDeviceLi(device, isVibrating) {
  let spanToy = $('#' + device.Name.split(' ').join(''));
  if (isVibrating) {
    spanToy.text(' - started');
  }
  else {
    spanToy.text(' - stopped');
  }
}

viewInitializer = {
  init: () => {
    let ulHome = $('#toys-devices');
    ulHome.empty();
    let ul = $('#yourdevices');
    ul.empty();
  },
  generateli: (device) => {
    let ulHome = $('#toys-devices');
    let li2 = generateBasicDeviceLi(device);
    ulHome.append(li2);

    let ul = $('#yourdevices');
    let li = generateDeviceLi(device, false);
    ul.append(li);

    $('#devices-title').show();
    $('#button-enterRoom').show();
  },
  removeli: (device) => {
    if ($('#yourdevices li').length <= 0) {
      $('#devices-title').hide();
      $('#button-enterRoom').hide();
    }
  },
  deviceAdded: (device) => {
    socket.emit("devices", ButtplugWrapper.client.Devices);
  },
  connexionLostHandler: (exception, device) => {
    if (exception.message.includes("not available") && device.isFaulty !== true) {
      console.log("device lost");
      sendDevices();
      ToyControlCommons.stopPatternInterval(device);
      device.isFaulty = true;
      ButtplugWrapper.connectToys();
    }
  }
}

function copy() {
  var copyText = document.getElementById("room-link");
  copyText.select();
  document.execCommand("copy");
  $("#copybtnlabel").html('done');
  setTimeout(() => $("#copybtnlabel").html('file_copy'), 1500);
}

ButtplugWrapper.init(viewInitializer);
var syncButton = $("#buttplug-local-button");
syncButton.on("click", function (evt) { ButtplugWrapper.connectToys(); });
$("#room-link").val(window.location);
$("#copybtn").on("click", copy);

