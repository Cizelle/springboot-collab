package com.collab.collab_web;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class WhiteboardController {

    // Receive drawing events from client and broadcast to others
    @MessageMapping("/draw")
    @SendTo("/topic/whiteboard")
    public String draw(String payload) {
        return payload; // forward raw data (like JSON with x,y)
    }
}
