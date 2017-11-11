var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var userList = {};
var messageList = [];

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static(__dirname + '/public'));

io.on('connection', function(socket) {
  var userId;

  socket.on('new user', function(user) {
    userId = user.id;
    userList[user.id] = {
      name: user.name,
      status: 'online'
    }

    io.emit('user list', userList);
    socket.emit('all messages', messageList);
    io.emit('user joined', userId);

    messageList.push({
      type: 'joined',
      user: userId
    });
  });

  socket.on('chat message', function(message) {
    messageList.push({
      type: 'chat',
      user: message.user,
      text: message.text
    });

    io.emit('chat message', message);
  });

  socket.on('name change', function(user) {
    userList[user.id].name = user.name;

    io.emit('user list', userList);
    io.emit('all messages', messageList);
  });

  socket.on('disconnect', function() {
    if (userId) {
      userList[userId].status = 'offline';

      messageList.push({
        type: 'left',
        user: userId
      });

      io.emit('user list', userList);
      io.emit('user left', userId);
    }
  });
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});
