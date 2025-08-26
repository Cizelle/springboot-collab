// --- Setup ---
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get("roomId");
const username = urlParams.get("user") || "Anonymous";
document.getElementById("roomInfo").innerText = `Room: ${roomId} | User: ${username}`;

let stompClient = null;
let tool = "brush";

function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "block";
}
showSection("chat"); // default

// --- Connect ---
function connect() {
  const socket = new SockJS('/ws');
  stompClient = Stomp.over(socket);

  stompClient.connect({}, (frame) => {
    console.log("Connected:", frame);

    // Chat
    stompClient.subscribe(`/topic/${roomId}/chat`, (msg) => {
      const data = JSON.parse(msg.body);
      showMessage(`${data.user}: ${data.content}`);
    });

    // Whiteboard
    stompClient.subscribe(`/topic/${roomId}/whiteboard`, (msg) => {
      const data = JSON.parse(msg.body);
      drawLine(data.x0, data.y0, data.x1, data.y1, data.tool, false);
    });

    // Document
    stompClient.subscribe(`/topic/${roomId}/document`, (msg) => {
      const data = JSON.parse(msg.body);
      const docArea = document.getElementById("doc");
      if (docArea.value !== data.content) {
        docArea.value = data.content;
      }
    });

    // Clipboard
    stompClient.subscribe(`/topic/${roomId}/clipboard`, (msg) => {
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
    });
  });
}

// --- Chat ---
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

// --- Whiteboard ---
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
let drawing = false, lastX = 0, lastY = 0;

function setTool(t) { tool = t; }

canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  const rect = canvas.getBoundingClientRect();
  lastX = e.clientX - rect.left;
  lastY = e.clientY - rect.top;
});
canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  drawLine(lastX, lastY, x, y, tool, true);
  stompClient.send(`/app/${roomId}/whiteboard`, {}, JSON.stringify({ x0: lastX, y0: lastY, x1: x, y1: y, tool }));
  lastX = x;
  lastY = y;
});

function drawLine(x0, y0, x1, y1, tool, isLocal) {
  ctx.strokeStyle = (tool === "eraser") ? "white" : "black";
  ctx.lineWidth = (tool === "eraser") ? 20 : 2;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.closePath();
}

// --- Document ---
const docArea = document.getElementById("doc");
docArea.addEventListener("input", () => {
  stompClient.send(`/app/${roomId}/document`, {}, JSON.stringify({ user: username, content: docArea.value }));
});

// --- Clipboard ---
function copyFromClipboard() {
  navigator.clipboard.read().then(items => {
    for (let item of items) {
      if (item.types.includes("image/png")) {
        item.getType("image/png").then(blob => {
          const reader = new FileReader();
          reader.onload = () => {
            stompClient.send(`/app/${roomId}/clipboard`, {}, JSON.stringify({
              user: username, type: "image", data: reader.result
            }));
          };
          reader.readAsDataURL(blob);
        });
      } else if (item.types.includes("text/plain")) {
        item.getType("text/plain").then(blob => {
          blob.text().then(text => {
            stompClient.send(`/app/${roomId}/clipboard`, {}, JSON.stringify({
              user: username, type: "text", data: text
            }));
          });
        });
      }
    }
  }).catch(err => {
    console.error("Clipboard read failed:", err);
    alert("Clipboard access denied.");
  });
}

connect();
