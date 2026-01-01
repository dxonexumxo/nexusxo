-- Script to generate dummy price history data for testing
-- Run this in Supabase SQL Editor after creating the product_price_history table

-- First, let's see what products exist (optional - you can modify product IDs below)
-- SELECT id, sku, product_name, price FROM product_data LIMIT 10;

-- Generate price history for a few products
-- This script creates price changes over the past 6 months
-- Modify the product IDs below to match your actual product IDs

DO $$
DECLARE
    product_record RECORD;
    base_price NUMERIC(12, 2);
    new_price NUMERIC(12, 2);
    change_date TIMESTAMPTZ;
    change_source TEXT;
    price_change_count INT;
    i INT;
BEGIN
    -- Loop through some products (get first 5 products with prices)
    FOR product_record IN 
        SELECT id, sku, product_name, price, manufacturer_id
        FROM product_data 
        WHERE price IS NOT NULL 
        LIMIT 5
    LOOP
        base_price := product_record.price;
        
        -- Generate 5-10 price changes per product over the past 6 months
        price_change_count := floor(random() * 6) + 5; -- 5 to 10 changes
        
        FOR i IN 1..price_change_count LOOP
            -- Calculate date: spread changes over the past 6 months
            change_date := NOW() - (random() * INTERVAL '180 days');
            
            -- Determine change source (70% manual, 20% csv_import, 10% api)
            IF random() < 0.7 THEN
                change_source := 'manual';
            ELSIF random() < 0.9 THEN
                change_source := 'csv_import';
            ELSE
                change_source := 'api';
            END IF;
            
            -- Generate new price: ±5% to ±25% change from base price
            new_price := base_price * (1 + (random() * 0.5 - 0.25)); -- -25% to +25%
            new_price := ROUND(new_price, 2);
            
            -- Ensure minimum price of $0.01
            IF new_price < 0.01 THEN
                new_price := 0.01;
            END IF;
            
            -- For the first entry, use the current price as old_price (NULL), new_price as base_price
            -- For subsequent entries, use the previous new_price as old_price
            IF i = 1 THEN
                INSERT INTO product_price_history (
                    product_id,
                    old_price,
                    new_price,
                    changed_at,
                    changed_by,
                    change_source
                ) VALUES (
                    product_record.id,
                    NULL, -- First entry has no old price
                    base_price,
                    change_date,
                    product_record.manufacturer_id,
                    change_source
                );
                base_price := base_price;
            ELSE
                -- Insert with old_price from previous iteration
                INSERT INTO product_price_history (
                    product_id,
                    old_price,
                    new_price,
                    changed_at,
                    changed_by,
                    change_source
                ) VALUES (
                    product_record.id,
                    base_price, -- Previous price
                    new_price,
                    change_date,
                    product_record.manufacturer_id,
                    change_source
                );
                base_price := new_price;
            END IF;
        END LOOP;
        
        -- Update the product's current price to match the last history entry
        UPDATE product_data
        SET price = base_price
        WHERE id = product_record.id;
    END LOOP;
    
    RAISE NOTICE 'Generated price history data for products';
END $$;

-- Alternative: Simple version with explicit product IDs (if you know your product IDs)
-- Uncomment and modify the product IDs below:

/*
-- Insert price history for specific products
-- Replace the product_id values with your actual product IDs

INSERT INTO product_price_history (product_id, old_price, new_price, changed_at, changed_by, change_source) VALUES
-- Product 1: Price decreasing over time
('YOUR_PRODUCT_ID_1', NULL, 100.00, NOW() - INTERVAL '6 months', 'YOUR_MANUFACTURER_ID', 'manual'),
('YOUR_PRODUCT_ID_1', 100.00, 95.00, NOW() - INTERVAL '5 months', 'YOUR_MANUFACTURER_ID', 'csv_import'),
('YOUR_PRODUCT_ID_1', 95.00, 90.00, NOW() - INTERVAL '4 months', 'YOUR_MANUFACTURER_ID', 'manual'),
('YOUR_PRODUCT_ID_1', 90.00, 88.50, NOW() - INTERVAL '3 months', 'YOUR_MANUFACTURER_ID', 'manual'),
('YOUR_PRODUCT_ID_1', 88.50, 85.00, NOW() - INTERVAL '2 months', 'YOUR_MANUFACTURER_ID', 'csv_import'),
('YOUR_PRODUCT_ID_1', 85.00, 82.00, NOW() - INTERVAL '1 month', 'YOUR_MANUFACTURER_ID', 'manual'),

-- Product 2: Price increasing over time
('YOUR_PRODUCT_ID_2', NULL, 50.00, NOW() - INTERVAL '6 months', 'YOUR_MANUFACTURER_ID', 'manual'),
('YOUR_PRODUCT_ID_2', 50.00, 52.50, NOW() - INTERVAL '5 months', 'YOUR_MANUFACTURER_ID', 'manual'),
('YOUR_PRODUCT_ID_2', 52.50, 55.00, NOW() - INTERVAL '4 months', 'YOUR_MANUFACTURER_ID', 'csv_import'),
('YOUR_PRODUCT_ID_2', 55.00, 57.50, NOW() - INTERVAL '3 months', 'YOUR_MANUFACTURER_ID', 'manual'),
('YOUR_PRODUCT_ID_2', 57.50, 60.00, NOW() - INTERVAL '2 months', 'YOUR_MANUFACTURER_ID', 'manual'),
('YOUR_PRODUCT_ID_2', 60.00, 62.00, NOW() - INTERVAL '3 weeks', 'YOUR_MANUFACTURER_ID', 'api'),

-- Product 3: Price fluctuating
('YOUR_PRODUCT_ID_3', NULL, 75.00, NOW() - INTERVAL '6 months', 'YOUR_MANUFACTURER_ID', 'manual'),
('YOUR_PRODUCT_ID_3', 75.00, 80.00, NOW() - INTERVAL '5 months', 'YOUR_MANUFACTURER_ID', 'manual'),
('YOUR_PRODUCT_ID_3', 80.00, 77.50, NOW() - INTERVAL '4 months', 'YOUR_MANUFACTURER_ID', 'csv_import'),
('YOUR_PRODUCT_ID_3', 77.50, 75.00, NOW() - INTERVAL '3 months', 'YOUR_MANUFACTURER_ID', 'manual'),
('YOUR_PRODUCT_ID_3', 75.00, 78.00, NOW() - INTERVAL '2 months', 'YOUR_MANUFACTURER_ID', 'manual'),
('YOUR_PRODUCT_ID_3', 78.00, 76.50, NOW() - INTERVAL '1 month', 'YOUR_MANUFACTURER_ID', 'manual'),
('YOUR_PRODUCT_ID_3', 76.50, 79.00, NOW() - INTERVAL '2 weeks', 'YOUR_MANUFACTURER_ID', 'api');

-- Update product prices to match latest history entries
UPDATE product_data SET price = 82.00 WHERE id = 'YOUR_PRODUCT_ID_1';
UPDATE product_data SET price = 62.00 WHERE id = 'YOUR_PRODUCT_ID_2';
UPDATE product_data SET price = 79.00 WHERE id = 'YOUR_PRODUCT_ID_3';
*/
