-- Add price history data for products from manufacturer "Beiersdorf Test"
-- Run this in Supabase SQL Editor

-- First, find the manufacturer ID and product IDs
-- You can run this query first to see what we're working with:
-- SELECT m.id as manufacturer_id, m.company_name, p.id as product_id, p.sku, p.product_name, p.price 
-- FROM manufacturers m
-- JOIN product_data p ON p.manufacturer_id = m.id
-- WHERE m.company_name = 'Beiersdorf Test'
-- ORDER BY p.created_at DESC
-- LIMIT 10;

-- Generate price history for products from Beiersdorf Test
-- This creates price history entries over the past 6 months

DO $$
DECLARE
    manufacturer_record RECORD;
    product_record RECORD;
    base_price NUMERIC(12, 2);
    new_price NUMERIC(12, 2);
    previous_price NUMERIC(12, 2);
    change_date TIMESTAMPTZ;
    change_source TEXT;
    price_change_count INT;
    i INT;
    months_ago INT;
    price_variation NUMERIC;
BEGIN
    -- Find the manufacturer
    SELECT id INTO manufacturer_record
    FROM manufacturers
    WHERE company_name = 'Beiersdorf Test'
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'Manufacturer "Beiersdorf Test" not found';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Found manufacturer: % (ID: %)', manufacturer_record.id, manufacturer_record.id;
    
    -- Loop through products from this manufacturer
    FOR product_record IN 
        SELECT id, sku, product_name, price, manufacturer_id
        FROM product_data
        WHERE manufacturer_id = manufacturer_record.id
        AND price IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 10  -- Limit to first 10 products
    LOOP
        RAISE NOTICE 'Processing product: % (SKU: %, Price: %)', product_record.product_name, product_record.sku, product_record.price;
        
        base_price := product_record.price;
        previous_price := NULL;
        price_change_count := 6 + FLOOR(RANDOM() * 3)::INT; -- 6-8 price changes
        
        -- Generate price history entries going back in time
        FOR i IN 1..price_change_count LOOP
            months_ago := price_change_count - i + 1;
            change_date := NOW() - (months_ago * INTERVAL '1 month') - (RANDOM() * INTERVAL '15 days');
            
            -- Determine price variation (mix of increases and decreases)
            IF i = 1 THEN
                -- First entry: start with a price slightly different from current
                price_variation := 0.85 + (RANDOM() * 0.3); -- 85% to 115% of current price
                new_price := ROUND(base_price * price_variation, 2);
                previous_price := NULL;
            ELSE
                -- Subsequent entries: vary by -10% to +15%
                price_variation := 0.90 + (RANDOM() * 0.25); -- 90% to 115%
                new_price := ROUND(previous_price * price_variation, 2);
            END IF;
            
            -- Ensure minimum price
            IF new_price < 0.01 THEN
                new_price := 0.01;
            END IF;
            
            -- Determine change source
            CASE 
                WHEN RANDOM() < 0.7 THEN change_source := 'manual';
                WHEN RANDOM() < 0.9 THEN change_source := 'csv_import';
                ELSE change_source := 'api';
            END CASE;
            
            -- Insert price history entry
            BEGIN
                INSERT INTO product_price_history (
                    product_id,
                    old_price,
                    new_price,
                    changed_at,
                    changed_by,
                    change_source
                ) VALUES (
                    product_record.id,
                    previous_price,
                    new_price,
                    change_date,
                    product_record.manufacturer_id,
                    change_source
                );
                
                RAISE NOTICE '  Inserted: % -> % at %', previous_price, new_price, change_date;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE '  Error inserting price history: %', SQLERRM;
            END;
            
            previous_price := new_price;
        END LOOP;
        
        -- Update the product's current price to match the last history entry
        UPDATE product_data
        SET price = previous_price
        WHERE id = product_record.id;
        
        RAISE NOTICE 'Updated product price to: %', previous_price;
    END LOOP;
    
    RAISE NOTICE 'Price history generation complete!';
END $$;

-- Verify the data was created
-- Run this query to see the results:
/*
SELECT 
    m.company_name,
    p.sku,
    p.product_name,
    p.price as current_price,
    COUNT(pph.id) as history_entries,
    MIN(pph.changed_at) as first_change,
    MAX(pph.changed_at) as last_change
FROM manufacturers m
JOIN product_data p ON p.manufacturer_id = m.id
LEFT JOIN product_price_history pph ON p.id = pph.product_id
WHERE m.company_name = 'Beiersdorf Test'
GROUP BY m.id, m.company_name, p.id, p.sku, p.product_name, p.price
ORDER BY history_entries DESC, p.product_name;
*/
