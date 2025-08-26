let stompClient = null;
let username = prompt("Enter your username:") || "Anonymous";

function connect() {
  const socket = new SockJS('/ws');
  stompClient = Stomp.over(socket);

  stompClient.connect({}, (frame) => {
    console.log("Connected: " + frame);

    // Chat
    stompClient.subscribe('/topic/messages', (message) => {
      showMessage(message.body);
    });

    // Whiteboard
    stompClient.subscribe('/topic/whiteboard', (msg) => {
      const data = JSON.parse(msg.body);
      drawOnCanvas(data.x, data.y, false);
    });

    // Document
    stompClient.subscribe('/topic/document', (msg) => {
      const data = JSON.parse(msg.body);
      const docArea = document.getElementById("doc");
      if (docArea.value !== data.content) {
        docArea.value = data.content;
      }
    });

    // Clipboard
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

// --- Whiteboard ---
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
let drawing = false;

canvas.addEventListener("mousedown", () => drawing = true);
canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mousemove", draw);

function draw(e) {
  if (!drawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  drawOnCanvas(x, y, true);
  stompClient.send("/app/draw", {}, JSON.stringify({ x, y }));
}

function drawOnCanvas(x, y, isLocal) {
  ctx.fillStyle = isLocal ? "black" : "red";
  ctx.fillRect(x, y, 2, 2);
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

connect();
