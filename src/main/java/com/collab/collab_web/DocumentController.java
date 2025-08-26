package com.collab.collab_web;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class DocumentController {

    @MessageMapping("/doc")
    @SendTo("/topic/document")
    public DocMessage updateDoc(DocMessage msg) {
        return msg; // broadcast full object (user + content)
    }
}
