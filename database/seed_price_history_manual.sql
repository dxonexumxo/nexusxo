-- Manual script to create price history with specific patterns
-- Copy and paste this into Supabase SQL Editor
-- Replace YOUR_PRODUCT_ID_1, YOUR_PRODUCT_ID_2, etc. with actual product IDs from your database
-- Replace YOUR_MANUFACTURER_ID with actual manufacturer IDs (or use NULL for changed_by)

-- First, get some product IDs to use (run this query first to get IDs):
-- SELECT id, sku, product_name, price, manufacturer_id FROM product_data WHERE price IS NOT NULL LIMIT 5;

-- Then replace the placeholders below and run this script:

-- Example: Product with decreasing price trend
INSERT INTO product_price_history (product_id, old_price, new_price, changed_at, changed_by, change_source) VALUES
-- Replace YOUR_PRODUCT_ID_1 and YOUR_MANUFACTURER_ID with actual values
('YOUR_PRODUCT_ID_1', NULL, 100.00, NOW() - INTERVAL '6 months', 'YOUR_MANUFACTURER_ID', 'manual'),
('YOUR_PRODUCT_ID_1', 100.00, 95.00, NOW() - INTERVAL '5 months', 'YOUR_MANUFACTURER_ID', 'csv_import'),
('YOUR_PRODUCT_ID_1', 95.00, 90.00, NOW() - INTERVAL '4 months', 'YOUR_MANUFACTURER_ID', 'manual'),
('YOUR_PRODUCT_ID_1', 90.00, 88.50, NOW() - INTERVAL '3 months', 'YOUR_MANUFACTURER_ID', 'manual'),
('YOUR_PRODUCT_ID_1', 88.50, 85.00, NOW() - INTERVAL '2 months', 'YOUR_MANUFACTURER_ID', 'csv_import'),
('YOUR_PRODUCT_ID_1', 85.00, 82.00, NOW() - INTERVAL '1 month', 'YOUR_MANUFACTURER_ID', 'manual');

-- Example: Product with increasing price trend
INSERT INTO product_price_history (product_id, old_price, new_price, changed_at, changed_by, change_source) VALUES
-- Replace YOUR_PRODUCT_ID_2 and YOUR_MANUFACTURER_ID with actual values
('YOUR_PRODUCT_ID_2', NULL, 50.00, NOW() - INTERVAL '6 months', 'YOUR_MANUFACTURER_ID', 'manual'),
('YOUR_PRODUCT_ID_2', 50.00, 52.50, NOW() - INTERVAL '5 months', 'YOUR_MANUFACTURER_ID', 'manual'),
('YOUR_PRODUCT_ID_2', 52.50, 55.00, NOW() - INTERVAL '4 months', 'YOUR_MANUFACTURER_ID', 'csv_import'),
('YOUR_PRODUCT_ID_2', 55.00, 57.50, NOW() - INTERVAL '3 months', 'YOUR_MANUFACTURER_ID', 'manual'),
('YOUR_PRODUCT_ID_2', 57.50, 60.00, NOW() - INTERVAL '2 months', 'YOUR_MANUFACTURER_ID', 'manual'),
('YOUR_PRODUCT_ID_2', 60.00, 62.00, NOW() - INTERVAL '3 weeks', 'YOUR_MANUFACTURER_ID', 'api');

-- Example: Product with fluctuating price
INSERT INTO product_price_history (product_id, old_price, new_price, changed_at, changed_by, change_source) VALUES
-- Replace YOUR_PRODUCT_ID_3 and YOUR_MANUFACTURER_ID with actual values
('YOUR_PRODUCT_ID_3', NULL, 75.00, NOW() - INTERVAL '6 months', 'YOUR_MANUFACTURER_ID', 'manual'),
('YOUR_PRODUCT_ID_3', 75.00, 80.00, NOW() - INTERVAL '5 months', 'YOUR_MANUFACTURER_ID', 'manual'),
('YOUR_PRODUCT_ID_3', 80.00, 77.50, NOW() - INTERVAL '4 months', 'YOUR_MANUFACTURER_ID', 'csv_import'),
('YOUR_PRODUCT_ID_3', 77.50, 75.00, NOW() - INTERVAL '3 months', 'YOUR_MANUFACTURER_ID', 'manual'),
('YOUR_PRODUCT_ID_3', 75.00, 78.00, NOW() - INTERVAL '2 months', 'YOUR_MANUFACTURER_ID', 'manual'),
('YOUR_PRODUCT_ID_3', 78.00, 76.50, NOW() - INTERVAL '1 month', 'YOUR_MANUFACTURER_ID', 'manual'),
('YOUR_PRODUCT_ID_3', 76.50, 79.00, NOW() - INTERVAL '2 weeks', 'YOUR_MANUFACTURER_ID', 'api');

-- Update product prices to match the latest history entries
UPDATE product_data SET price = 82.00 WHERE id = 'YOUR_PRODUCT_ID_1';
UPDATE product_data SET price = 62.00 WHERE id = 'YOUR_PRODUCT_ID_2';
UPDATE product_data SET price = 79.00 WHERE id = 'YOUR_PRODUCT_ID_3';
