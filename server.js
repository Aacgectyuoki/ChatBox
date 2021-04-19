var express = require('express');
var app = express();
const mongo = require("mongodb").MongoClient;
var server = app.listen(8810);
const client = require("socket.io")(server);

// Connect to mongo
mongo.connect("mongodb://localhost:27017/nameAndMessage", function(err, db) {
  if (err) {
    throw err;
  }

  console.log("MongoDB successfully connected...");

  // Connect to Socket.io
  client.on("connection", function(socket) {
    let chat = db.collection("nameandmessages");

    // Create function to send status
    const sendStatus = function(s) {
      socket.emit("status", s);
    };

    // Get chats from mongo collection
    chat
      .find()
      .limit(100)
      .sort({ _id: 1 })
      .toArray(function(err, res) {
        if (err) {
          throw err;
        }

        // Emit the messages
        socket.emit("output", res);
      });

    // Handle input events
    socket.on("input", function(data) {
      let name = data.name;
      let message = data.message;

      // Check for name and message
      if (name == "" || message == "") {
        // Send error status
        sendStatus("Please enter a name and message");
      } else {
        // Insert message
        chat.insert({ name: name, message: message }, function() {
          client.emit("output", [data]);

          // Send status object
          sendStatus({
            message: "Message sent",
            clear: true
          });
        });
      }
    });

    // Handle clear
    socket.on("clear", function(data) {
      // Remove all chats from collection
      chat.remove({}, function() {
        // Emit cleared
        socket.emit("cleared");
      });
    });
  });
});