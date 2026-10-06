# Fix R2 "Access Denied" – Cloudflare dashboard steps

Your app is configured to use:
- **Account ID:** `cea6ef3f1881fe3be5efdc3c68d18174`
- **Bucket name:** `ecommerce`

## 1. Create the bucket (if it doesn’t exist)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2 Object Storage**.
2. Confirm **Account ID** in the URL or overview is `cea6ef3f1881fe3be5efdc3c68d18174`.
3. Click **Create bucket**.
4. Name it exactly: **ecommerce**.
5. Create the bucket.

## 2. Create an R2 API token with write access

1. In R2, open **Manage R2 API Tokens** (right side or in the R2 menu).
2. Click **Create API token**.
3. **Token name:** e.g. `ecommerce-app`.
4. **Permissions:** choose **Object Read & Write** (or **Admin Read & Write**).
5. **Specify bucket(s):**
   - Either: **All buckets**,  
   - Or: **Apply to specific buckets only** and select **ecommerce**.
6. Create the token.
7. Copy the **Access Key ID** and **Secret Access Key** (Secret is shown only once).

## 3. Update appsettings.json

In `CloudflareR2` set the new token (keep AccountId and BucketName as above):

```json
"CloudflareR2": {
  "AccountId": "cea6ef3f1881fe3be5efdc3c68d18174",
  "BucketName": "ecommerce",
  "AccessKeyId": "PASTE_NEW_ACCESS_KEY_ID",
  "SecretAccessKey": "PASTE_NEW_SECRET_ACCESS_KEY",
  "PublicBaseUrl": ""
}
```

Restart the API and try uploading again.

## 4. If you already have a token

- If the token was created with **Object Read only**, it cannot write. Create a new token with **Object Read & Write**.
- If it was scoped to specific buckets and **ecommerce** was not selected, create a new token and select **ecommerce** (or use **All buckets**).

## 5. Showing images in the app

- **Option A (default):** Leave `PublicBaseUrl` empty. The API will store paths like `/ecommerce/products/...` and **proxy** them: `GET /api/Bucket/Image?path=...` streams the image from R2. No need to make the bucket public.
- **Option B:** Enable **Public access** on the bucket in Cloudflare (R2 → your bucket → Settings → Public access / R2.dev subdomain). Copy the public URL (e.g. `https://pub-xxxxx.r2.dev`) into `PublicBaseUrl`. Then stored URLs will be full public URLs and the frontend will load them directly (no proxy).
