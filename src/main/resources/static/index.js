function createRoom() {
  const username = document.getElementById("username").value || "Anonymous";
  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase(); 
  window.location.href = `room.html?roomId=${roomId}&user=${username}`;
}

function joinRoom() {
  const username = document.getElementById("username").value || "Anonymous";
  const roomId = document.getElementById("roomId").value.trim().toUpperCase();
  if (!roomId) {
    alert("Please enter a Room ID or create one.");
    return;
  }
  window.location.href = `room.html?roomId=${roomId}&user=${username}`;
}
