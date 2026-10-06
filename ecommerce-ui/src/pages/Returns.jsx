import { Link } from 'react-router-dom'
import './StoreContent.css'

export default function Returns() {
  return (
    <div className="page store-content">
      <header className="store-hero-lite">
        <p className="store-kicker">Peace of mind</p>
        <h1>Returns &amp; exchanges</h1>
        <p>Changed your mind or need a different size? You have 30 days.</p>
      </header>
      <div className="store-prose">
        <h2>How it works</h2>
        <ol>
          <li>Keep the shoes unworn (or gently tried on indoors) with the original box.</li>
          <li>Email us or use the <Link to="/contact">contact form</Link> with your order number.</li>
          <li>We’ll send a prepaid label for eligible returns.</li>
          <li>Refunds go back to your original payment method after we inspect the pair.</li>
        </ol>
        <h2>Exchanges</h2>
        <p>Size swaps are free. Tell us the size you want and we’ll ship the replacement as soon as the original is scanned in.</p>
        <h2>Not eligible</h2>
        <p>Worn outdoors, damaged, or missing insoles/boxes can’t be returned. Custom or final-sale items are marked on the product page.</p>
      </div>
    </div>
  )
}
