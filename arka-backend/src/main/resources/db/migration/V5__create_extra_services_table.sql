-- included_in — коды тарифов (через запятую), в которые услуга входит бесплатно
CREATE TABLE extra_services (
    service_id SERIAL PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    per_person BOOLEAN NOT NULL DEFAULT FALSE,
    included_in VARCHAR(100)
);

INSERT INTO extra_services(code, name, price, per_person, included_in)
VALUES
  ('PROJECTOR',    'Проектор и экран 3 м',            20.00, FALSE, 'HALF_DAY,DAY'),
  ('SOUND',        'Звук и два радиомикрофона',       30.00, FALSE, 'DAY'),
  ('COFFEE_BREAK', 'Кофе-брейк',                      12.00, TRUE,  NULL),
  ('PHOTO',        'Фото- и видеосъёмка события',    180.00, FALSE, NULL),
  ('LAYOUT',       'Рассадка под ваш формат',         25.00, FALSE, NULL);
