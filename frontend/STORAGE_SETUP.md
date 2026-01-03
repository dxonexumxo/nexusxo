# Manufacturer Logo Storage Setup

This document describes how to set up Supabase Storage for manufacturer logos.

## Overview

Manufacturer logos are stored in a Supabase Storage bucket called `manufacturer-logos`. Each manufacturer's logo is stored in a folder named after their manufacturer ID (UUID).

## Storage Bucket Configuration

### 1. Create the Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `manufacturer-logos`
   - **Public bucket**: ✅ **Enabled** (logos need to be publicly accessible)
   - **File size limit**: 2 MB (recommended)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp, image/gif` (optional, but recommended)

5. Click **Create bucket**

### 2. Configure Row Level Security (RLS) Policies

RLS policies control who can read, write, update, and delete files in the bucket.

#### Policy 1: Public Read Access

Allow anyone to read/view logos (they're public).

```sql
-- Policy: Allow public read access
CREATE POLICY "Public can view manufacturer logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'manufacturer-logos');
```

#### Policy 2: Manufacturers can upload to their own folder

Allow manufacturers to upload files only to their own folder (folder path = their manufacturer ID).

```sql
-- Policy: Manufacturers can upload to their own folder
CREATE POLICY "Manufacturers can upload to own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'manufacturer-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 3: Manufacturers can update files in their own folder

Allow manufacturers to update/replace files in their own folder.

```sql
-- Policy: Manufacturers can update files in own folder
CREATE POLICY "Manufacturers can update files in own folder"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'manufacturer-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 4: Manufacturers can delete files from their own folder

Allow manufacturers to delete files from their own folder.

```sql
-- Policy: Manufacturers can delete files from own folder
CREATE POLICY "Manufacturers can delete files from own folder"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'manufacturer-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 3. Alternative: Using Supabase Dashboard

If you prefer using the Dashboard UI:

1. Go to **Storage** → **Policies** → **manufacturer-logos**
2. Click **New Policy**
3. For each policy:
   - **Policy name**: As described above
   - **Allowed operation**: SELECT, INSERT, UPDATE, or DELETE
   - **Target roles**: `authenticated` for INSERT/UPDATE/DELETE, `anon` for SELECT
   - **Policy definition**: Use the SQL from the policies above

## File Structure

Files are organized as follows:

```
manufacturer-logos/
  └── {manufacturer-id}/
      └── {filename}_{timestamp}.{ext}
```

Example:
```
manufacturer-logos/
  └── 5cd00fef-ce30-40fd-a6a4-b06720fcbed0/
      └── company_logo_1704067200000.png
```

## Security Considerations

1. **File Validation**: The API route validates:
   - File type (only JPG, PNG, WebP, GIF)
   - File size (max 2MB)
   - MIME type (not just file extension)

2. **Folder Isolation**: Each manufacturer can only access files in their own folder (enforced by RLS policies).

3. **Public Access**: Logos are publicly readable, which is intentional for display purposes.

4. **Sanitized Filenames**: Filenames are sanitized to prevent path traversal attacks.

## Testing

After setup, test the following:

1. **Upload a logo** as a manufacturer:
   - Should succeed for valid files
   - Should fail for files > 2MB
   - Should fail for non-image files

2. **View a logo** (public access):
   - Should be accessible without authentication
   - URL format: `https://{project-ref}.supabase.co/storage/v1/object/public/manufacturer-logos/{manufacturer-id}/{filename}`

3. **Delete a logo** as a manufacturer:
   - Should only work for the manufacturer's own logo
   - Should fail for other manufacturers' logos

4. **Update/replace a logo**:
   - Should delete the old logo and upload the new one
   - Should update the database record

## Troubleshooting

### "Bucket not found" error
- Ensure the bucket name is exactly `manufacturer-logos`
- Check that the bucket exists in your Supabase project

### "Permission denied" error
- Check that RLS policies are correctly configured
- Verify the user is authenticated
- Ensure the folder path matches the manufacturer's ID

### "File too large" error
- Check the bucket's file size limit in Supabase Dashboard
- Ensure the API validation matches the bucket limit

### Images not displaying
- Verify the bucket is set to **Public**
- Check that the `logo_url` in the database is correct
- Test the public URL directly in a browser