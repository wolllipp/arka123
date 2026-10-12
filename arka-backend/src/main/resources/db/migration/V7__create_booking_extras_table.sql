-- Цена услуги фиксируется в момент брони: изменение прайса не меняет старые брони
CREATE TABLE booking_extras (
    booking_id INT NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    service_id INT NOT NULL REFERENCES extra_services(service_id),
    price NUMERIC(10,2) NOT NULL,
    PRIMARY KEY (booking_id, service_id)
);
