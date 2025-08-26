package com.collab.collab_web;

public class WhiteboardMessage {
    private Double x;
    private Double y;
    private String color;
    private Integer size;
    private Boolean eraser;
    private Boolean clear; // optional flag to clear the board

    public WhiteboardMessage() {
    }

    public Double getX() {
        return x;
    }

    public void setX(Double x) {
        this.x = x;
    }

    public Double getY() {
        return y;
    }

    public void setY(Double y) {
        this.y = y;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public Integer getSize() {
        return size;
    }

    public void setSize(Integer size) {
        this.size = size;
    }

    public Boolean getEraser() {
        return eraser;
    }

    public void setEraser(Boolean eraser) {
        this.eraser = eraser;
    }

    public Boolean getClear() {
        return clear;
    }

    public void setClear(Boolean clear) {
        this.clear = clear;
    }
}
