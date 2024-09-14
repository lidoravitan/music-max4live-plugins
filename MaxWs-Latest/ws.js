const max = require("max-api");

try {
  const { Server } = require("socket.io");

  const io = new Server({
    cors: "*",
  });

  let lastId;
  let isPlaying = false;
  let length = 4;

  io.on(
    "connection",
    withGuard("[Connection Guard]", (socket) => {
      max.post("connection", io.engine.clientsCount);
      max.outlet("init");

      socket.on(
        "play",
        withGuard("[Play Guard]", ({ scene, id }) => {
          lastId = id;
          max.outlet("liveset:play", Number(scene) - 1);
        })
      );

      socket.on(
        "request:set_tempo",
        withGuard("[Set Tempo Guard]", (tempo) => {
          max.outlet("transport:tempo", tempo);
        })
      );

      socket.on(
        "disconnect",
        withGuard("[Disconnect Guard]", () => {
          max.post("disconnection");
        })
      );

      socket.on(
        "request:sync",
        withGuard("[Sync Guard]", () => {
          max.post("request:sync", isPlaying);
          socket.emit("response.sync", isPlaying);
        })
      );

      socket.on(
        "transport:toggle",
        withGuard("[Transport Toggle Guard]", () => {
          max.post("transport:toggle", isPlaying === 0 ? 1 : 0);
          max.outlet("transport:toggle", isPlaying === 0 ? 1 : 0);
        })
      );
    })
  );

  max.addHandler(
    "playing_position",
    withGuard("[Playing Position Guard]", (playing_position) => {
      const lengthMod = length;
      if (lastId && playing_position === lengthMod - 1) {
        io.sockets.emit(lastId);
        lastId = null;
      }
    })
  );

  max.addHandler(
    "playing_position",
    withGuard("[Playing Position Guard 2]", (playing_position) => {
      if (playing_position === 0) {
        io.sockets.emit("playing:firstbeat");
      }
    })
  );

  // Listen to change length event
  max.addHandler(
    "changeLength",
    withGuard("[Change Length Guard]", (value) => {
      length = value;
    })
  );

  // Listen to play/stop status
  max.addHandler(
    "status",
    withGuard("[Status Guard]", (status) => {
      max.post("Update Status", status, status === 1 ? "Playing" : "Stopped");
      isPlaying = status;
      io.sockets.emit("status", status);
    })
  );

  // Handle change tempo event
  max.addHandler(
    "tempo",
    withGuard("[Tempo Guard]", (tempo) => {
      max.post("Send Tempo");
      io.sockets.emit("tempo", tempo);
    })
  );

  io.listen(3000);
} catch (e) {
  max.post("App Failure");
}

function withGuard(context, cb) {
  return function (value) {
    try {
      cb(value);
    } catch (e) {
      max.post("error occured", context);
    }
  };
}
