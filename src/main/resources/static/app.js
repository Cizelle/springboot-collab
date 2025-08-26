let stompClient = null;
let username = prompt("Enter your username:") || "Anonymous";

// --- Section Switching ---
function showSection(id) {
  document.querySelectorAll(".section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

// --- WebSocket connect ---
function connect() {
  const socket = new SockJS('/ws');
  stompClient = Stomp.over(socket);

  stompClient.connect({}, (frame) => {
    console.log("Connected: " + frame);

    // Chat subscription
    stompClient.subscribe('/topic/messages', (message) => {
      showMessage(message.body);
    });

    // Whiteboard subscription
    stompClient.subscribe('/topic/whiteboard', (msg) => {
      const data = JSON.parse(msg.body);
      drawOnCanvas(data.x, data.y, false);
    });

    // Document subscription
    stompClient.subscribe('/topic/document', (msg) => {
      const data = JSON.parse(msg.body);
      const docArea = document.getElementById("doc");
      if (docArea.value !== data.content) {
        docArea.value = data.content;
      }
    });

    // Clipboard subscription
    stompClient.subscribe('/topic/clipboard', (msg) => {
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
  stompClient.send("/app/chat", {}, JSON.stringify({ user: username, content: msg }));
  document.getElementById("msgInput").value = "";
}

function showMessage(msg) {
  const chat = document.getElementById("chat");
  const p = document.createElement("p");
  p.textContent = msg;
  chat.appendChild(p);
  chat.scrollTop = chat.scrollHeight;
}

// --- Document ---
const docArea = document.getElementById("doc");
docArea.addEventListener("input", () => {
  stompClient.send("/app/doc", {}, JSON.stringify({ user: username, content: docArea.value }));
});

// --- Clipboard ---
function copyFromClipboard() {
  navigator.clipboard.read().then(items => {
    for (let item of items) {
      if (item.types.includes("image/png")) {
        item.getType("image/png").then(blob => {
          const reader = new FileReader();
          reader.onload = () => {
            stompClient.send("/app/clipboard", {}, JSON.stringify({
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
            stompClient.send("/app/clipboard", {}, JSON.stringify({
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

// --- Whiteboard ---
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
let drawing = false;

// Brush settings
let brushColor = "#000000";
let brushSize = 2;
let erasing = false;

document.getElementById("colorPicker").addEventListener("input", (e) => {
  brushColor = e.target.value;
  erasing = false; // switch back to brush if picking color
});
document.getElementById("sizePicker").addEventListener("input", (e) => {
  brushSize = e.target.value;
});

canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});
canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mouseout", () => drawing = false);
canvas.addEventListener("mousemove", draw);

function draw(e) {
  if (!drawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  drawOnCanvas(x, y, brushColor, brushSize, erasing, true);
  stompClient.send("/app/draw", {}, JSON.stringify({ x, y, color: brushColor, size: brushSize, eraser: erasing }));
}

function drawOnCanvas(x, y, color, size, isEraser, isLocal) {
  ctx.strokeStyle = isEraser ? "#FFFFFF" : (color || "black");
  ctx.lineWidth = size;
  ctx.lineCap = "round";

  ctx.lineTo(x, y);
  ctx.stroke();
}

// Clear board (local + sync)
function clearBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stompClient.send("/app/draw", {}, JSON.stringify({ clear: true }));
}

// Eraser toggle
function toggleEraser() {
  erasing = !erasing;
}

// Subscription update
stompClient.subscribe('/topic/whiteboard', (msg) => {
  const data = JSON.parse(msg.body);

  if (data.clear) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  } else {
    drawOnCanvas(data.x, data.y, data.color, data.size, data.eraser, false);
  }
});


connect();
