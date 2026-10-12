-- Цена = base_price за первые base_hours часов + extra_hour_price за каждый следующий.
-- Для брони выбирается самый выгодный тариф из подходящих по min_hours.
CREATE TABLE tariffs (
    tariff_id SERIAL PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    min_hours INT NOT NULL,
    base_hours INT NOT NULL,
    base_price NUMERIC(10,2) NOT NULL,
    extra_hour_price NUMERIC(10,2) NOT NULL
);

INSERT INTO tariffs(code, name, min_hours, base_hours, base_price, extra_hour_price)
VALUES
  ('HOURLY',   'Почасовой',  2, 1,  70.00, 70.00),
  ('HALF_DAY', 'Полдня',     4, 4, 250.00, 62.00),
  ('DAY',      'Целый день', 10, 10, 550.00, 55.00);
