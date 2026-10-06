import { Link } from 'react-router-dom'
import './StoreContent.css'

const FAQS = [
  ['How long does shipping take?', 'Most orders ship within 1 business day and arrive in 3–5 business days with standard delivery.'],
  ['Do you offer free shipping?', 'Yes—orders $75 and over ship free. Under that, standard shipping is added at checkout.'],
  ['What if the size is wrong?', 'Exchange within 30 days. We’ll send a prepaid label and ship the new size as soon as we receive the original pair.'],
  ['How do I track my order?', 'You’ll get an email with a tracking link when the label is created.'],
  ['Are the shoes authentic?', 'Every pair is sourced by SoleStore. We don’t sell replicas or third-party marketplace stock.'],
  ['Can I change or cancel an order?', 'If it hasn’t shipped, contact us the same day with your order number and we’ll try to stop it.'],
]

export default function Faq() {
  return (
    <div className="page store-content">
      <header className="store-hero-lite">
        <p className="store-kicker">Help</p>
        <h1>Frequently asked questions</h1>
        <p>Quick answers. Still stuck? <Link to="/contact">Contact support</Link>.</p>
      </header>
      <div className="faq-list">
        {FAQS.map(([q, a]) => (
          <details key={q} className="faq-item">
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
