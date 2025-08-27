/* ================== Variables ================== */
/* ================== Variables ================== */
let stompClient = null;
const params = new URLSearchParams(window.location.search);
let username = params.get("user") || "Anonymous";
let roomId = params.get("roomId"); // <-- IMPORTANT: must match index.js

let userColorMap = {};
let colors = ["#e74c3c","#3498db","#2ecc71","#f39c12","#9b59b6","#1abc9c"];

let lastX = null;
let lastY = null;


/* ================== Connect ================== */
function connect() {
  const socket = new SockJS('/ws');
  stompClient = Stomp.over(socket);

  stompClient.connect({}, (frame) => {
    console.log("Connected: " + frame);
    document.getElementById("roomInfo").textContent = `Room: ${roomId}`;

    // --- Subscriptions ---
    stompClient.subscribe(`/topic/${roomId}/chat`, (msg) => {
  const data = JSON.parse(msg.body);
  showMessage(`${data.user}: ${data.content}`);
});

    stompClient.subscribe(`/topic/${roomId}/whiteboard`, (msg) => handleWhiteboard(msg));
    stompClient.subscribe(`/topic/${roomId}/document`, (msg) => handleDocument(msg));
    stompClient.subscribe(`/topic/${roomId}/docCursor`, (msg) => handleDocCursor(msg));
    stompClient.subscribe(`/topic/${roomId}/clipboard`, (msg) => handleClipboard(msg));
    stompClient.subscribe(`/topic/${roomId}/presence`, (msg) => handlePresence(msg));

    // --- Announce presence ---
    stompClient.send(`/app/${roomId}/presence`, {}, JSON.stringify({
      type: "JOIN",
      user: username
    }));

    window.addEventListener("beforeunload", () => {
      stompClient.send(`/app/${roomId}/presence`, {}, JSON.stringify({
        type: "LEAVE",
        user: username
      }));
    });
  });
}

/* ================== Presence ================== */
let onlineUsers = [];

function handlePresence(msg) {
  const data = JSON.parse(msg.body);

  if (data.type === "JOIN") {
    if (!onlineUsers.includes(data.user)) {
      onlineUsers.push(data.user);
      if (!userColorMap[data.user]) {
        userColorMap[data.user] = colors[onlineUsers.length % colors.length];
      }
    }
  } else if (data.type === "LEAVE") {
    onlineUsers = onlineUsers.filter(u => u !== data.user);
  }

  renderUserList();
}

function renderUserList() {
  const ul = document.getElementById("userList");
  ul.innerHTML = "";
  onlineUsers.forEach(user => {
    const li = document.createElement("li");
    li.textContent = user;
    li.style.color = userColorMap[user] || "black";
    ul.appendChild(li);
  });
}

/* ================== Chat ================== */
function sendMessage() {
  const msg = document.getElementById("msgInput").value;
  stompClient.send(`/app/${roomId}/chat`, {}, JSON.stringify({ user: username, content: msg }));
  document.getElementById("msgInput").value = "";
}

function showMessage(msg) {
  const chat = document.getElementById("chatBox");
  const p = document.createElement("p");
  p.textContent = msg;
  chat.appendChild(p);
  chat.scrollTop = chat.scrollHeight;
}

/* ================== Whiteboard ================== */
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
let drawing = false;
let tool = "brush";

let currentColor = document.getElementById("colorPicker").value;
let currentSize = document.getElementById("brushSize").value;

document.getElementById("colorPicker").addEventListener("input", (e) => currentColor = e.target.value);
document.getElementById("brushSize").addEventListener("input", (e) => currentSize = e.target.value);

function setTool(t) {
  tool = t;
}

canvas.addEventListener("mousedown", () => drawing = true);
canvas.addEventListener("mouseup", () => {
  drawing = false;
  lastX = null;
  lastY = null;
  removeCanvasCursorLabel(username);
});

canvas.addEventListener("mousemove", draw);

function draw(e) {
  if (!drawing) return;

  const x = e.offsetX;
  const y = e.offsetY;

  // first move — no previous point yet
  if (lastX === null || lastY === null) {
    lastX = x;
    lastY = y;
  }

  const colorToUse = (tool === "eraser" ? "#ffffff" : currentColor);

  // send stroke data to backend
  stompClient.send(`/app/${roomId}/draw`, {}, JSON.stringify({
    user: username,
    x, y,
    lastX, lastY,
    color: colorToUse,
    size: currentSize
  }));

  // draw locally
  drawOnCanvas(x, y, lastX, lastY, colorToUse, currentSize, username);

  // update last position
  lastX = x;
  lastY = y;
}

function handleWhiteboard(msg) {
  const data = JSON.parse(msg.body);
  if (data.user !== username) {
    drawOnCanvas(
      data.x,
      data.y,
      data.lastX || data.x,
      data.lastY || data.y,
      data.color,
      data.size,
      data.user
    );
    updateCursorLabelCanvas(data.user, data.x, data.y);
  }
}

function drawOnCanvas(x, y, lastX, lastY, color, size, user) {
  ctx.strokeStyle = color || "#000000";
  ctx.lineWidth = parseInt(size, 10) * 2;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();
}



/* ================== Document ================== */
const docArea = document.getElementById("doc");

function handleDocument(msg) {
  const data = JSON.parse(msg.body);
  if (data.user !== username) {
    docArea.innerHTML = data.content;
  }
}

// Send cursor positions
docArea.addEventListener("keyup", sendCursor);
docArea.addEventListener("mouseup", sendCursor);

function sendCursor() {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const range = sel.getRangeAt(0);

  stompClient.send(`/app/${roomId}/docCursor`, {}, JSON.stringify({
    user: username,
    cursor: range.startOffset
  }));
}

// Show live cursor of other users
function handleDocCursor(msg) {
  const data = JSON.parse(msg.body);
  if (data.user !== username) {
    showUserCursor(data.user, data.cursor);
  }
}

function showUserCursor(user, cursorPos) {
  const doc = document.getElementById("doc");
  let cursorEl = document.getElementById("cursor-" + user);

  if (!cursorEl) {
    cursorEl = document.createElement("div");
    cursorEl.id = "cursor-" + user;
    cursorEl.style.position = "absolute";
    cursorEl.style.width = "2px";
    cursorEl.style.height = "1em";
    cursorEl.style.background = userColorMap[user] || "red";
    cursorEl.style.zIndex = 2000;

    const label = document.createElement("div");
    label.textContent = user;
    label.style.position = "absolute";
    label.style.top = "-16px";
    label.style.fontSize = "12px";
    label.style.color = "white";
    label.style.padding = "2px 4px";
    label.style.borderRadius = "4px";
    label.style.background = userColorMap[user] || "red";

    cursorEl.appendChild(label);
    document.body.appendChild(cursorEl);
  }

  const range = document.createRange();
  if (doc.firstChild) {
    range.setStart(doc.firstChild, Math.min(cursorPos, doc.firstChild.length));
    range.collapse(true);
    const rect = range.getBoundingClientRect();
    const docRect = doc.getBoundingClientRect();
    cursorEl.style.left = (rect.left - docRect.left) + "px";
    cursorEl.style.top = (rect.top - docRect.top) + "px";
  }
}

// Handle text inserts with highlight
docArea.addEventListener("beforeinput", (e) => {
  if (e.inputType === "insertText") {
    const text = e.data;
    const span = document.createElement("span");
    span.textContent = text;
    span.style.backgroundColor = (userColorMap[username] || "#ddd") + "33";
    span.style.borderRadius = "2px";

    const sel = window.getSelection();
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(span);

    // Move cursor after inserted span
    range.setStartAfter(span);
    range.setEndAfter(span);
    sel.removeAllRanges();
    sel.addRange(range);

    // Send updated content to server
    stompClient.send(`/app/${roomId}/doc`, {}, JSON.stringify({
      user: username,
      content: docArea.innerHTML
    }));

    e.preventDefault();
  }
});

/* ================== Clipboard ================== */
function copyFromClipboard() {
  navigator.clipboard.read().then(items => {
    for (let item of items) {
      if (item.types.includes("image/png")) {
        item.getType("image/png").then(blob => {
          const reader = new FileReader();
          reader.onload = () => {
            stompClient.send(`/app/${roomId}/clipboard`, {}, JSON.stringify({
              user: username,
              type: "image",
              data: reader.result
            }));
          };
          reader.readAsDataURL(blob);
        });
      } else if (item.types.includes("text/plain")) {
        item.getType("text/plain").then(blob => {
          blob.text().then(text => {
            stompClient.send(`/app/${roomId}/clipboard`, {}, JSON.stringify({
              user: username,
              type: "text",
              data: text
            }));
          });
        });
      }
    }
  }).catch(err => {
    console.error("Clipboard read failed:", err);
    alert("Clipboard access denied. Please allow permissions.");
  });
}

function handleClipboard(msg) {
  const data = JSON.parse(msg.body);
  const box = document.getElementById("clipboardBox");

  const div = document.createElement("div");
  div.style.marginBottom = "10px";

  if (data.type === "text") {
    div.innerHTML = `<b>${data.user}:</b> ${data.data}`;
  } else if (data.type === "image") {
    div.innerHTML = `<b>${data.user}:</b><br><img src="${data.data}" style="max-width:300px;">`;
  }

  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

/* ================== Sections ================== */
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec => sec.style.display = "none");
  document.getElementById(id).style.display = "block";
}

/* ================== Init ================== */
connect();
showSection("chat");
