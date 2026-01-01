# Price History Seed Scripts

This directory contains SQL scripts to generate dummy price history data for testing the price history feature.

## Available Scripts

### 1. `seed_price_history_auto.sql` ⭐ **RECOMMENDED**
**Best for: Quick setup with automatic data generation**

- Automatically finds products with prices
- Generates 5-8 price changes per product over the past 6 months
- Creates realistic price fluctuations (±15%)
- Mixes change sources (manual, csv_import, api)
- **No modifications needed** - just run it!

**Usage:**
```sql
-- Copy and paste the entire contents of seed_price_history_auto.sql into Supabase SQL Editor
-- Click "Run" - that's it!
```

### 2. `seed_price_history_manual.sql`
**Best for: Testing specific scenarios with known patterns**

- Creates price history with specific patterns:
  - Decreasing price trend
  - Increasing price trend  
  - Fluctuating price
- Requires replacing placeholder IDs with actual product/manufacturer IDs
- Good for testing specific chart scenarios

**Usage:**
1. First, get your product IDs:
   ```sql
   SELECT id, sku, product_name, price, manufacturer_id 
   FROM product_data 
   WHERE price IS NOT NULL 
   LIMIT 5;
   ```
2. Replace `YOUR_PRODUCT_ID_1`, `YOUR_PRODUCT_ID_2`, etc. with actual IDs
3. Replace `YOUR_MANUFACTURER_ID` with actual manufacturer IDs (or use NULL)
4. Run the script

### 3. `seed_price_history.sql`
**Best for: Customization**

- Similar to auto script but allows more customization
- Has a typo that needs fixing (use auto script instead)
- Contains commented alternative manual approach

## Quick Start

**Recommended approach:** Use `seed_price_history_auto.sql`

1. Open Supabase Dashboard → SQL Editor
2. Copy the entire contents of `database/seed_price_history_auto.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Check the output messages to see how many records were created

## Verify Data

After running any script, verify the data was created:

```sql
-- Check how many price history records exist per product
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
```

## Notes

- All scripts respect Row Level Security (RLS) policies
- Scripts use `manufacturer_id` as `changed_by` (you can modify if needed)
- Prices are rounded to 2 decimal places
- Minimum price is enforced at $0.01
- Change sources are distributed: 70% manual, 20% csv_import, 10% api
