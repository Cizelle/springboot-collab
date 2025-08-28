package com.collab.collab_web;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class ClipboardController {

    @MessageMapping("/clipboard")
    @SendTo("/topic/clipboard")
    public ClipboardMessage updateClipboard(ClipboardMessage msg) {
        return msg;
    }
}
