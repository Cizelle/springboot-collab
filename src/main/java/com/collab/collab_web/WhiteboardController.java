package com.collab.collab_web;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;

@Controller
public class WhiteboardController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Receive drawing events from a client and broadcast to the same room
    @MessageMapping("/{roomId}/draw")
    public void draw(@DestinationVariable String roomId, Map<String, Object> payload) {
        // Forward JSON data (x, y, user, color, size, etc.) to all users in the room
        messagingTemplate.convertAndSend("/topic/" + roomId + "/whiteboard", payload);
    }
}
