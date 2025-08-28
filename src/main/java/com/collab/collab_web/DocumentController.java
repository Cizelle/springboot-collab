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

    // same room updates
    @MessageMapping("/{roomId}/doc")
    public void updateDoc(@DestinationVariable String roomId, Map<String, Object> payload) {
        messagingTemplate.convertAndSend("/topic/" + roomId + "/document", payload);
    }

    @MessageMapping("/{roomId}/docCursor")
    public void updateCursor(@DestinationVariable String roomId, Map<String, Object> payload) {
        messagingTemplate.convertAndSend("/topic/" + roomId + "/docCursor", payload);
    }
}
