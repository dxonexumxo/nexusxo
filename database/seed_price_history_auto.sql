-- Automated script to generate price history for ALL products
-- This script automatically finds products and generates realistic price history
-- Run this in Supabase SQL Editor - no modifications needed!

DO $$
DECLARE
    product_rec RECORD;
    current_price NUMERIC(12, 2);
    previous_price NUMERIC(12, 2);
    new_price NUMERIC(12, 2);
    change_date TIMESTAMPTZ;
    change_source TEXT;
    num_changes INT;
    i INT;
    price_multiplier NUMERIC;
BEGIN
    -- Loop through all products that have a price
    FOR product_rec IN 
        SELECT id, sku, product_name, price, manufacturer_id
        FROM product_data 
        WHERE price IS NOT NULL 
        AND price > 0
        ORDER BY id
        LIMIT 10  -- Limit to first 10 products to avoid too much data
    LOOP
        current_price := product_rec.price;
        previous_price := NULL;
        
        -- Generate 5-8 price changes per product
        num_changes := floor(random() * 4) + 5; -- 5 to 8 changes
        
        RAISE NOTICE 'Processing product %: % (Starting price: %)', product_rec.id, product_rec.sku, current_price;
        
        -- Generate price changes going backwards in time (most recent first)
        FOR i IN 1..num_changes LOOP
            -- Calculate date: spread changes over the past 6 months (most recent first)
            change_date := NOW() - (random() * INTERVAL '180 days');
            
            -- Determine change source (70% manual, 20% csv_import, 10% api)
            IF random() < 0.7 THEN
                change_source := 'manual';
            ELSIF random() < 0.9 THEN
                change_source := 'csv_import';
            ELSE
                change_source := 'api';
            END IF;
            
            -- Generate price variation: -15% to +15% from current price
            -- This creates realistic fluctuations
            price_multiplier := 0.85 + (random() * 0.30); -- Range: 0.85 to 1.15
            new_price := current_price * price_multiplier;
            new_price := ROUND(new_price, 2);
            
            -- Ensure minimum price of $0.01
            IF new_price < 0.01 THEN
                new_price := 0.01;
            END IF;
            
            -- Insert price history entry
            INSERT INTO product_price_history (
                product_id,
                old_price,
                new_price,
                changed_at,
                changed_by,
                change_source
            ) VALUES (
                product_rec.id,
                previous_price,
                new_price,
                change_date,
                product_rec.manufacturer_id,
                change_source
            );
            
            -- Update for next iteration
            previous_price := new_price;
            current_price := new_price;
        END LOOP;
        
        -- Update the product's current price to the most recent historical price
        UPDATE product_data
        SET price = current_price,
            updated_at = NOW()
        WHERE id = product_rec.id;
        
        RAISE NOTICE '  Created % price changes for product % (Final price: %)', num_changes, product_rec.sku, current_price;
    END LOOP;
    
    RAISE NOTICE 'Price history generation complete!';
END $$;

-- Verify the data was created
SELECT 
    p.sku,
    p.product_name,
    COUNT(pph.id) as history_count,
    MIN(pph.changed_at) as first_change,
    MAX(pph.changed_at) as last_change,
    p.price as current_price
FROM product_data p
JOIN product_price_history pph ON p.id = pph.product_id
GROUP BY p.id, p.sku, p.product_name, p.price
ORDER BY history_count DESC;
