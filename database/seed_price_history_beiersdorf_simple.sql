-- Simple script to add price history for products from "Beiersdorf Test"
-- Run this in Supabase SQL Editor
-- This version uses a direct INSERT approach that's easier to modify

-- Step 1: First, find the manufacturer ID and product IDs (run this query first)
/*
SELECT 
    m.id as manufacturer_id, 
    m.company_name, 
    p.id as product_id, 
    p.sku, 
    p.product_name, 
    p.price 
FROM manufacturers m
JOIN product_data p ON p.manufacturer_id = m.id
WHERE m.company_name = 'Beiersdorf Test'
AND p.price IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 10;
*/

-- Step 2: Replace the product IDs and manufacturer ID below with actual values from Step 1
-- Then run this script

-- Example: Generate price history for a product (replace PRODUCT_ID_1 and MANUFACTURER_ID)
-- Product 1: Decreasing price trend
INSERT INTO product_price_history (product_id, old_price, new_price, changed_at, changed_by, change_source) VALUES
('PRODUCT_ID_1', NULL, 100.00, NOW() - INTERVAL '6 months', 'MANUFACTURER_ID', 'manual'),
('PRODUCT_ID_1', 100.00, 95.00, NOW() - INTERVAL '5 months', 'MANUFACTURER_ID', 'csv_import'),
('PRODUCT_ID_1', 95.00, 90.00, NOW() - INTERVAL '4 months', 'MANUFACTURER_ID', 'manual'),
('PRODUCT_ID_1', 90.00, 88.50, NOW() - INTERVAL '3 months', 'MANUFACTURER_ID', 'manual'),
('PRODUCT_ID_1', 88.50, 85.00, NOW() - INTERVAL '2 months', 'MANUFACTURER_ID', 'csv_import'),
('PRODUCT_ID_1', 85.00, 82.00, NOW() - INTERVAL '1 month', 'MANUFACTURER_ID', 'manual');

-- Product 2: Increasing price trend (replace PRODUCT_ID_2 and MANUFACTURER_ID)
INSERT INTO product_price_history (product_id, old_price, new_price, changed_at, changed_by, change_source) VALUES
('PRODUCT_ID_2', NULL, 50.00, NOW() - INTERVAL '6 months', 'MANUFACTURER_ID', 'manual'),
('PRODUCT_ID_2', 50.00, 52.50, NOW() - INTERVAL '5 months', 'MANUFACTURER_ID', 'manual'),
('PRODUCT_ID_2', 52.50, 55.00, NOW() - INTERVAL '4 months', 'MANUFACTURER_ID', 'csv_import'),
('PRODUCT_ID_2', 55.00, 57.50, NOW() - INTERVAL '3 months', 'MANUFACTURER_ID', 'manual'),
('PRODUCT_ID_2', 57.50, 60.00, NOW() - INTERVAL '2 months', 'MANUFACTURER_ID', 'manual'),
('PRODUCT_ID_2', 60.00, 62.00, NOW() - INTERVAL '3 weeks', 'MANUFACTURER_ID', 'api');

-- Product 3: Fluctuating price (replace PRODUCT_ID_3 and MANUFACTURER_ID)
INSERT INTO product_price_history (product_id, old_price, new_price, changed_at, changed_by, change_source) VALUES
('PRODUCT_ID_3', NULL, 75.00, NOW() - INTERVAL '6 months', 'MANUFACTURER_ID', 'manual'),
('PRODUCT_ID_3', 75.00, 80.00, NOW() - INTERVAL '5 months', 'MANUFACTURER_ID', 'manual'),
('PRODUCT_ID_3', 80.00, 77.50, NOW() - INTERVAL '4 months', 'MANUFACTURER_ID', 'csv_import'),
('PRODUCT_ID_3', 77.50, 75.00, NOW() - INTERVAL '3 months', 'MANUFACTURER_ID', 'manual'),
('PRODUCT_ID_3', 75.00, 78.00, NOW() - INTERVAL '2 months', 'MANUFACTURER_ID', 'manual'),
('PRODUCT_ID_3', 78.00, 76.50, NOW() - INTERVAL '1 month', 'MANUFACTURER_ID', 'manual'),
('PRODUCT_ID_3', 76.50, 79.00, NOW() - INTERVAL '2 weeks', 'MANUFACTURER_ID', 'api');

-- Update product prices to match the latest history entries
-- UPDATE product_data SET price = 82.00 WHERE id = 'PRODUCT_ID_1';
-- UPDATE product_data SET price = 62.00 WHERE id = 'PRODUCT_ID_2';
-- UPDATE product_data SET price = 79.00 WHERE id = 'PRODUCT_ID_3';

-- Step 3: Verify the data was created
/*
SELECT 
    m.company_name,
    p.sku,
    p.product_name,
    p.price as current_price,
    COUNT(pph.id) as history_entries,
    MIN(pph.changed_at) as first_change,
    MAX(pph.changed_at) as last_change,
    MIN(pph.new_price) as min_price,
    MAX(pph.new_price) as max_price
FROM manufacturers m
JOIN product_data p ON p.manufacturer_id = m.id
LEFT JOIN product_price_history pph ON p.id = pph.product_id
WHERE m.company_name = 'Beiersdorf Test'
GROUP BY m.id, m.company_name, p.id, p.sku, p.product_name, p.price
ORDER BY history_entries DESC, p.product_name;
*/
