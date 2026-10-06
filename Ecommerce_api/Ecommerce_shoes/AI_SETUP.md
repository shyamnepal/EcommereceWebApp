# AI features (Chatbot & recommendations)

## Chatbot

The app includes an AI assistant (chat widget on every page) powered by **OpenAI**.

### Setup

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys).
2. In `appsettings.json`, set:
   ```json
   "OpenAI": {
     "ApiKey": "sk-your-key-here",
     "Model": "gpt-3.5-turbo"
   }
   ```
3. Restart the API. The chatbot will then answer questions about products, sizing, shipping, and returns.

If `ApiKey` is empty, the widget still works and shows: *"Chat is not configured. Please add OpenAI:ApiKey in appsettings."*

---

## Product recommendations

- **Backend:** `GET /api/Product/Recommend?productId={id}&limit=4` returns products from the same category (and fills with others if needed). Omit `productId` for general recommendations.
- **Frontend:** "You might also like" on the product detail page uses this endpoint. Recommendations are same-category first, then other products.

No API key required for recommendations; they use your existing product and category data.
