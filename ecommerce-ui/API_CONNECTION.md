# Connected to Ecommerce_api

This UI is wired to your **Ecommerce_api** (.NET) backend. Models and endpoints match your API.

## 1. Run the API

From the API folder:

```bash
cd Ecommerce_api/Ecommerce_shoes
dotnet run
```

The API runs at the URL in `Properties/launchSettings.json` (e.g. **http://localhost:5232**).

## 2. Run the UI

```bash
cd ecommerce-ui
npm run dev
```

Create a `.env` file (copy from `.env.example`) if the API is on a different port:

```env
VITE_API_URL=http://localhost:5232
```

## 3. API ↔ UI mapping

| Your API | UI usage |
|----------|----------|
| **Product** (ProductId, ProductName, Price, CategoryId, Category, ProductImages, Description, StockQuentity) | Mapped to `id`, `name`, `price`, `category`, `image` (first ProductImage.ImageUrl), `description`. Used on Home, Shop, Product detail. |
| **Category** (CategoryId, CategoryName, Description) | Mapped to `id`, `name`. Used in sidebar and filters. |
| **Basket** (CustomerBasketId, Items) | Cart "Proceed to checkout" sends current cart as `CustomerBasket` to `POST api/Basket`. |
| **BasketItem** (ProductName, Price, Quantity, PictureUrl, Brand, Type) | Cart items are converted to this shape when syncing to the API. |

## 4. Endpoints used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/Product/AllProduct` | List all products (category filter applied in the UI). |
| GET | `/api/Product/GetProductById?id={id}` | Single product for detail page. |
| GET | `/api/Category/AllCategory` | List categories for filters. If this returns 401 (Admin-only), the UI falls back to categories derived from products. |
| GET | `/api/Basket?id={basketId}` | Get basket (basketId from localStorage). |
| POST | `/api/Basket` | Update basket (used when you click "Proceed to checkout"). |

## 5. CORS

Your API already allows `http://localhost:5173` in `Program.cs`. Keep the Vite dev server on that port when developing.

## 6. CategoryController and AllCategory

`CategoryController` has `[Authorize(Roles = "Admin")]`, so unauthenticated users get 401 for `AllCategory`. The UI handles this by deriving categories from the product list when `AllCategory` fails. To show categories from the API for everyone, you can allow anonymous access for `AllCategory` only (e.g. a separate endpoint or `[AllowAnonymous]` on that action).

## 7. Dashboard (admin)

The **Dashboard** (`/dashboard`) lets you manage products and categories using your API ViewModels.

- **Products:** List (from `AllProduct`), Add (`POST AddProduct` – ProductViewModel: categoryId, productName, description, price, stockQuentity), Edit (`PUT UpdateProduct` – productId, productName, description, price, stockQuentity), Delete (`DELETE DeleteProduct?id=`).
- **Categories:** List (from `AllCategory`), Add (`POST AddCategory` – CategoryViewModel: categoryName, description), Edit (`PUT EditCategory` – categoryId, categoryName, description), Delete (`DELETE DeleteCategory?id=`).

ProductController has `[Authorize(Roles = "Admin")]` commented out, so product CRUD works without auth. CategoryController requires Admin; if you get 401 on categories, add JWT auth to the UI or allow anonymous for the category endpoints you need.
