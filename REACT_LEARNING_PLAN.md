# React Career Switch – 12-Week Step-by-Step Plan

A week-by-week plan to go from C#/JavaScript to building real React projects and switching to a software developer role.

---

## Week 1: JavaScript Foundation (ES6+)

**Goal:** Feel confident with the JavaScript that React uses every day.

### Tasks
- [ ] **Day 1–2:** Variables (`let`, `const`), arrow functions, template literals  
  - *Create:* A small script that takes an array of names and returns greeting messages using `.map()` and template literals.
- [ ] **Day 3–4:** Destructuring (objects and arrays), spread operator `...`  
  - *Create:* A function that merges two objects and returns a new one (no mutation).
- [ ] **Day 5–6:** Promises and `async/await`  
  - *Create:* A script that fetches data from [JSONPlaceholder](https://jsonplaceholder.typicode.com/) (e.g. users or posts) and logs it using `async/await`.
- [ ] **Day 7:** Review + mini project  
  - *Create:* A simple "User list" in the browser: fetch users from JSONPlaceholder and render their names in a `<ul>` using vanilla JS (no React yet).

**Deliverable:** One small repo with the user list script and a README describing what you built.

---

## Week 2: React Setup & First Components

**Goal:** Run a React app locally and build your first components.

### Tasks
- [ ] **Day 1:** Install Node.js (if not installed). Create a new React app with Vite:  
  `npm create vite@latest my-first-react-app -- --template react`  
  Run it with `npm run dev`.
- [ ] **Day 2:** Read [React docs – Your First Component](https://react.dev/learn/your-first-component). Create 3 components: `Header`, `Footer`, `Main` and use them in `App.jsx`.
- [ ] **Day 3:** Learn JSX – expressions `{}`, attributes, styling with `className`.  
  - *Create:* A `Card` component that shows a title and description with basic CSS.
- [ ] **Day 4:** Props – pass different titles and descriptions into multiple `Card` components from `App`.
- [ ] **Day 5:** Conditional rendering (`&&`, ternary).  
  - *Create:* A `Alert` component that shows a message only when a prop `show` is true.
- [ ] **Day 6–7:** Lists and keys.  
  - *Create:* An array of 3–5 items (e.g. features or tips). Map over it and render a list of `Card` components with unique `key` props.

**Deliverable:** A small app (e.g. "Feature cards" or "Tips page") with reusable components. Push to GitHub.

---

## Week 3: State & Interactivity

**Goal:** Use state to make the UI respond to user actions.

### Tasks
- [ ] **Day 1–2:** `useState` – read React docs on [Adding Interactivity](https://react.dev/learn/adding-interactivity).  
  - *Create:* A counter: a number and two buttons (increment / decrement).
- [ ] **Day 3:** State and forms.  
  - *Create:* A simple form with one text input; display the value below as you type (controlled input).
- [ ] **Day 4:** Multiple state values.  
  - *Create:* A "Greeting" app: input for name, checkbox "formal?" – display "Hello, Mr/Ms [name]" or "Hey [name]" based on checkbox.
- [ ] **Day 5–6:** Lifting state up.  
  - *Create:* A "Theme toggle" – a button in a child component that switches between light/dark; parent holds the theme state and passes it down. Style the background/text colour based on theme.
- [ ] **Day 7:** Mini project  
  - *Create:* A "Favourite colour" picker: dropdown to choose colour, display "Your favourite colour is [colour]" and colour a small box. Use `useState` for the selected colour.

**Deliverable:** One React app with counter, form, theme toggle, and colour picker (or one combined small app). Push to GitHub.

---

## Week 4: Effects & Data Fetching

**Goal:** Load data from an API and show it in your app.

### Tasks
- [ ] **Day 1–2:** `useEffect` – read React docs on [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects).  
  - *Create:* A component that logs "Mounted" when it mounts and "Unmounting" when it unmounts (cleanup function).
- [ ] **Day 3:** Fetch in `useEffect`.  
  - *Create:* Fetch posts from `https://jsonplaceholder.typicode.com/posts` and store in state. Show a loading message, then list post titles.
- [ ] **Day 4:** Loading and error state.  
  - *Create:* Same posts list but with "Loading..." and "Error: [message]" when fetch fails (e.g. wrong URL or use a try/catch).
- [ ] **Day 5:** Fetch by ID.  
  - *Create:* A dropdown or buttons to select user ID 1–5. When selected, fetch that user from `https://jsonplaceholder.typicode.com/users/{id}` and display name and email.
- [ ] **Day 6–7:** Mini project  
  - *Create:* "User directory" – fetch all users, show as cards (name, email). Clicking a card fetches that user's posts and shows them below or in a modal. Use loading states.

**Deliverable:** User directory app with API data, loading, and basic error handling. Push to GitHub.

---

## Week 5: React Router & Multi-Page Feel

**Goal:** Build an app that feels like multiple pages (single-page app).

### Tasks
- [ ] **Day 1:** Install React Router: `npm install react-router-dom`.  
  - Set up `BrowserRouter`, `Routes`, `Route` in `App`. Create pages: `Home`, `About`, `Contact`.
- [ ] **Day 2:** Add `<Link>` and `<NavLink>` in a navbar. Style the active link.
- [ ] **Day 3:** Dynamic routes.  
  - *Create:* Route `/user/:id` – fetch user by ID from JSONPlaceholder and display on a "User detail" page.
- [ ] **Day 4:** 404 page. Create a `NotFound` component and add a catch-all route.
- [ ] **Day 5–7:** Mini project  
  - *Create:* "Blog" app – Home (list of posts from API), Post detail page (`/post/:id`), About page, Navbar. Clicking a post goes to its detail page.

**Deliverable:** Blog-style app with routing and API-driven post list and post detail. Push to GitHub.

---

## Week 6: Forms, Validation & UX

**Goal:** Build forms that feel solid and give feedback.

### Tasks
- [ ] **Day 1–2:** A full "Contact" form: name, email, message. On submit, prevent default, log form data (or send to a free service like Formspree for testing).
- [ ] **Day 3:** Basic validation – show errors if name is empty, email doesn’t contain `@`. Disable submit until valid (or show errors on submit).
- [ ] **Day 4:** Optional: use a library like React Hook Form or keep it with `useState` for each field and error.
- [ ] **Day 5–7:** Add to your blog or user directory: a "Add post" or "Add comment" form with validation and success/error messages.

**Deliverable:** At least one form with validation and submit handling in your existing project. Push updates to GitHub.

---

## Week 7: Context API & Shared State

**Goal:** Share state across the app without prop drilling.

### Tasks
- [ ] **Day 1–2:** Create a ThemeContext (light/dark). Provide it in `App`, use `useContext` in a child to toggle and display theme.
- [ ] **Day 3:** Create a "UserContext" that holds current user (e.g. object with name, email). Set it on a "Login" form (no real auth) and display "Logged in as [name]" in the header.
- [ ] **Day 4–5:** Add a "Favourites" or "Cart" context – array of IDs. Add "Add to favourites" on post or user cards; show count in header and a "Favourites" page listing them.
- [ ] **Day 6–7:** Refactor one of your apps (e.g. blog or user directory) to use Context for theme and user/favourites.

**Deliverable:** One app using Context for theme and at least one other global state. Push to GitHub.

---

## Week 8: TypeScript Basics (No React Yet)

**Goal:** Understand types so you can use TypeScript with React.

### Tasks
- [ ] **Day 1–2:** Types: `string`, `number`, `boolean`, `array`, `object`. Interfaces for object shapes.  
  - *Create:* A small `.ts` file with a `User` interface and a function that takes `User` and returns a greeting string.
- [ ] **Day 3:** Union types, optional props (`?`). Type a function that accepts `string | number`.
- [ ] **Day 4:** Generics – e.g. a function `firstElement<T>(arr: T[]): T`.
- [ ] **Day 5–7:** Convert one of your Week 2–3 React apps to TypeScript (rename to `.tsx`, add types for props and state). Fix all type errors.

**Deliverable:** One React app (e.g. counter + cards) fully typed with TypeScript. Push to GitHub.

---

## Week 9: React + TypeScript Project

**Goal:** Build a React + TypeScript app from scratch.

### Tasks
- [ ] **Day 1:** Create Vite React+TS project:  
  `npm create vite@latest my-ts-app -- --template react-ts`
- [ ] **Day 2–3:** Type your components – props interfaces, `React.FC` or plain functions with typed props. Type API response (e.g. `User`, `Post` interfaces).
- [ ] **Day 4–5:** Build a small "Dashboard" – fetch data from JSONPlaceholder (users + posts), display in typed components with loading/error states.
- [ ] **Day 6–7:** Add routing (React Router with TypeScript) and a simple form with typed state. Polish README.

**Deliverable:** Dashboard app in React + TypeScript with routing and API. Push to GitHub.

---

## Week 10: Portfolio Project – Pick One

**Goal:** One substantial project for your CV and interviews.

Choose one and build it over 2 weeks (Week 10 + 11):

### Option A: Job / Task Tracker
- List of job applications or tasks with status (Applied, Interview, Offer; or To Do, In Progress, Done).
- Add / edit / delete items. Filter by status. Data in `localStorage` or a simple backend (e.g. Supabase/Firebase).
- Responsive layout, clear UI.

### Option B: Personal Dashboard
- Weather widget (free API), notes/todos, maybe a habit tracker or quote of the day.
- Multiple sections, routing, theme toggle. Use Context for theme/settings.

### Option C: E-commerce Style (Front-End Only)
- Product list from API or JSON, product detail page, "Cart" (Context), checkout form with validation. No real payment.

### Week 10 tasks (for your chosen option)
- [ ] **Day 1–2:** Plan: list features, pages, components, and data flow.
- [ ] **Day 3–4:** Set up project (Vite + React + TypeScript + Router). Create folder structure and main components.
- [ ] **Day 5–7:** Implement core features: data display, main user flows (e.g. add to cart, add task, update status).

**Deliverable:** Project scaffold and core functionality working. Pushed to GitHub.

---

## Week 11: Finish Portfolio Project & Polish

**Goal:** Ship a complete, presentable project.

### Tasks
- [ ] **Day 1–3:** Finish remaining features (forms, filters, persistence if applicable).
- [ ] **Day 4:** Responsive CSS – mobile and desktop. Basic accessibility (labels, focus states, semantic HTML).
- [ ] **Day 5:** README: project name, description, how to run, tech stack, what you learned. Add a screenshot or short demo GIF if possible.
- [ ] **Day 6:** Deploy – Vite projects deploy easily on [Vercel](https://vercel.com) or [Netlify](https://netlify.com). Connect GitHub repo and add live link to README.
- [ ] **Day 7:** Update CV and LinkedIn: add project with name, tech (React, TypeScript, etc.), link to GitHub and live demo.

**Deliverable:** One deployed portfolio project, README, and updated CV/LinkedIn.

---

## Week 12: Second Project or Deepen Skills

**Goal:** Either a second portfolio piece or targeted interview prep.

### Option 1: Second Project (smaller)
- [ ] Build a simpler app in 4–5 days (e.g. quiz app, expense splitter, recipe finder using a free API). Deploy and add to GitHub/CV.

### Option 2: Interview & Job Readiness
- [ ] **Day 1–2:** List 10–15 common React/JS interview questions. Write short answers or code snippets (components, state, effects, keys, etc.).
- [ ] **Day 3:** Practise explaining your portfolio project in 2 minutes (what it does, tech, challenges, what you’d improve).
- [ ] **Day 4–5:** Apply to 5–10 UK roles (LinkedIn, CWJobs, Reed, Indeed). Tailor CV to "React", "JavaScript", "TypeScript", "Front-end".
- [ ] **Day 6–7:** Optional: Set up a simple personal portfolio site (one page: who you are, projects with links, contact). Deploy.

**Deliverable:** Either a second project live + on CV, or interview notes + applications sent + optional portfolio page.

---

## After the 12 Weeks

- Keep applying to UK roles; mention "career change" or "transitioning into software development" where relevant.
- Add every project to GitHub with clear READMEs and live links.
- Join UK-focused dev communities (e.g. local meetups, Twitter/LinkedIn React groups).
- Consider one backend project (e.g. Node/Express or C# API) so you can say "full-stack" if useful.

---

## Quick Reference – What You’ll Have Built

| Week | Main deliverable |
|------|-------------------|
| 1    | User list (vanilla JS + API) |
| 2    | Feature/tips cards (first React app) |
| 3    | Counter, forms, theme toggle, colour picker |
| 4    | User directory with API + loading/error |
| 5    | Blog app with routing |
| 6    | Forms with validation in your app |
| 7    | App using Context (theme, user/favourites) |
| 8    | One React app converted to TypeScript |
| 9    | React + TypeScript dashboard |
| 10–11| **Portfolio project** (tracker / dashboard / e-commerce style) – deployed |
| 12   | Second project or interview prep + applications |

Stick to one week at a time; ticking off tasks and pushing code each week will build both skills and confidence for your career switch.
