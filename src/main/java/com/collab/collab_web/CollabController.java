package com.collab.collab_web;

import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class CollabController {

    private final SimpMessagingTemplate messagingTemplate;

    public CollabController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    // Chat
    @MessageMapping("/{roomId}/chat")
    public void handleChat(@DestinationVariable String roomId, @Payload Map<String, String> msg) {
        messagingTemplate.convertAndSend("/topic/" + roomId + "/chat", msg);
    }

    // Whiteboard
    @MessageMapping("/{roomId}/whiteboard")
    public void handleWhiteboard(@DestinationVariable String roomId, @Payload Map<String, Object> data) {
        messagingTemplate.convertAndSend("/topic/" + roomId + "/whiteboard", data);
    }

    // Document
    @MessageMapping("/{roomId}/document")
    public void handleDocument(@DestinationVariable String roomId, @Payload Map<String, Object> data) {
        messagingTemplate.convertAndSend("/topic/" + roomId + "/document", data);
    }

    // Clipboard
    @MessageMapping("/{roomId}/clipboard")
    public void handleClipboard(@DestinationVariable String roomId, @Payload Map<String, Object> data) {
        messagingTemplate.convertAndSend("/topic/" + roomId + "/clipboard", data);
    }
}
