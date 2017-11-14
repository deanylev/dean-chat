var socket = io();
var loggedIn;
var userList;
var lastTyped;

function login(id, name) {
  if (!loggedIn) {
    let user = {
      id: id,
      name: name
    };

    socket.emit('new user', user);

    $('.login').addClass('hide');
    $('.signed-in').removeClass('hide');
    $('#username').text(user.name);

    localStorage.setItem('user', JSON.stringify(user));

    loggedIn = true;
  }
}

function logout() {
  if (loggedIn) {
    socket.disconnect();

    $('.login').removeClass('hide');
    $('.signed-in').addClass('hide');
    $('#username').empty();

    localStorage.removeItem('user');

    loggedIn = false;

    socket.connect();
  }
}

$('#logout').click(logout);

$('#rename-modal').modal();

$('#rename-modal button').click(function() {
  let name = $('#rename-modal input').val();

  if (name) {
    let user = JSON.parse(localStorage.getItem('user'));
    user.name = name;

    socket.emit('name change', user);

    localStorage.setItem('user', JSON.stringify(user));

    logout();
    login(user.id, user.name);

  }

  $('#rename-modal').modal('close');
});

if (localStorage.getItem('user')) {
  let user = JSON.parse(localStorage.getItem('user'));
  login(user.id, user.name);
}

$('#submit-name').click(function() {
  login(Math.floor(Date.now() * Math.random()), $('#name').val());
});

$('#message').keypress(function(e) {
  if ($(this).val() && e.keyCode === 13) {
    socket.emit('chat message', {
      user: JSON.parse(localStorage.getItem('user')).id,
      text: $(this).val()
    });

    $(this).val('');
  }
});

$('#message').keydown(function(e) {
  if (e.keyCode !== 13) {
    lastTyped = Date.now();
    socket.emit('currently typing', JSON.parse(localStorage.getItem('user')).name);
  }
});

$('#message').keyup(function(e) {
  if (e.keyCode !== 13) {
    setTimeout(function() {
      if (Date.now() - lastTyped >= 1999) {
        socket.emit('stopped typing', JSON.parse(localStorage.getItem('user')).name);
      }
    }, 2000)
  }
});

socket.on('currently typing', function(array) {
  $('#typing').empty();

  let index = array.indexOf(JSON.parse(localStorage.getItem('user')).name);
  if (index > -1) {
    array.splice(index, 1);
  }

  let word = array.length === 1 ? 'is' : 'are';
  if (array.length) {
    $('#typing').text(`${array.join(' and ')} ${word} typing...`);
  }
});

$('#name').submit(function() {
  localStorage.setItem('username', $(this).find('input').val());
});

socket.on('user list', function(list) {
  $('.user-list').empty();

  userList = list;

  $.each(list, function(key, val) {
    $(`#${val.status}-users`).append(`<p class="tooltipped" data-position="bottom" data-delay="50" data-tooltip="Since ${moment(val.statusSince).format("MMM DD YYYY [at] hh:mm a")}">${val.name}</p>`);
    $('.material-tooltip').remove();
    $('.tooltipped').tooltip();
  });
});

socket.on('all messages', function(messages) {
  $('#messages').empty();
  $.each(messages, function(key, val) {
    switch (val.type) {
      case 'chat':
        let text = document.createTextNode(val.text);
        $('#messages').append(`<p><b>${userList[val.user].name}:</b>&nbsp;</p>`);
        $('#messages').find('p:last').append(text);
        break;
      case 'joined':
        if (val.user !== JSON.parse(localStorage.getItem('user')).id) {
          $('#messages').append(`<p class="grey-text text-darken-3"><em>${userList[val.user].name} joined</em></p>`);
        }
        break;
      case 'left':
        if (val.user !== JSON.parse(localStorage.getItem('user')).id) {
          $('#messages').append(`<p class="grey-text text-darken-3"><em>${userList[val.user].name} left</em></p>`);
        }
        break;
      case 'change':
        if (val.user !== JSON.parse(localStorage.getItem('user')).id) {
          $('#messages').append(`<p class="grey-text text-darken-3"><em>${val.text}</em></p>`);
        }
        break;
    }
  });
});

socket.on('chat message', function(message) {
  let text = document.createTextNode(message.text);
  $('#messages').append(`<p><b>${userList[message.user].name}:</b>&nbsp;</p>`);
  $('#messages').find('p:last').append(text);
});

socket.on('user joined', function(user) {
  if (user !== JSON.parse(localStorage.getItem('user')).id) {
    $('#messages').append(`<p class="grey-text text-darken-3"><em>${userList[user].name} joined</em></p>`);
  }
});

socket.on('user left', function(user) {
  if (user !== JSON.parse(localStorage.getItem('user')).id) {
    $('#messages').append(`<p class="grey-text text-darken-3"><em>${userList[user].name} left</em></p>`);
  }
});

socket.on('name change', function(text, user) {
  if (user !== JSON.parse(localStorage.getItem('user')).id) {
    $('#messages').append(`<p class="grey-text text-darken-3"><em>${text}</em></p>`);
  }
});
