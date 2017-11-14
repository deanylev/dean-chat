var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var userList = {};
var messageList = [];
var currentlyTyping = [];

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
      status: 'online',
      statusSince: Date.now()
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
    var currentName = userList[user.id].name;
    var text = `${currentName} changed their name to ${user.name}`;

    userList[user.id].name = user.name;

    messageList.push({
      type: 'change',
      user: user.id,
      text: `${currentName} changed their name to ${user.name}`
    });

    io.emit('user list', userList);
    io.emit('all messages', messageList);
    io.emit('new name', text, user.id);
  });

  socket.on('currently typing', function(user) {
    if (currentlyTyping.indexOf(user) <= -1) {
      currentlyTyping.push(user);
    }

    io.emit('currently typing', currentlyTyping);
  });

  socket.on('stopped typing', function(user) {
    currentlyTyping.splice(currentlyTyping.indexOf(user), 1);

    io.emit('currently typing', currentlyTyping);
  });

  socket.on('disconnect', function() {
    if (userId) {
      userList[userId].status = 'offline';
      userList[userId].statusSince = Date.now();

      if (currentlyTyping.indexOf(userList[userId].name) > -1) {
        currentlyTyping.splice(userList[userId].name, 1);
        io.emit('currently typing', currentlyTyping);
      }

      messageList.push({
        type: 'left',
        user: userId
      });

      socket.broadcast.emit('user list', userList);
      socket.broadcast.emit('user left', userId);
    }
  });
});

http.listen(process.env.PORT || 3000, function() {
  console.log('listening on *:3000');
});
