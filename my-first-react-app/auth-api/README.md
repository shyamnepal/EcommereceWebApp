# Auth API (.NET minimal API)

Simple login and signup API for the **my-first-react-app** React app.

## Endpoints

| Method | URL | Body | Description |
|--------|-----|------|-------------|
| POST | `/api/auth/signup` | `{ "email", "name", "password" }` | Create account (password min 6 chars) |
| POST | `/api/auth/login` | `{ "email", "password" }` | Sign in, returns `token` and `user` |

Data is stored **in memory** (resets when you stop the API). Use a database for a real app.

## Run the API

```bash
cd auth-api
dotnet run
```

Runs at **http://localhost:5000**. Keep this terminal open while using the React app.

## Run the React app

In another terminal:

```bash
npm run dev
```

Then open http://localhost:5173, go to Sign up or Sign in, and use the forms. They call this API.

## React integration (manual)

- API base URL is in `src/api/auth.js` (`API_BASE = 'http://localhost:5000'`).
- **Signup**: `src/pages/signup.jsx` calls `signup(email, name, password)` and navigates to `/otp` on success.
- **Login**: `src/pages/login.jsx` calls `login(email, password)` and navigates to `/` on success.
- To store the token for later (e.g. protected routes), in the `try` block after a successful login you can do:  
  `localStorage.setItem('token', data.token)` and use it in `fetch` headers:  
  `Authorization: Bearer ${localStorage.getItem('token')}`.
