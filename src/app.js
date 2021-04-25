import express from "express";
import { Server } from "socket.io";
import cors from "cors";
import ip from "ip";
import mysql from "mysql";

// App setup
const PORT = 5050;
const app = express();
app.use(cors());
const ipAddress = ip.address();

// Setup MySql
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "absen_mpt",
});

connection.connect(function (err) {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }

  console.log("MYSQL connected as id " + connection.threadId);
});

// Listen to the port
const server = app.listen(process.env.PORT || PORT, "0.0.0.0", (err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log(`Websocket Server listening on port ${PORT}!`);
  console.log(`Network access via: http://${ipAddress}:${PORT}`);
});

// SocketIO setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("a user connected");
  io.emit("chat message", { content: "A new user connected to the chat" });
  socket.broadcast.emit("req_config", socket.id);
});

// Application Routes
app.use(express.static("public"));
app.get("/", async (req, res) => {
  res.status(200).json({ value: "Connection ok" });
});
app.get("/api/fetch/:nim", (req, res) => {
  console.log("connection made");
  let sql = "SELECT * FROM testing_table WHERE nim = '" + req.params.nim + "'";
  let query = connection.query(sql, (err, results) => {
    if (err) {
      console.log(err);
      res.status(200).json({ status: 200, error: null, response: {} });
    }
    res.setHeader("Content-Type", "application/json");
    res.status(200).json({ status: 200, error: null, response: results[0] });
    // io.emit("request_data", { value: results[0] });
  });
});

app.put("/api/absen/:nim", (req, res) => {
  console.log("absen updated");
  let sql =
    "update testing_table set sudah_ambil = 1 where nim = '" +
    req.params.nim +
    "'";
  let query = connection.query(sql, function (err, result) {
    if (err) {
      console.log(err);
    }
    console.log(
      result.affectedRows + " record(s) updated || nim =" + req.params.nim
    );
  });

  sql = "SELECT * FROM testing_table WHERE nim = '" + req.params.nim + "'";
  query = connection.query(sql, (err, results) => {
    if (err) {
      console.log(err);
    }
    io.emit("request_data", { value: results[0] });
  });
});
