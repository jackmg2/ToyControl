var socket = io.connect();
var users = new Array();
var currentUser;


socket.on('identity', function (user) {
  currentUser = user;
});

socket.on('users', function (data) {
  console.log('data: ' + data);
  //First init or user left
  if (users.length <= 0 || users.length > data.users.length) {
    $('#users-list').empty();
    data.users.forEach(function (user) {
      if (user._id.value != currentUser._id.value) {
        createUserMenu(user);
      }
      else {

      }
    });
  }
  //New user
  else if (users.length < data.users.length) {
    var diff = data.users.filter(du => !users.some(u => u._id.value == du._id.value));
    diff.forEach(function (user) {
      if (user._id.value != currentUser._id.value) {
        createUserMenu(user);
      }
      else {

      }
    });
  }
  //Device update
  else {
    $('#toys-list').empty();
    $("#users-list").each(function () {
      var id = $("#users-list li").attr('id');

      var user = data.users.filter(u => u._id.value == id)[0];
      user._devices.forEach(function (device) {
        update_device_list(device);
      });
    });
  }

  users = data.users;
  console.log('users: ' + users);
});


socket.on('start_local_toy', function (device) {
  let ul = $('#yourdevices');
  ButtplugWrapper.client.Devices.forEach(async function (d) {
    if (d.Name == device._name) {
      await ButtplugWrapper.vibrate(d, 1.0);
    }
    li = updateDeviceLi(d, true);
    ul.append(li);
  });
});

socket.on('stop_local_toy', function (device) {
  let ul = $('#yourdevices');
  ButtplugWrapper.client.Devices.forEach(async function (d) {
    if (d.Name == device._name) {
      await ButtplugWrapper.vibrate(d, 0.0);
    }

    li = updateDeviceLi(d, false);
    ul.append(li);
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
    $(".users").hide();
    $("#toySync").html("<span class='light'>Welcome</span> <span class='bold'>" + pseudo + "</span>");
    $("#users-currentuser").html('<span class="light">You, </span><span class="bold">' + pseudo + '</span>');
  }
}

function start(toyId) {
  socket.emit('start_toy', toyId);
}

function stop(toyId) {
  socket.emit('stop_toy', toyId);
}

function sendDevices() {
  console.log('sendDevices():' + ButtplugWrapper.client.Devices);
  socket.emit("devices", ButtplugWrapper.client.Devices);
  $(".identification").hide();
  $(".toys").hide();
  $(".users").show();
}

function connectWithoutToys() {
  console.log('connectWithoutToys()');
  socket.emit("devices", null);
  $(".identification").hide();
  $(".toys").hide();
  $(".users").show();
}

function generate_device_list(device) {
  let li = document.createElement("li");
  li.classList.add('list');
  li.appendChild(document.createTextNode(device._device._name));

  if (device._vibratingIntensity > 0) {
    let button = document.createElement("button");
    button.innerHTML = "Stop";
    button.setAttribute('id', device._id.value);
    button.setAttribute('onclick', 'stop(\'' + device._id.value + '\')');
    button.setAttribute('class', 'toy btn');
    li.appendChild(button);
  }
  else {
    let button = document.createElement("button");
    button.innerHTML = "Start";
    button.setAttribute('id', device._id.value);
    button.setAttribute('onclick', 'start(\'' + device._id.value + '\')');
    button.setAttribute('class', 'toy btn');
    li.appendChild(button);
  }

  return li;
}

function update_device_list(device) {
  let button = $("#" + device._id.value)[0];

  if (device._vibratingIntensity > 0) {
    button.innerHTML = "Stop";
    button.setAttribute('onclick', 'stop(\'' + device._id.value + '\')');
    button.setAttribute('class', 'toy btn');
  }
  else {
    button.innerHTML = "Start";
    button.setAttribute('onclick', 'start(\'' + device._id.value + '\')');
    button.setAttribute('class', 'toy btn');
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
  connexionLostHandler: (exception) => {
    if (exception.message.includes("not available")) {
      viewInitializer.removeli(device);
      console.log("Device lost.");
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