-- Create users table (missing from initial schema)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Example: Insert a default admin user (password is 'admin123' - change this!)
-- Uncomment the line below if you want to create a default user
-- INSERT INTO users (email, password) VALUES ('admin@example.com', '$2a$10$8K1p/a9Y.rNKp8h9YvFHWe8jJo.xRV8mY1bQ4zL2X3pN4mC5oD6eW');
