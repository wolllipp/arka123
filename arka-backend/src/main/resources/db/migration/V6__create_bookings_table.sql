CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    public_code UUID NOT NULL UNIQUE,
    hall_id INT NOT NULL REFERENCES halls(hall_id),
    user_id INT REFERENCES users(user_id),
    tariff_id INT NOT NULL REFERENCES tariffs(tariff_id),
    layout VARCHAR(20) NOT NULL,
    guests INT NOT NULL CHECK (guests > 0),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    contact_name VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(30) NOT NULL,
    contact_email VARCHAR(255),
    comment VARCHAR(1000),
    total_price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    CHECK (end_time > start_time),
    -- Главная защита: две активные брони одного зала не могут пересекаться по времени.
    -- Отменённые не мешают — слот после отмены снова можно забронировать.
    CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
        hall_id WITH =,
        tsrange(date + start_time, date + end_time) WITH &&
    ) WHERE (status <> 'CANCELLED')
);

CREATE INDEX bookings_date_idx ON bookings(hall_id, date);
CREATE INDEX bookings_user_idx ON bookings(user_id);
