package com.collab.collab_web;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class PresenceController {

    private final SimpMessagingTemplate messagingTemplate;

    public PresenceController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/{roomId}/presence")
    public void handlePresence(@DestinationVariable String roomId, Map<String, String> message) {
        // Broadcast JOIN or LEAVE to everyone in the room
        messagingTemplate.convertAndSend("/topic/" + roomId + "/presence", message);
    }
}
