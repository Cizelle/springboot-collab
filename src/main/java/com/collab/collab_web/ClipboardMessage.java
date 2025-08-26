package com.collab.collab_web;

public class ClipboardMessage {
    private String user;
    private String type; // "text" or "image"
    private String data; // text or base64 image

    public ClipboardMessage() {
    }

    public ClipboardMessage(String user, String type, String data) {
        this.user = user;
        this.type = type;
        this.data = data;
    }

    public String getUser() {
        return user;
    }

    public void setUser(String user) {
        this.user = user;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }
}
