package com.collab.collab_web;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;

@Controller
public class DocumentController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Receive document updates and broadcast to the same room
    @MessageMapping("/{roomId}/doc")
    public void updateDoc(@DestinationVariable String roomId, Map<String, Object> payload) {
        // payload should contain { user, content }
        messagingTemplate.convertAndSend("/topic/" + roomId + "/document", payload);
    }

    // Optional: Handle cursor updates (live caret positions)
    @MessageMapping("/{roomId}/docCursor")
    public void updateCursor(@DestinationVariable String roomId, Map<String, Object> payload) {
        // payload should contain { user, cursor }
        messagingTemplate.convertAndSend("/topic/" + roomId + "/docCursor", payload);
    }
}
