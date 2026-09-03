-- Optional sample data for local development/testing.
-- Both seed accounts are pre-verified (email_verified = true) since they bypass
-- the self-service signup/verification flow.

INSERT INTO users (first_name, last_name, email, password_hash, role, email_verified) VALUES
  ('Ama', 'Owusu', 'manager@store.local', '$2b$10$Iy5lf979yxlheQW9eyA0DOV3HRLmHK/QMboKqtX6LLNP6deDg3agm', 'manager', TRUE),
  ('Kojo', 'Mensah', 'cashier@store.local', '$2b$10$jDEe.FN97MOaiTwBAB1KlelsOU3bFvnAtP..9kMxqFpzCTvLyNR0G', 'cashier', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO categories (name) VALUES
  ('Beverages'), ('Canned Goods'), ('Toiletries'), ('Snacks'), ('Grains & Staples')
ON CONFLICT DO NOTHING;

INSERT INTO products (name, category_id, sku, barcode, cost_price, selling_price, stock_quantity, low_stock_threshold) VALUES
  ('Malta Guinness 33cl', 1, 'BEV-001', '6001234567890', 3.50, 5.00, 48, 12),
  ('Milo 400g', 1, 'BEV-002', '6001234567891', 8.00, 11.50, 20, 6),
  ('Tin Tomatoes 400g', 2, 'CAN-001', '6001234567892', 2.20, 3.50, 4, 10),
  ('Sardines in Oil 125g', 2, 'CAN-002', '6001234567893', 3.00, 4.75, 30, 8),
  ('Bar Soap 200g', 3, 'TOI-001', '6001234567894', 1.20, 2.00, 60, 15),
  ('Toothpaste 100ml', 3, 'TOI-002', '6001234567895', 2.50, 4.00, 25, 8),
  ('Digestive Biscuits', 4, 'SNK-001', '6001234567896', 1.80, 3.00, 3, 10),
  ('Rice 5kg', 5, 'GRN-001', '6001234567897', 12.00, 16.50, 15, 5)
ON CONFLICT DO NOTHING;
