# How to Use Navigation (Routing) in React

This guide teaches you how to switch between different "pages" (Home, Login, etc.) in React using **React Router**. You’ll do the steps yourself.

---

## 1. What is "routing"?

In a normal website, each page has its own URL (e.g. `yoursite.com/login`). In React, you usually have one HTML file and one app. **React Router** lets you show different components (Home, Login, etc.) based on the URL path, so it *feels* like multiple pages.

- `/` or `/home` → show **Home**
- `/login` → show **Login**

---

## 2. Install React Router

In the terminal, from your project folder (`my-first-react-app`), run:

```bash
npm install react-router-dom
```

---

## 3. Main pieces you need

| Thing | What it does |
|-------|----------------|
| **BrowserRouter** | Wraps your app so the router can read the URL. Use it once, usually in `main.jsx` or `App.jsx`. |
| **Routes** | A container where you list all your "paths" and which component to show. |
| **Route** | One "rule": "when the path is X, show component Y". |
| **Link** | A link that changes the URL without reloading the page (like `<a>` but for React Router). |
| **useNavigate** | A hook that lets you go to a path from code (e.g. after login). |

---

## 4. Step 1 – Wrap the app with BrowserRouter

You need the router at the top of the tree. Two options:

**Option A – in `main.jsx`**  
Wrap `<App />` with `<BrowserRouter>`:

```jsx
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

**Option B – in `App.jsx`**  
Wrap everything you return with `<BrowserRouter>`.

Use one of these; then the rest of the app can use `Routes`, `Route`, and `Link`.

---

## 5. Step 2 – Define routes in App.jsx

Instead of always showing `<Home />`, you tell the router: "for this path, show this component".

- Path **`/`** → show **Home**
- Path **`/login`** → show **Login**

You need:
1. Import: `Routes`, `Route` from `react-router-dom`.
2. Import your page components: `Home`, `Login`.
3. Use `<Routes>` and `<Route>`.

Example structure:

```jsx
import { Routes, Route } from 'react-router-dom'
import Home from './pages/home'
import Login from './pages/login'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  )
}
```

- **path** = URL path (e.g. `"/"`, `"/login"`).
- **element** = the component to render when the URL matches that path.

Try this: run the app, then in the browser address bar go to `http://localhost:5173/` and then `http://localhost:5173/login`. You should see Home and Login respectively.

---

## 6. Step 3 – Link between pages (no full reload)

Don’t use `<a href="/login">` for internal routes – that would reload the whole app. Use React Router’s **Link**:

```jsx
import { Link } from 'react-router-dom'

// Then in your JSX:
<Link to="/">Home</Link>
<Link to="/login">Login</Link>
```

- **to** is like `href` but the router handles it and only swaps the component.

Put these links where you want (e.g. in `Home.jsx` or in a shared header in `App.jsx`). When you click "Login", the URL becomes `/login` and the router shows `<Login />`.

---

## 7. Step 4 – Navigate from code (e.g. after login)

Sometimes you want to change the page from JavaScript (e.g. after a successful login). Use the **useNavigate** hook:

```jsx
import { useNavigate } from 'react-router-dom'

function Login() {
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    // ... do login ...
    navigate('/')   // go to home
    // or: navigate('/dashboard')
  }

  return (
    // ... your form ...
  )
}
```

- **navigate('/')** → go to home  
- **navigate('/login')** → go to login  
- **navigate(-1)** → go back one step in history  

---

## 8. Quick checklist (do it yourself)

1. [ ] Run `npm install react-router-dom`.
2. [ ] Add `<BrowserRouter>` in `main.jsx` (or `App.jsx`).
3. [ ] In `App.jsx`, use `<Routes>` and two `<Route>`s: `path="/"` → `<Home />`, `path="/login"` → `<Login />`. Remove the direct `<Home />` so the router controls what is shown.
4. [ ] Somewhere (e.g. Home or a small nav), add `<Link to="/">Home</Link>` and `<Link to="/login">Login</Link>`.
5. [ ] In `Login`, optionally use `useNavigate()` and call `navigate('/')` after submit.

---

## 9. Optional – 404 page

For any path that doesn’t match, you can show a "Not found" component:

```jsx
<Route path="*" element={<NotFound />} />
```

Create a simple `NotFound.jsx` that shows "Page not found" and use it as above. The `path="*"` means "any path that didn’t match the others".

---

## Summary

- **BrowserRouter** – wrap app once.
- **Routes + Route** – map URL path → component.
- **Link** – go to a path by clicking (no reload).
- **useNavigate** – go to a path from code.

Once you do these steps, you’ll have real navigation between Home and Login. If something doesn’t work, check: (1) BrowserRouter is wrapping the app, (2) paths in `Route` match the paths in `Link` and `navigate` (e.g. `/` and `/login`).
