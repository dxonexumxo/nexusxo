-- Simple script to generate dummy price history data
-- This version uses a simpler approach - just run this after creating the product_price_history table
-- It will generate price history for all products that have a price set

-- Generate price history for products (creates 6-8 price changes over the past 6 months)
INSERT INTO product_price_history (product_id, old_price, new_price, changed_at, changed_by, change_source)
SELECT 
    p.id as product_id,
    CASE 
        WHEN row_number() OVER (PARTITION BY p.id ORDER BY series.num) = 1 THEN NULL
        ELSE p.price * (0.95 + (random() * 0.1)) -- Previous price with small variation
    END as old_price,
    p.price * (0.85 + (random() * 0.3)) as new_price, -- New price: 85% to 115% of current
    NOW() - (random() * INTERVAL '180 days') as changed_at,
    p.manufacturer_id as changed_by,
    CASE 
        WHEN random() < 0.7 THEN 'manual'
        WHEN random() < 0.9 THEN 'csv_import'
        ELSE 'api'
    END as change_source
FROM product_data p
CROSS JOIN generate_series(1, 7) as series(num) -- Generate 7 entries per product
WHERE p.price IS NOT NULL
ORDER BY p.id, series.num DESC; -- Most recent first

-- After inserting, you may want to update product prices to match the most recent history
-- Uncomment the following if you want to update product prices to the latest history entry:

/*
UPDATE product_data p
SET price = (
    SELECT new_price 
    FROM product_price_history pph
    WHERE pph.product_id = p.id
    ORDER BY pph.changed_at DESC
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 FROM product_price_history pph2
    WHERE pph2.product_id = p.id
);
*/
