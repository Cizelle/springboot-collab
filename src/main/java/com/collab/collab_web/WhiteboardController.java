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

    @MessageMapping("/{roomId}/draw")
    public void draw(@DestinationVariable String roomId, Map<String, Object> payload) {
        messagingTemplate.convertAndSend("/topic/" + roomId + "/whiteboard", payload);
    }
}
