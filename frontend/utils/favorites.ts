// Utility functions for retailer favorites/wishlist feature

import { supabase } from './supabase'

export interface FavoriteProduct {
  id: string
  sku: string
  product_name: string
  category: string | null
  description: string | null
  price: number | null
  stock_quantity: number | null
  image_urls: string[] | null
  attributes_json: Record<string, any> | null
  manufacturer_id: string
  manufacturer_name: string
  created_at: string
}

/**
 * Get all favorite products for a retailer
 */
export async function getFavoritesForRetailer(retailerId: string): Promise<FavoriteProduct[]> {
  try {
    // First, get all favorite records with product IDs
    const { data: favoritesData, error: favoritesError } = await supabase
      .from('retailer_favorites')
      .select('product_id, created_at')
      .eq('retailer_id', retailerId)
      .order('created_at', { ascending: false })

    if (favoritesError) {
      console.error('Error fetching favorites:', favoritesError)
      throw favoritesError
    }

    if (!favoritesData || favoritesData.length === 0) {
      return []
    }

    const productIds = favoritesData.map(f => f.product_id)

    // Fetch product data
    const { data: productsData, error: productsError } = await supabase
      .from('product_data')
      .select('id, sku, product_name, category, description, price, stock_quantity, image_urls, attributes_json, manufacturer_id')
      .in('id', productIds)

    if (productsError) {
      console.error('Error fetching products:', productsError)
      throw productsError
    }

    if (!productsData || productsData.length === 0) {
      return []
    }

    // Get unique manufacturer IDs
    const manufacturerIds = Array.from(new Set(productsData.map(p => p.manufacturer_id)))

    // Fetch manufacturer names
    const { data: manufacturersData, error: mfgError } = await supabase
      .from('manufacturers')
      .select('id, company_name')
      .in('id', manufacturerIds)

    if (mfgError) {
      console.error('Error fetching manufacturers:', mfgError)
      throw mfgError
    }

    // Create a map of manufacturer IDs to names
    const manufacturerMap = new Map(
      (manufacturersData || []).map(m => [m.id, m.company_name])
    )

    // Create a map of favorite creation dates
    const favoriteDateMap = new Map(
      favoritesData.map(f => [f.product_id, f.created_at])
    )

    // Combine and return the data
    return productsData.map(product => ({
      id: product.id,
      sku: product.sku,
      product_name: product.product_name,
      category: product.category,
      description: product.description,
      price: product.price,
      stock_quantity: product.stock_quantity,
      image_urls: product.image_urls,
      attributes_json: product.attributes_json,
      manufacturer_id: product.manufacturer_id,
      manufacturer_name: manufacturerMap.get(product.manufacturer_id) || 'Unknown',
      created_at: favoriteDateMap.get(product.id) || new Date().toISOString(),
    }))
  } catch (error) {
    console.error('Error in getFavoritesForRetailer:', error)
    throw error
  }
}

/**
 * Get just the product IDs that are favorited by a retailer
 */
export async function getFavoriteProductIds(retailerId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('retailer_favorites')
      .select('product_id')
      .eq('retailer_id', retailerId)

    if (error) {
      console.error('Error fetching favorite IDs:', error)
      throw error
    }

    return (data || []).map(item => item.product_id)
  } catch (error) {
    console.error('Error in getFavoriteProductIds:', error)
    throw error
  }
}

/**
 * Check if a product is favorited by a retailer
 */
export async function isProductFavorite(retailerId: string, productId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('retailer_favorites')
      .select('id')
      .eq('retailer_id', retailerId)
      .eq('product_id', productId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking favorite:', error)
      throw error
    }

    return !!data
  } catch (error) {
    console.error('Error in isProductFavorite:', error)
    throw error
  }
}

/**
 * Add a product to favorites
 */
export async function addFavorite(retailerId: string, productId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('retailer_favorites')
      .insert({
        retailer_id: retailerId,
        product_id: productId,
      })

    if (error) {
      console.error('Error adding favorite:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in addFavorite:', error)
    throw error
  }
}

/**
 * Remove a product from favorites
 */
export async function removeFavorite(retailerId: string, productId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('retailer_favorites')
      .delete()
      .eq('retailer_id', retailerId)
      .eq('product_id', productId)

    if (error) {
      console.error('Error removing favorite:', error)
      throw error
    }
  } catch (error) {
    console.error('Error in removeFavorite:', error)
    throw error
  }
}

/**
 * Toggle favorite status for a product
 * Returns the new favorite status (true if added, false if removed)
 */
export async function toggleFavorite(retailerId: string, productId: string): Promise<boolean> {
  try {
    const isFavorite = await isProductFavorite(retailerId, productId)
    
    if (isFavorite) {
      await removeFavorite(retailerId, productId)
      return false
    } else {
      await addFavorite(retailerId, productId)
      return true
    }
  } catch (error) {
    console.error('Error in toggleFavorite:', error)
    throw error
  }
}
