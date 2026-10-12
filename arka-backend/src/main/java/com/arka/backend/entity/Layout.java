package com.arka.backend.entity;

/** Форматы рассадки — те же, что в 3D-зале на сайте */
public enum Layout {
    EMPTY("Свободная планировка", 40),
    LECTURE("Лекция рядами", 48),
    TABLE("Общий стол", 24),
    GROUPS("Группы", 36);

    private final String title;
    private final int capacity;

    Layout(String title, int capacity) {
        this.title = title;
        this.capacity = capacity;
    }

    public String getTitle() {
        return title;
    }

    public int getCapacity() {
        return capacity;
    }
}
