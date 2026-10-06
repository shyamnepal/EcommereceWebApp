import './StoreContent.css'

export default function About() {
  return (
    <div className="page store-content">
      <header className="store-hero-lite">
        <p className="store-kicker">Our story</p>
        <h1>Built for real miles</h1>
        <p>SoleStore started as a small studio obsessed with one thing: shoes that look good and still feel good at 6pm.</p>
      </header>
      <div className="store-prose">
        <p>
          We design and curate footwear for daily wear—commutes, weekends, and everything in between.
          Every pair we sell is chosen for fit, durability, and a clean silhouette you can actually live in.
        </p>
        <h2>What we stand for</h2>
        <ul>
          <li>Honest materials and honest sizing.</li>
          <li>Free shipping on orders over $75.</li>
          <li>30-day returns and easy size exchanges.</li>
          <li>Human support—no chatbot maze when something goes wrong.</li>
        </ul>
        <p>
          We ship from our warehouse quickly, pack every order with care, and stand behind what you wear.
          If a pair isn’t right, we’ll help you swap it.
        </p>
      </div>
    </div>
  )
}
