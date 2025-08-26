package com.collab.collab_web;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    @MessageMapping("/chat")
    @SendTo("/topic/messages")
    public String handleChat(ChatMessage msg) {
        return msg.getUser() + ": " + msg.getContent();
    }
}
