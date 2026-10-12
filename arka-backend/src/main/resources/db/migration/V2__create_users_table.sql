CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30),
    password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL REFERENCES roles(role_id),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
