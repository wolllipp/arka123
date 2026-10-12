-- Зал один, но таблица оставляет место для второго пространства без переделки схемы
CREATE TABLE halls (
    hall_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    area_m2 INT NOT NULL,
    open_time TIME NOT NULL,
    close_time TIME NOT NULL,
    min_hours INT NOT NULL,
    booking_horizon_days INT NOT NULL,
    CHECK (close_time > open_time)
);

INSERT INTO halls(name, address, area_m2, open_time, close_time, min_hours, booking_horizon_days)
VALUES ('АРКА 123', 'Минск, ул. Мстиславца, 10, 2 этаж', 123, '08:00', '23:00', 2, 90);
