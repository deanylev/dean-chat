var socket = io();
var loggedIn;
var userList;

function login(id, name) {
  if (!loggedIn) {
    let user = {
      id: id,
      name: name
    };

    socket.emit('new user', user);

    $('.login').addClass('hide');
    $('.signed-in').removeClass('hide');

    localStorage.setItem('user', JSON.stringify(user));

    loggedIn = true;
  }
}

if (localStorage.getItem('user')) {

  let user = JSON.parse(localStorage.getItem('user'));
  login(user.id, user.name);

}

$('#submit-name').click(function() {
  login(Math.floor(Date.now() * Math.random()), $('#name').val());
});

$('#message').keypress(function(e) {
  if (e.keyCode === 13) {
    socket.emit('chat message', {
      user: JSON.parse(localStorage.getItem('user')).id,
      text: $(this).val()
    });
    $(this).val('');
  }
});

$('#name').submit(function() {
  localStorage.setItem('username', $(this).find('input').val());
});

socket.on('user list', function(list) {
  $('#online-users').empty();

  userList = list;

  $.each(list, function(key, val) {
    if (val.status === 'online') {
      $('#online-users').append(`<p>${val.name}</p>`);
    }
  });
});

socket.on('all messages', function(messages) {
  $.each(messages, function(key, val) {
    switch (val.type) {
      case 'chat':
        let text = document.createTextNode(val.text);
        $('#messages').append(`<p><b>${userList[val.user].name}:</b>&nbsp;</p>`);
        $('#messages').find('p:last').append(text);
        break;
      case 'joined':
        $('#messages').append(`<p class="grey-text text-darken-3"><em>${userList[val.user].name} joined</em></p>`);
        break;
      case 'left':
        $('#messages').append(`<p class="grey-text text-darken-3"><em>${userList[val.user].name} left</em></p>`);
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
  $('#messages').append(`<p class="grey-text text-darken-3"><em>${userList[user].name} joined</em></p>`);
});

socket.on('user left', function(user) {
  $('#messages').append(`<p class="grey-text text-darken-3"><em>${userList[user].name} left</em></p>`);
});

if (localStorage.getItem('username')) {
  $('.main').removeClass('hide');
} else {
  $('.name').removeClass('hide');
}
